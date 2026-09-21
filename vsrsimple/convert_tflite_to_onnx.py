"""Convert the SR .tflite models to ONNX (fp16 or fp32 preserved).

Maps the flatbuffer graph op-by-op to ONNX, keeping every weight byte
identical (fp16 stays fp16, fp32 stays fp32):

  TFLite (NHWC)              ONNX (NCHW, opset 17)
  CONV_2D (SAME)        ->   Conv (pads computed, weights transposed
                             [kh,kw,ci,co] -> [co,ci,kh,kw])
  PRELU (per-channel)   ->   PRelu (alpha reshaped to [C,1,1])
  ADD                   ->   Add
  DEPTH_TO_SPACE (3)    ->   DepthToSpace (mode=DCR, blocksize=3)
  RESIZE_BILINEAR       ->   Resize (mode=linear,
                             coordinate_transformation_mode=half_pixel,
                             sizes=[1,1,3H,3W])
  (NHWC I/O)            ->   Transpose [0,3,1,2] at entry / [0,2,3,1] at exit

The output ONNX model keeps the same I/O contract as the TFLite file:
[N, H, W, 1] -> [N, 3H, 3W, 1].

Usage:
  python convert_tflite_to_onnx.py --tflite <in.tflite> --onnx <out.onnx>
                                   [--verify <ref_fp32.tflite>]
"""

import argparse
import sys

import numpy as np
import onnx
from onnx import helper, numpy_helper, TensorProto
from tensorflow.lite.python import schema_py_generated as schema_fb

BUILTIN = {
    'ADD': 0, 'CONV_2D': 3, 'DEPTH_TO_SPACE': 5,
    'RESIZE_BILINEAR': 23, 'PRELU': 54,
}


def builtin_name(model, op):
    code = model.operatorCodes[op.opcodeIndex]
    bc = code.builtinCode if code.builtinCode != 0 else code.deprecatedBuiltinCode
    return {v: k for k, v in BUILTIN.items()}.get(bc, bc)


def initializer(name, data, dtype, shape):
    """Build a TensorProto holding raw little-endian data bytes."""
    t = numpy_helper.from_array(
        np.frombuffer(data, dtype=dtype).reshape(shape), name=name)
    return t


