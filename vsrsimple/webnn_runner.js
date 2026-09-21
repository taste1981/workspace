/* Raw WebNN runner — builds the SR graph with navigator.ml directly.
 * No ORT wasm/jsep loader involved; used as a fallback when the ORT EPs
 * cannot initialize. Weights come from export_webnn.py
 * (models/webnn_weights_fp16.bin/.json).
 */
'use strict';

function f16ToScalar(h) {
  const sign = (h & 0x8000) ? -1 : 1;
  const exp = (h >> 10) & 0x1f, mant = h & 0x3ff;
  if (exp === 0) return sign * mant * 2 ** -24;
  if (exp === 31) return mant ? NaN : sign * Infinity;
  return sign * (1 + mant / 1024) * 2 ** (exp - 15);
}

function scalarToF16(x) {
  const buf = new ArrayBuffer(4);
  const vi = new DataView(buf);
  vi.setFloat32(0, x);
  const v = vi.getUint32(0);
  const sign = (v >>> 16) & 0x8000;
  let exp = (v >>> 23) & 0xff, mant = v & 0x7fffff;
  let e = exp - 127 + 15;
  if (exp === 0) e = 0;
  else if (exp === 0xff) e = 31;
  else if (e >= 31) { e = 31; mant = 0; }
  else if (e <= 0) e = 0, mant = (mant | 0x800000) >> (1 - e + 13);
  mant >>= 13;
  return sign | (e << 10) | mant;
}

const IN_H = 240, IN_W = 360, OUT_H = 720, OUT_W = 1080;

async function fetchWeights() {
  const [man, binBuf] = await Promise.all([
    fetch('models/webnn_weights_fp16.json').then((r) => r.json()),
    fetch('models/webnn_weights_fp16.bin').then((r) => r.arrayBuffer()),
  ]);
  return { man, u16: new Uint16Array(binBuf) };
}

