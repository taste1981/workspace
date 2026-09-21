/* Headless smoke test: load the fp16 ONNX through the ORT JS API (Node EP)
 * and verify the same tensor flow the webapp uses. */
const ort = require('onnxruntime-web');

(async () => {
  const session = await ort.InferenceSession.create(
    'models/sr_x3_lightB_240x360_fp16.onnx',
    { executionProviders: ['cpu'] });
  console.log('session OK; input:', JSON.stringify(session.inputNames),
    'output:', JSON.stringify(session.outputNames));

  const n = 240 * 360;
  const f32 = new Float32Array(n);
  for (let i = 0; i < n; i++) f32[i] = (i % 251) / 251;
  // fp32 -> fp16 packing (same as app.js fallback)
  const u16 = new Uint16Array(n);
  const dv = new DataView(new ArrayBuffer(4));
  for (let i = 0; i < n; i++) {
    dv.setFloat32(0, f32[i]);
    const x = dv.getUint32(0);
    const sign = (x >>> 16) & 0x8000;
    let exp = (x >>> 23) & 0xff, mant = x & 0x7fffff;
    let e = exp - 127 + 15;
    if (exp === 0) e = 0;
    else if (exp === 0xff) e = 31;
    else if (e >= 31) { e = 31; mant = 0; }
    else if (e <= 0) e = 0, mant = (mant | 0x800000) >> (1 - e + 13);
    mant >>= 13;
    u16[i] = sign | (e << 10) | mant;
  }
  const tensor = new ort.Tensor('float16', u16, [1, 240, 360, 1]);

  const t0 = Date.now();
  const results = await session.run({ input: tensor });
  console.log('ran in', Date.now() - t0, 'ms');

  const out = results.output;
  console.log('output:', out.type, out.dims.join('x'),
    'data type:', out.data.constructor.name);

  // decode fp16 (app.js fp16ToF32)
  const u16out = out.data instanceof Uint16Array ? out.data
    : new Uint16Array(out.data.buffer, out.data.byteOffset, out.data.length);
  const f16out = new Float32Array(u16out.length);
  for (let i = 0; i < u16out.length; i++) {
    const h = u16out[i];
    const sign = (h & 0x8000) ? -1 : 1;
    const exp = (h >> 10) & 0x1f, mant = h & 0x3ff;
    if (exp === 0) f16out[i] = sign * mant * 2 ** -24;
    else if (exp === 31) f16out[i] = mant ? NaN : sign * Infinity;
    else f16out[i] = sign * (1 + mant / 1024) * 2 ** (exp - 15);
  }

  // cross-check against the fp32 twin
  const s32 = await ort.InferenceSession.create(
    'models/sr_x3_lightB_240x360_fp32.onnx',
    { executionProviders: ['cpu'] });
  const t32 = new ort.Tensor('float32', f32, [1, 240, 360, 1]);
  const r32 = await s32.run({ input: t32 });
  let maxAbs = 0;
  const d32 = r32.output.data;
  for (let i = 0; i < f16out.length; i += 997) {
    maxAbs = Math.max(maxAbs, Math.abs(f16out[i] - d32[i]));
  }
  console.log('fp16 vs fp32 twin max|diff| (sampled):', maxAbs.toFixed(6));
})();