def convert(tflite_bytes, expand_d2s=False):
    model = schema_fb.ModelT.InitFromObj(
        schema_fb.Model.GetRootAsModel(tflite_bytes, 0))
    sg = model.subgraphs[0]
    tensors = sg.tensors

    # tensor index -> dtype/shape/buffer
    tinfo = []
    for t in tensors:
        tinfo.append((t.type, [int(d) for d in t.shape], t.buffer))
    is_fp16 = tinfo[0][0] == schema_fb.TensorType.FLOAT16
    np_dtype = np.float16 if is_fp16 else np.float32
    onnx_dtype = TensorProto.FLOAT16 if is_fp16 else TensorProto.FLOAT

    def buf_data(i):
        b = model.buffers[i]
        return bytes(b.data) if b.data is not None else b''

    in_idx = sg.inputs[0]
    out_idx = sg.outputs[0]
    ih, iw = tinfo[in_idx][1][1], tinfo[in_idx][1][2]  # [1,H,W,1]

    nodes = []
    initializers = []
    inputs_info = [helper.make_tensor_value_info('input', onnx_dtype,
                                                 [1, ih, iw, 1])]
    outputs_info = [helper.make_tensor_value_info('output', onnx_dtype,
                                                  [1, 3 * ih, 3 * iw, 1])]

    def v(idx):
        return 'input' if idx == in_idx else f't{idx}'

    # entry transpose: NHWC -> NCHW
    nodes.append(helper.make_node('Transpose', [v(in_idx)], ['input_nchw'],
                                  perm=[0, 3, 1, 2]))

    # constants that ops consume as inputs
    constant_names = set()

    def emit_constant(idx):
        """Register a tflite constant tensor as an ONNX initializer."""
        name = v(idx)
        if name in constant_names:
            return name
        constant_names.add(name)
        typ, shape, buf = tinfo[idx]
        data = buf_data(buf)
        if typ == schema_fb.TensorType.INT32:
            arr = np.frombuffer(data, np.int32).astype(np.int64)
            initializers.append(numpy_helper.from_array(arr, name=name))
        else:
            # fp32 or fp16 weight: keep the bytes untouched
            initializers.append(initializer(name, data, np_dtype, shape))
        return name

    def emit_custom(name, arr):
        """Register an initializer under the given name, with transformed
        content (e.g. transposed weights, reshaped alpha)."""
        if name not in constant_names:
            constant_names.add(name)
            initializers.append(numpy_helper.from_array(arr, name=name))
        return name

    import os as _os
    max_ops = int(_os.environ.get('SR_MAXOPS', '999999'))
    last_outs = None
    for op in sg.operators[:max_ops]:
        name = builtin_name(model, op)
        # the model input is NHWC in TFLite; internal ONNX consumers must
        # take the NCHW-transposed value instead
        ins = ['input_nchw' if i == in_idx else v(i)
               for i in op.inputs if i >= 0]
        outs = [v(o) for o in op.outputs if o >= 0]
        node_name = f'{name.lower()}_{len(nodes)}'

        if name == 'CONV_2D':
            o = op.builtinOptions
            x = ins[0]
            # TFLite conv filter layout is [co, kh, kw, ci]
            w = emit_custom(v(op.inputs[1]), np.transpose(
                np.frombuffer(buf_data(tinfo[op.inputs[1]][2]), np_dtype)
                .reshape(tinfo[op.inputs[1]][1]),  # [co,kh,kw,ci]
                (0, 3, 1, 2)).copy())              # -> [co,ci,kh,kw]
            b = (emit_constant(op.inputs[2]) if len(op.inputs) > 2 else '')
            # weight layout [co, kh, kw, ci]
            kh, kw = tinfo[op.inputs[1]][1][1], tinfo[op.inputs[1]][1][2]
            # SAME padding arithmetic
            in_h, in_w = (tinfo[op.inputs[0]][1][1], tinfo[op.inputs[0]][1][2])
            sh, sw = o.strideH, o.strideW
            oh = -(-in_h // sh)
            ow = -(-in_w // sw)
            pad_h = max(0, (oh - 1) * sh + kh - in_h)
            pad_w = max(0, (ow - 1) * sw + kw - in_w)
            pads = [pad_h // 2, pad_w // 2, pad_h - pad_h // 2,
                    pad_w - pad_w // 2]
            nodes.append(helper.make_node(
                'Conv', [x, w] + ([b] if b else []), outs,
                strides=[sh, sw], pads=pads, name=node_name))
        elif name == 'PRELU':
            alpha_idx = op.inputs[1]
            c = tinfo[alpha_idx][1][-1]
            # alpha [1,1,C] (NHWC) -> slope [C,1,1]: right-aligned broadcast
            # maps C onto the NCHW channel dim. PReLU is emitted as its
            # algebraic expansion a*x + (1-a)*relu(x): every op has solid
            # fp16 kernels on CPU/GPU/WebNN EPs (ORT decomposes its own
            # PRelu for fp16 and trips shape inference on it).
            a_arr = np.frombuffer(buf_data(tinfo[alpha_idx][2]),
                                  np_dtype).reshape(-1, c).T.reshape(c, 1, 1)
            a = emit_custom(v(alpha_idx), a_arr)
            one_minus = emit_custom(
                f'{v(alpha_idx)}_one_minus',
                (np.ones((c, 1, 1), dtype=np_dtype) - a_arr)
                .astype(np_dtype))
            relu_out, m1, m2 = (f'{outs[0]}_relu', f'{outs[0]}_m1',
                                f'{outs[0]}_m2')
            nodes.append(helper.make_node('Relu', [ins[0]], [relu_out],
                                          name=node_name + '_relu'))
            nodes.append(helper.make_node('Mul', [relu_out, one_minus], [m1],
                                          name=node_name + '_m1'))
            nodes.append(helper.make_node('Mul', [ins[0], a], [m2],
                                          name=node_name + '_m2'))
            nodes.append(helper.make_node('Add', [m2, m1], outs,
                                          name=node_name))
        elif name == 'ADD':
            nodes.append(helper.make_node('Add', ins, outs, name=node_name))
        elif name == 'DEPTH_TO_SPACE':
            block = op.builtinOptions.blockSize
            if not expand_d2s:
                nodes.append(helper.make_node('DepthToSpace', ins, outs,
                                              blocksize=block, mode='DCR',
                                              name=node_name))
            else:
                # WebNN has no DepthToSpace: expand to
                # Reshape (N,b,b,C,H,W) -> Transpose (N,C,H,b,W,b)
                # -> Reshape (N,C,bH,bW).
                # Matches the TFLite/ORT DepthToSpace channel decomposition
                # k = c + C_out*(i + b*j)  (verified empirically against the
                # ORT-native DCR op; note ONNX docs' DCR formula differs).
                ih_, iw_, c9 = tinfo[op.inputs[0]][1][1:]
                c_out = c9 // (block * block)
                sh1 = emit_custom(f'{outs[0]}_sh1',
                                  np.array([1, block, block, c_out, ih_, iw_],
                                           dtype=np.int64))
                sh2 = emit_custom(f'{outs[0]}_sh2',
                                  np.array([1, c_out, block * ih_, block * iw_],
                                           dtype=np.int64))
                r1, t1 = f'{outs[0]}_r1', f'{outs[0]}_t1'
                nodes.append(helper.make_node('Reshape', [ins[0], sh1], [r1],
                                              name=node_name + '_r1'))
                nodes.append(helper.make_node('Transpose', [r1], [t1],
                                              perm=[0, 3, 4, 1, 5, 2],
                                              name=node_name + '_t1'))
                nodes.append(helper.make_node('Reshape', [t1, sh2], outs,
                                              name=node_name + '_r2'))
        elif name == 'RESIZE_BILINEAR':
            size_idx = op.inputs[1]
            # tflite size is [3H,3W] (NHWC); ONNX wants NCHW [1,1,3H,3W]
            sz = emit_custom(v(size_idx),
                             np.array([1, 1, 3 * ih, 3 * iw], dtype=np.int64))
            nodes.append(helper.make_node(
                'Resize', [ins[0], '', '', sz], outs, mode='linear',
                coordinate_transformation_mode='half_pixel', name=node_name))
        else:
            raise ValueError(f'unsupported op: {name}')
        last_outs = outs

    if len(sg.operators) <= max_ops:
        # full graph: exit transpose NCHW -> NHWC
        nodes.append(helper.make_node('Transpose', [v(out_idx)], ['output'],
                                      perm=[0, 2, 3, 1]))
    else:
        # truncated (debug): expose the last op's output directly
        outputs_info = [helper.make_tensor_value_info(
            'output', onnx_dtype, None)]
        nodes.append(helper.make_node('Identity', [last_outs[0]], ['output']))

    graph = helper.make_graph(nodes, 'sr_x3_lightB', inputs_info,
                              outputs_info, initializers)
    opset = helper.make_opsetid('', 17)
    m = helper.make_model(graph, opset_imports=[opset], producer_name='tflite2onnx-sr')
    m.ir_version = 9
    return m


def verify(onnx_bytes, ref_tflite_path):
    """Run the ONNX model (CPU EP) and compare against the TFLite fp32 model."""
    import onnxruntime as ort
    import tensorflow as tf

    sess = ort.InferenceSession(onnx_bytes, providers=['CPUExecutionProvider'])
    interp = tf.lite.Interpreter(model_path=ref_tflite_path)
    interp.allocate_tensors()

    rng = np.random.default_rng(1234)
    x = rng.uniform(0.0, 1.0, size=[1, 240, 360, 1]).astype(np.float32)
    x16 = x.astype(np.float16)

    y_ort = sess.run(['output'], {'input': x16})[0].astype(np.float32)

    interp.set_tensor(interp.get_input_details()[0]['index'], x)
    interp.invoke()
    y_tfl = interp.get_tensor(interp.get_output_details()[0]['index']) \
        .astype(np.float32)

    max_abs = float(np.max(np.abs(y_ort - y_tfl)))
    max_rel = float(np.max(np.abs(y_ort - y_tfl) / (np.abs(y_tfl) + 1e-3)))
    print(f'  onnx out: dtype={sess.get_outputs()[0].type} '
          f'shape={y_ort.shape}')
    print(f'  vs tflite fp32: max_abs_diff={max_abs:.5f} '
          f'max_rel_diff={max_rel:.5f}')
    return max_abs < 0.05


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--tflite', required=True)
    ap.add_argument('--onnx', required=True)
    ap.add_argument('--verify', default=None,
                    help='reference fp32 .tflite for numeric verification')
    ap.add_argument('--expand-d2s', action='store_true',
                    help='expand DepthToSpace into Reshape/Transpose/Reshape '
                         '(WebNN has no DepthToSpace op)')
    args = ap.parse_args()

    with open(args.tflite, 'rb') as fp:
        tflite_bytes = fp.read()
    m = convert(tflite_bytes, expand_d2s=args.expand_d2s)
    onnx_bytes = m.SerializeToString()
    with open(args.onnx, 'wb') as fp:
        fp.write(onnx_bytes)
    print(f'wrote {args.onnx} ({len(onnx_bytes)} bytes)')

    onnx.checker.check_model(m)
    print('  onnx checker: OK')

    if args.verify:
        ok = verify(onnx_bytes, args.verify)
        print(f'  verify: {"OK" if ok else "FAILED"}')
        sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