function buildWebNNGraph(ctx, man, u16, opts) {
  const builder = new MLGraphBuilder(ctx);
  const F16 = 'float16';
  // Float16Array where available (Uint16Array for fp16 is deprecated)
  const v16 = (byteOff, n) =>
    (typeof Float16Array !== 'undefined')
      ? new Float16Array(u16.buffer, byteOff, n)
      : new Uint16Array(u16.buffer, byteOff, n);
  // Newer WebNN spec/Chromium use MLOperandDescriptor.shape; older used
  // .dimensions. Feature-detect via the descriptor key the build attempt
  // was configured with (createWebNNRunner tries both).
  const D = (s) => opts.useShapeKey
    ? { dataType: F16, shape: s } : { dataType: F16, dimensions: s };

  // Newer spec renamed resample2d -> interpolate.
  const resample = (t, sizes) => {
    if (typeof builder.resample2d === 'function') {
      return builder.resample2d(t, { mode: 'linear', axes: [2, 3], sizes });
    }
    if (typeof builder.interpolate === 'function') {
      return builder.interpolate(t, { mode: 'linear', axes: [2, 3], sizes });
    }
    throw new Error('no resample2d/interpolate on MLGraphBuilder');
  };

  const x = builder.input('x', D([1, IN_H, IN_W, 1]));
  const xT = builder.transpose(x, { permutation: [0, 3, 1, 2] });

  // baseline upsampling path U(X)
  const up = resample(xT, [OUT_H, OUT_W]);

  const conv = (t, i) => {
    const c = man.convs[i];
    const w = builder.constant(D([c.co, c.ci, c.kh, c.kw]),
                               v16(c.wOff, c.co * c.ci * c.kh * c.kw));
    const b = builder.constant(D([c.co]), v16(c.bOff, c.co));
    return builder.conv2d(t, w, { padding: c.pads, strides: c.strides,
                                  bias: b });
  };

  // PReLU(x) = a*x + (1-a)*relu(x), per-channel slope
  const prelu = (t, ai) => {
    const a = man.alphas[ai];
    const slope = v16(a.off, a.c);
    const oneMinus = (typeof Float16Array !== 'undefined')
      ? new Float16Array(a.c) : new Uint16Array(a.c);
    for (let i = 0; i < a.c; i++) {
      oneMinus[i] = scalarToF16(1 - f16ToScalar(slope[i]));
    }
    const slopeC = builder.constant(D([1, a.c, 1, 1]), slope);
    const oneM = builder.constant(D([1, a.c, 1, 1]), oneMinus);
    return builder.add(builder.mul(t, slopeC),
                       builder.mul(builder.relu(t), oneM));
  };

  // DepthToSpace expansion: (N,C*9,H,W) -> (N,C,3H,3W), TFLite semantics
  const d2s = (t, cOut, h, w) => {
    const b = 3;
    if (opts.includeBatchInReshape) {
      const r1 = builder.reshape(t, [1, b, b, cOut, h, w]);
      const t1 = builder.transpose(r1, { permutation: [0, 3, 4, 1, 5, 2] });
      return builder.reshape(t1, [1, cOut, h * b, w * b]);
    }
    // WebNN reshape may exclude the (implicitly 1) batch dimension
    const r1 = builder.reshape(t, [b, b, cOut, h, w]);
    const t1 = builder.transpose(r1, { permutation: [2, 3, 1, 4, 0] });
    return builder.reshape(t1, [cOut, h * b, w * b]);
  };

  // detail path R(X): entry conv (spatial-scale conversion), 2 blocks,
  // progressive channel->spatial reconstruction
  let f = prelu(conv(xT, 0), 0);
  let b2 = prelu(conv(f, 1), 1);
  f = prelu(builder.add(f, prelu(conv(b2, 2), 2)), 3);
  b2 = prelu(conv(f, 3), 4);
  f = prelu(builder.add(f, prelu(conv(b2, 4), 5)), 6);
  f = prelu(conv(f, 5), 7);            // recon conv -> 36ch
  f = d2s(f, 4, 80, 120);              // -> (1,4,240,360)
  f = prelu(conv(f, 6), 8);            // head conv -> 9ch
  f = d2s(f, 1, 240, 360);             // -> (1,1,720,1080) = R(X)

  const y = builder.add(up, f);        // Y = U(X) + R(X)
  const yT = builder.transpose(y, { permutation: [0, 2, 3, 1] });
  return builder.build({ output: yT });
}

