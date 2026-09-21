"""Export the fp16 model weights for the raw WebNN runner.

Reads models/sr_x3_lightB_240x360_fp16.onnx and writes:
  models/webnn_weights_fp16.bin   -- fp16 weights, little-endian, packed in
                                     graph order: per conv [weight, bias],
                                     then per PReLU the alpha slope
  models/webnn_weights_fp16.json  -- manifest: conv shapes/pads/offsets,
                                     alpha channels/offsets

The runner (webnn_runner.js) rebuilds the graph with navigator.ml directly,
so no ORT wasm/jsep loader is involved.

Usage: python export_webnn.py
"""

import json
import os

import numpy as np
import onnx
from onnx import numpy_helper

HERE = os.path.dirname(os.path.abspath(__file__))
ONNX_PATH = os.path.join(HERE, 'models', 'sr_x3_lightB_240x360_fp16.onnx')
BIN_PATH = os.path.join(HERE, 'models', 'webnn_weights_fp16.bin')
JSON_PATH = os.path.join(HERE, 'models', 'webnn_weights_fp16.json')


def main():
    m = onnx.load(ONNX_PATH)
    inits = {i.name: numpy_helper.to_array(i) for i in m.graph.initializer}

    convs = []
    alphas = []
    bin_parts = []

    def put(arr, what):
        arr = np.asarray(arr, dtype=np.float16)
        assert arr.dtype == np.float16, f'{what} not fp16'
        off = sum(len(p) for p in bin_parts)
        raw = arr.tobytes()
        assert off % 2 == 0 and len(raw) % 2 == 0
        bin_parts.append(raw)
        return off

    for n in m.graph.node:
        if n.op_type == 'Conv':
            w = inits[n.input[1]]                      # [co, ci, kh, kw]
            b = inits[n.input[2]] if len(n.input) > 2 else np.zeros(
                w.shape[0], np.float16)
            pads = [int(v) for v in n.attribute[0].ints]   # [top,l,bottom,r]
            strides = [int(v) for v in n.attribute[1].ints]
            convs.append({
                'co': int(w.shape[0]), 'ci': int(w.shape[1]),
                'kh': int(w.shape[2]), 'kw': int(w.shape[3]),
                # WebNN padding order: [beginH, endH, beginW, endW]
                'pads': [pads[0], pads[2], pads[1], pads[3]],
                'strides': strides,
                'wOff': put(w, n.name + '_w'),
                'bOff': put(b, n.name + '_b'),
            })
        elif n.op_type == 'Mul':
            # PReLU expansion has two Muls per PReLU:
            #   Mul(relu(x), one_minus)  -> skip (constant ends in _one_minus)
            #   Mul(x, alpha)            -> the slope [C,1,1]
            consts = [i for i in n.input if i in inits]
            if len(consts) != 1:
                continue
            if consts[0].endswith('_one_minus'):
                continue
            slope = inits[consts[0]]
            if slope.ndim == 3 and slope.shape[0] > 1:
                alphas.append({'c': int(slope.size),
                               'off': put(slope.reshape(-1), n.name)})

    assert len(convs) == 7, f'expected 7 convs, got {len(convs)}'
    assert len(alphas) == 9, f'expected 9 PReLUs, got {len(alphas)}'

    with open(BIN_PATH, 'wb') as fp:
        fp.write(b''.join(bin_parts))
    manifest = {'convs': convs, 'alphas': alphas,
                'inH': 240, 'inW': 360, 'outH': 720, 'outW': 1080}
    with open(JSON_PATH, 'w') as fp:
        json.dump(manifest, fp, indent=1)
    print(f'wrote {BIN_PATH} ({len(b''.join(bin_parts))} bytes)')
    print(f'wrote {JSON_PATH}')
    print('convs:', [(c['co'], c['ci'], c['kh'], c['kw'], c['pads'],
                      c['strides']) for c in convs])
    print('alphas:', [a['c'] for a in alphas])


if __name__ == '__main__':
    main()