async function createWebNNRunner(deviceType) {
  let ctx;
  try {
    ctx = await navigator.ml.createContext(
      deviceType ? { deviceType } : undefined);
    console.warn(`[webnn-raw] context created (deviceType: `
                 + `${deviceType || 'default'})`);
  } catch (e) {
    console.warn(`[webnn-raw] deviceType '${deviceType}' failed `
                 + `(${e.message}), using default context`);
    ctx = await navigator.ml.createContext();
  }
  const { man, u16 } = await fetchWeights();

  // Try the descriptor/reshape API variants: {shape|dimensions} x
  // {batch in reshape|batch excluded}. Graph building is cheap.
  let graph = null, lastErr = null;
  for (const useShapeKey of [true, false]) {
    for (const incBatch of [true, false]) {
      try {
        graph = await buildWebNNGraph(ctx, man, u16,
                                      { useShapeKey, includeBatchInReshape: incBatch });
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (graph) break;
  }
  if (!graph) {
    throw new Error(`WebNN graph build failed: ${lastErr?.message}`);
  }

  // WebNN execution entry point has moved between spec revisions:
  // MLContext.compute(graph, ...) -> MLGraph.compute(...) -> possibly
  // renamed again. Discover it instead of guessing.
  const findExec = () => {
    for (const [obj, names] of [
      [graph, ['compute', 'execute', 'dispatch', 'infer', 'run']],
      [ctx, ['compute', 'execute', 'dispatch', 'infer', 'run']],
    ]) {
      for (const n of names) {
        if (typeof obj[n] === 'function') return { obj, name: n };
      }
    }
    for (const [label, obj] of [['graph', graph], ['ctx', ctx]]) {
      const proto = obj.constructor?.prototype ?? Object.getPrototypeOf(obj);
      const props = Object.getOwnPropertyNames(proto)
        .filter((p) => typeof obj[p] === 'function');
      console.warn(`[webnn] ${label} methods:`, props);
    }
    return null;
  };

  const toF16 = (u16v) => (typeof Float16Array !== 'undefined' &&
                           !(u16v instanceof Float16Array))
    ? new Float16Array(u16v.buffer, u16v.byteOffset, u16v.length)
    : u16v;
  const normOut = (v) => v instanceof Uint16Array ? v
    : new Uint16Array(v.buffer, v.byteOffset, v.length);

  // MLTensor-based execution (newest spec): create once, write/dispatch/
  // read per run. Extra descriptor keys are ignored where unsupported.
  let inTensor = null, outTensor = null;
  const hasTensorAPI = typeof ctx.createTensor === 'function';

  return {
    async run(inputU16) {  // [1,240,360,1] fp16 (Uint16Array)
      const input = toF16(inputU16);
      if (hasTensorAPI) {
        if (!inTensor) {
          // createTensor returns a Promise in current spec revisions
          inTensor = await ctx.createTensor(
            { dataType: 'float16', shape: [1, IN_H, IN_W, 1],
              writable: true, readable: true });
          outTensor = await ctx.createTensor(
            { dataType: 'float16', shape: [1, OUT_H, OUT_W, 1],
              writable: true, readable: true });
        }
        if (typeof ctx.writeTensor === 'function') {
          await ctx.writeTensor(inTensor, input);
        } else {
          inTensor = await ctx.createTensor(
            { dataType: 'float16', shape: [1, IN_H, IN_W, 1],
              writable: true, readable: true }, input);
        }
        const dres = await ctx.dispatch(graph, { x: inTensor },
                                        { output: outTensor });
        let out = null;
        if (typeof ctx.readTensor === 'function') {
          // some revisions: readTensor(tensor) returns a view; others:
          // readTensor(tensor, targetBuffer) copies into the buffer
          const buf = (typeof Float16Array !== 'undefined')
            ? new Float16Array(OUT_H * OUT_W)
            : new Uint16Array(OUT_H * OUT_W);
          try {
            const r2 = await ctx.readTensor(outTensor, buf);
            console.warn('[runner] readTensor(2-arg) result:',
              r2?.constructor?.name, 'len', r2?.length,
              'byteLength', r2?.byteLength);
            out = (r2 !== undefined && (r2.length ?? 0) > 0)
              ? normOut(r2) : normOut(buf);
          } catch (e) {
            console.warn('[runner] readTensor(2-arg) failed:',
              e.message, '-- trying 1-arg');
            const r1 = await ctx.readTensor(outTensor);
            console.warn('[runner] readTensor(1-arg) result:',
              r1?.constructor?.name, 'len', r1?.length,
              'byteLength', r1?.byteLength);
            out = normOut(r1);
          }
        } else {
          const o = dres?.outputs?.output;
          if (!o || !o.data) {
            throw new Error('cannot read dispatch output '
                            + '(no ctx.readTensor, no result data)');
          }
          out = normOut(o.data);
        }
        if (!out || out.length === 0) {
          throw new Error('dispatch output read is empty '
                          + '(readTensor returned no data)');
        }
        console.warn('[runner] raw output fp16 (first 8):',
          Array.from(out.slice(0, 8)).map((v) => `0x${v.toString(16)}`));
        return out;
      }

      // ArrayBufferView-based execution (older specs)
      const outBuf = (typeof Float16Array !== 'undefined')
        ? new Float16Array(OUT_H * OUT_W)
        : new Uint16Array(OUT_H * OUT_W);
      const exec = findExec();
      if (!exec) {
        throw new Error('no execution method found on graph/ctx '
                        + '(method lists logged to console)');
      }
      const res = (exec.obj === graph)
        ? await graph[exec.name]({ x: input }, { output: outBuf })
        : await ctx[exec.name](graph, { x: input }, { output: outBuf });
      return normOut(res.outputs.output);
    },
  };
}
