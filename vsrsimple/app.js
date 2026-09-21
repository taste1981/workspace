/* WebNN super-resolution app — fp16 lightB ONNX model via ORT.js.
 * EP fallback chain: webnn -> webgpu -> wasm; model fallback fp16 -> fp32.
 */
'use strict';

const H = 240, W = 360, OH = 720, OW = 1080;

const $ = (id) => document.getElementById(id);
const statusEl = $('status'), statsEl = $('stats');
const origCanvas = $('orig'), srCanvas = $('sr');
const origCtx = origCanvas.getContext('2d');
const srCtx = srCanvas.getContext('2d', { willReadFrequently: true });

const EPS = ['webnn', 'webgpu', 'wasm'];
const MODELS = [
  { path: 'models/sr_x3_lightB_240x360_fp16.onnx', dtype: 'float16', name: 'fp16' },
  { path: 'models/sr_x3_lightB_240x360_fp32.onnx', dtype: 'float32', name: 'fp32' },
];

let session = null, activeEP = null, activeModel = null;
let runner = null;  // raw WebNN runner (webnn_runner.js), used when ORT fails
let warm = false, lastTime = NaN, lastPsnr = NaN;
let initPromise = null, npuInfo = '…', jsepInfo = '…';

function setStats() {
  const t = Number.isFinite(lastTime) ? `${lastTime.toFixed(1)} ms` : '—';
  const p = Number.isFinite(lastPsnr) ? `${lastPsnr.toFixed(2)} dB` : '—';
  statsEl.innerHTML =
    `EP: <b>${activeEP ?? '—'}</b> · model: <b>${activeModel?.name ?? '—'}</b>` +
    ` · inference: <b>${t}</b> · PSNR vs bilinear luma: <b>${p}</b>` +
    ` · WebNN probe: <b>${npuInfo}</b>`;
}

/* ---------- device selection (WebNN deviceType passthrough) ---------- */

const DEVICE_OPTS = [
  { id: 'auto', deviceType: null },
  { id: 'npu', deviceType: 'npu' },
  { id: 'gpu', deviceType: 'gpu' },
  { id: 'cpu', deviceType: 'cpu' },
];
let selectedDevice = 'auto';

async function probeNPU() {
  if (!navigator.ml) return 'no navigator.ml';
  try {
    await navigator.ml.createContext({ deviceType: 'npu' });
    return 'NPU exposed';
  } catch (e) {
    try {
      await navigator.ml.createContext();
      return 'WebNN ok, NPU not exposed';
    } catch (e2) {
      return `WebNN unavailable (${e2.message})`;
    }
  }
}

/* ---------- fp16 helpers ---------- */

function packFp16(f32) {
  // manual fp32 -> fp16 bit packing (fallback when Float16Array is absent)
  const u16 = new Uint16Array(f32.length);
  const buf = new ArrayBuffer(4);
  const vi = new DataView(buf);
  for (let i = 0; i < f32.length; i++) {
    vi.setFloat32(0, f32[i]);
    const x = vi.getUint32(0);
    const sign = (x >>> 16) & 0x8000;
    let exp = (x >>> 23) & 0xff, mant = x & 0x7fffff;
    let e = exp - 127 + 15;
    if (exp === 0) e = 0;
    else if (exp === 0xff) e = 31;
    else if (e >= 31) { e = 31; mant = 0; }
    else if (e <= 0) {
      e = 0;
      mant = (mant | 0x800000) >> (1 - e + 13);
    }
    mant >>= 13;
    u16[i] = sign | (e << 10) | mant;
  }
  return u16;
}

function fp16ToF32(u16) {
  if (typeof Float16Array !== 'undefined') {
    return new Float32Array(new Float16Array(u16.buffer, u16.byteOffset,
                                             u16.length));
  }
  const out = new Float32Array(u16.length);
  for (let i = 0; i < u16.length; i++) {
    const h = u16[i];
    const sign = (h & 0x8000) ? -1 : 1;
    let exp = (h >> 10) & 0x1f, mant = h & 0x3ff;
    if (exp === 0) out[i] = sign * mant * 2 ** -24;
    else if (exp === 31) out[i] = mant ? NaN : sign * Infinity;
    else out[i] = sign * (1 + mant / 1024) * 2 ** (exp - 15);
  }
  return out;
}

/* ---------- image prep ---------- */

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source;
  });
}

/** Center-crop to the 2:3 model aspect and draw into a 240x360 canvas. */
function prepInput(img) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight); // cover
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return c;
}

function drawBilinear(img, canvas, w, h) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
}

function toLuma(imageData) {
  const { data, width, height } = imageData;
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i++) {
    const j = i * 4;
    out[i] = (0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2]) / 255;
  }
  return out;
}

/** Fuse SR luma into the bilinear-upscaled color image (YCbCr swap). */
function colorize(bilinearCanvas, srLuma, outCtx) {
  const w = bilinearCanvas.width, h = bilinearCanvas.height;
  const img = bilinearCanvas.getContext('2d').getImageData(0, 0, w, h);
  const { data } = img;
  for (let i = 0; i < w * h; i++) {
    const j = i * 4;
    const r = data[j], g = data[j + 1], b = data[j + 2];
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    const y = Math.min(255, Math.max(0, srLuma[i] * 255));
    data[j] = Math.min(255, Math.max(0, y + 1.402 * (cr - 128)));
    data[j + 1] = Math.min(255, Math.max(0,
      y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128)));
    data[j + 2] = Math.min(255, Math.max(0, y + 1.772 * (cb - 128)));
  }
  outCtx.putImageData(img, 0, 0);
}

/* ---------- inference ---------- */

/* ---------- raw graph visualization ---------- */

function renderGraph() {
  const expand = $('graphExpand').checked;
  // Encode the exact op sequence buildWebNNGraph() dispatches. Collapsed
  // (default): one node per PReLU/DepthToSpace for a clean 24-node view;
  // expanded: the true 56-op raw view.
  const nodes = [];
  const N = (op, ins, label, title) => {
    const id = `n${nodes.length}`;
    nodes.push({ id, op, ins, label, title });
    return id;
  };
  const P = (x, ai, tag) => {
    if (expand) {
      const r = N('relu', [x], tag);
      const ma = N('mul', [r], `×α${ai}`);
      const mb = N('mul', [x], `×(1−α${ai})`);
      return N('add', [ma, mb], `PReLU #${ai}`);
    }
    return N('prelu', [x], `PReLU #${ai}`,
             'α·x + (1−α)·relu(x)  [relu, mul, mul, add]');
  };
  const D = (x, tag) => {
    if (expand) {
      const r1 = N('reshape', [x], `${tag}.1 (b,b,C,H,W)`);
      const t = N('transpose', [r1], `${tag}.2`);
      return N('reshape', [t], `${tag}.3 (C,3H,3W)`);
    }
    return N('depthToSpace', [x], `${tag}`,
             'Reshape→Transpose→Reshape, 3×  [WebNN has no D2S op]');
  };

  const inp = N('input', [], '1×240×360×1');
  const xT = N('transpose', [inp], 'NHWC→NCHW');
  const up = N('resample', [xT], '3× linear (baseline U)');
  let f = P(N('conv2d', [xT], 'entry 32ch s3'), 0, '');
  const b0in = f;
  f = P(N('conv2d', [f], 'b0 conv1 32ch'), 1, '');
  f = P(N('conv2d', [f], 'b0 conv2 32ch'), 2, '');
  f = P(N('add', [b0in, f], 'b0 fuse'), 3, '');
  const b1in = f;
  f = P(N('conv2d', [f], 'b1 conv1 32ch'), 4, '');
  f = P(N('conv2d', [f], 'b1 conv2 32ch'), 5, '');
  f = P(N('add', [b1in, f], 'b1 fuse'), 6, '');
  f = P(N('conv2d', [f], 'recon 36ch'), 7, '');
  f = D(f, 'd2s #1');
  f = P(N('conv2d', [f], 'head 9ch'), 8, '');
  f = D(f, 'd2s #2');
  const out = N('add', [up, f], 'Y = U + R');
  const yT = N('transpose', [out], 'NCHW→NHWC');
  N('output', [yT], '1×720×1080×1');

  // longest-path layering (nodes are topologically ordered)
  const layer = {};
  for (const n of nodes) {
    layer[n.id] = n.ins.length
      ? Math.max(...n.ins.map((i) => layer[i])) + 1 : 0;
  }
  const byLayer = {};
  nodes.forEach((n) => {
    (byLayer[layer[n.id]] ??= []).push(n);
  });

  // geometry
  const GW = 110, GH = 42, GX = 30, GY = 20;
  const nLayers = Object.keys(byLayer).length;
  const maxPer = Math.max(...Object.values(byLayer).map((a) => a.length));
  const H = maxPer * (GH + GY) + 28;
  const W = nLayers * (GW + GX) + 28;
  const pos = {};
  for (const [L, arr] of Object.entries(byLayer)) {
    const total = arr.length * (GH + GY);
    arr.forEach((n, i) => {
      pos[n.id] = {
        x: Number(L) * (GW + GX) + 14,
        y: (H - total) / 2 + i * (GH + GY) + 14,
      };
    });
  }
  const colors = {
    conv2d: '#3d5a80', relu: '#7a4f3a', mul: '#5d4f8a', add: '#3f6b4f',
    prelu: '#6a4f80', depthToSpace: '#4f7a7a',
    transpose: '#4a5a6a', reshape: '#4a5a6a', resample: '#8a6d3a',
    input: '#2e2e2e', output: '#2e2e2e',
  };
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" ` +
    `height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" ` +
    `markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
    `<path d="M 0 0 L 8 4 L 0 8 z" fill="#55677c"/></marker></defs>`;
  for (const n of nodes) {
    const p = pos[n.id];
    for (const src of n.ins) {
      const s = pos[src];
      const x1 = s.x + GW, y1 = s.y + GH / 2;
      const x2 = p.x, y2 = p.y + GH / 2;
      const dx = Math.max(10, (x2 - x1) * 0.45);
      // horizontal lead-out / lead-in with a gentle S — crossings only
      // where lanes genuinely change, no mid-graph tangles
      svg += `<path d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ` +
        `${x2 - dx} ${y2}, ${x2} ${y2}" fill="none" stroke="#55677c" ` +
        `stroke-width="1.1" marker-end="url(#arr)"/>`;
    }
  }
  for (const n of nodes) {
    const p = pos[n.id];
    svg += `<g><rect x="${p.x}" y="${p.y}" width="${GW}" height="${GH}" ` +
      `rx="5" fill="${colors[n.op] ?? '#333'}" stroke="#223" />` +
      `<text x="${p.x + GW / 2}" y="${p.y + 17}" text-anchor="middle" ` +
      `font-size="10" fill="#e8edf3" font-family="system-ui" ` +
      `font-weight="600">${esc(n.op)}</text>` +
      `<text x="${p.x + GW / 2}" y="${p.y + 32}" text-anchor="middle" ` +
      `font-size="8" fill="#9fb0c3" font-family="system-ui">` +
      `${esc(n.label ?? '')}</text>` +
      `<title>${esc(n.op)}${n.label ? ': ' + esc(n.label) : ''}` +
      `${n.title ? '\n' + esc(n.title) : ''}</title></g>`;
  }
  svg += '</svg>';
  $('graphBox').innerHTML = svg;
}

/** One 240x360 luma tile through the active runtime; returns fp16 output. */
async function inferTile(luma) {
  if (runner) {
    const f16 = (typeof Float16Array !== 'undefined')
      ? new Float16Array(luma) : packFp16(luma);
    const u16in = f16 instanceof Float16Array
      ? new Uint16Array(f16.buffer, f16.byteOffset, f16.length) : f16;
    return runner.run(u16in);
  }
  let tensor;
  if (activeModel.dtype === 'float16') {
    const f16 = (typeof Float16Array !== 'undefined')
      ? new Float16Array(luma) : packFp16(luma);
    tensor = new ort.Tensor('float16', f16, [1, H, W, 1]);
  } else {
    tensor = new ort.Tensor('float32', luma, [1, H, W, 1]);
  }
  const results = await session.run({ input: tensor });
  const outData = results.output.data;
  return (activeModel.dtype === 'float16')
    ? (outData instanceof Uint16Array ? outData
       : new Uint16Array(outData.buffer))
    : outData;
}

async function runSR(img) {
  if (!session && !runner) {
    statusEl.textContent = 'runtime not ready yet — please wait';
    return;
  }

  // single-shot mode: the whole image squeezed (center-cropped) into the
  // model's one 240x360 input; output is the model's native 720x1080
  if ($('fitMode').checked) {
    const inputCanvas = prepInput(img);
    const luma = toLuma(inputCanvas.getContext('2d')
      .getImageData(0, 0, W, H));
    statusEl.textContent = `running inference on ${activeEP}…`;
    const t0 = performance.now();
    const outU16 = await inferTile(luma);
    const dt = performance.now() - t0;
    const srLuma = fp16ToF32(outU16);
    drawBilinear(img, origCanvas, W, H);
    const tmp = document.createElement('canvas');
    drawBilinear(img, tmp, OW, OH);
    colorize(tmp, srLuma, srCtx);
    $('srCap').textContent =
      `SR output — ${OW}×${OH} (single 240×360 input, 3×)`;
    $('origCap').textContent =
      `Original — ${W}×${H} (the model's 240×360 input window)`;
    statusEl.textContent = `done — ${dt.toFixed(1)} ms on ${activeEP}`;
    const baseLuma = toLuma(tmp.getContext('2d')
      .getImageData(0, 0, OW, OH));
    let mse = 0;
    for (let i = 0; i < srLuma.length; i++) {
      const d = srLuma[i] - baseLuma[i];
      mse += d * d;
    }
    mse /= srLuma.length;
    lastPsnr = mse > 0 ? 10 * Math.log10(1 / mse) : Infinity;
    lastTime = warm ? dt : NaN;
    warm = true;
    setStats();
    return;
  }

  // normalize the source: upscale tiny images so they fill at least one
  // 240x360 tile, then tile the image (model has a fixed 240x360 input)
  let src = img;
  let imgW = img.naturalWidth, imgH = img.naturalHeight;
  if (imgW < W || imgH < H) {
    const s = Math.max(W / imgW, H / imgH);
    const c = document.createElement('canvas');
    c.width = Math.ceil(imgW * s);
    c.height = Math.ceil(imgH * s);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    src = c;
    imgW = c.width;
    imgH = c.height;
  }
  const cols = Math.ceil(imgW / W);
  const rows = Math.ceil(imgH / H);
  const xs = [];
  const ys = [];
  for (let c = 0; c < cols; c++) xs.push(Math.min(c * W, imgW - W));
  for (let r = 0; r < rows; r++) ys.push(Math.min(r * H, imgH - H));

  const bigW = 3 * imgW, bigH = 3 * imgH;
  const srLuma = new Float32Array(bigW * bigH);
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = W;
  tileCanvas.height = H;
  const tileCtx = tileCanvas.getContext('2d');
  tileCtx.imageSmoothingEnabled = true;
  tileCtx.imageSmoothingQuality = 'high';

  let total = 0;
  let nzTotal = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = xs[c], y0 = ys[r];
      statusEl.textContent =
        `running tile ${c + r * cols + 1}/${cols * rows} on ${activeEP}…`;
      tileCtx.drawImage(src, x0, y0, W, H, 0, 0, W, H);
      const luma = toLuma(tileCtx.getImageData(0, 0, W, H));
      const t0 = performance.now();
      const outU16 = await inferTile(luma);
      total += performance.now() - t0;
      const tileLuma = fp16ToF32(outU16);
      // stitch the 3x tile block into the full-frame luma
      for (let ty = 0; ty < 3 * H; ty++) {
        const srcRow = ty * 3 * W;
        const dstRow = (3 * y0 + ty) * bigW + 3 * x0;
        srLuma.set(tileLuma.subarray(srcRow, srcRow + 3 * W), dstRow);
      }
    }
  }
  for (let i = 0; i < srLuma.length; i++) {
    if (srLuma[i] !== 0) nzTotal++;
  }
  console.warn(`[runner] full-frame output: nonzero=${nzTotal}/${srLuma.length}`);
  if (nzTotal === 0) {
    statusEl.textContent = 'warning: NPU output is all zeros — see console';
  }
  const dt = total;

  // panels: original at native size, SR at true 3x size
  statusEl.textContent = 'rendering…';
  drawBilinear(src, origCanvas, imgW, imgH);
  const tmp = document.createElement('canvas');
  drawBilinear(src, tmp, bigW, bigH);
  colorize(tmp, srLuma, srCtx);
  $('srCap').textContent =
    `SR output — ${bigW}×${bigH} (3× native; ${cols}×${rows} tiles of ` +
    `${W}×${H} → ${OW}×${OH} each; click to open full resolution)`;
  $('origCap').textContent = `Original — ${imgW}×${imgH} (native size)`;
  statusEl.textContent =
    `done — ${cols * rows} tiles, ${dt.toFixed(1)} ms on ${activeEP}`;

  // PSNR vs bilinear baseline (luma, 0..1)
  const baseLuma = toLuma(tmp.getContext('2d')
    .getImageData(0, 0, bigW, bigH));
  let mse = 0;
  for (let i = 0; i < srLuma.length; i++) {
    const d = srLuma[i] - baseLuma[i];
    mse += d * d;
  }
  mse /= srLuma.length;
  lastPsnr = mse > 0 ? 10 * Math.log10(1 / mse) : Infinity;
  lastTime = warm ? dt : NaN;
  warm = true;
  setStats();
}

/* ---------- init ---------- */

function drawSample() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2b5876'); g.addColorStop(1, '#0e8f6f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 12) {
    ctx.fillStyle = `rgba(255,255,255,${0.08 + 0.05 * Math.sin(x / 17)})`;
    ctx.fillRect(x, 0, 5, H);
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  for (let y = 0; y < H; y++) {
    const x = W / 2 + Math.sin(y / 11) * 90;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y); ctx.stroke();
  }
  ctx.fillStyle = '#f5f7fa';
  ctx.font = 'bold 34px system-ui';
  ctx.fillText('SR 3x', 40, 110);
  ctx.font = '16px system-ui';
  ctx.fillText('WebNN · fp16 lightB', 40, 140);
  ctx.beginPath(); ctx.arc(80, 250, 42, 0, Math.PI * 2);
  ctx.fillStyle = '#ef476f'; ctx.fill();
  ctx.fillStyle = '#f5f7fa'; ctx.fillRect(150, 215, 120, 70);
  return c;
}

/** Bundled test image (generated by gen_sample.py); falls back to the
 * procedural sample when the file is unavailable. */
async function getBundledSample() {
  try {
    const resp = await fetch('samples/sr_test_pattern_480x720.png');
    if (!resp.ok) throw new Error(resp.status);
    return URL.createObjectURL(await resp.blob());
  } catch (e) {
    console.warn('bundled sample unavailable, using procedural:', e);
    return drawSample().toDataURL();
  }
}

/** Diagnose the dynamic-import path ORT uses for WebNN/WebGPU (jsep). */
async function probeJsep() {
  const url = new URL('ort/ort-wasm-simd-threaded.jsep.mjs', document.baseURI);
  const parts = [`document.baseURI=${document.baseURI}`];
  try {
    const r = await fetch(url);
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    parts.push(`status=${r.status} mime=${ct}`);
    if (!r.ok || !ct.includes('javascript')) {
      parts.push('=> serve with: python serve.py (fixes .mjs MIME type)');
    }
  } catch (e) {
    parts.push(`fetch failed: ${e.message}`);
    if (document.baseURI.startsWith('file:')) {
      parts.push('=> page opened via file:// — use http://localhost:8123');
    }
  }
  return parts.join(' · ');
}

async function createSession() {
  ort.env.wasm.wasmPaths = 'ort/';
  // EP chain: webnn with the selected deviceType (auto tries NPU first),
  // then webgpu, then wasm. Each EP tries fp16 model first, then fp32.
  const dev = DEVICE_OPTS.find((d) => d.id === selectedDevice);
  const combos = [];
  if (dev.deviceType) {
    combos.push({ label: `webnn/${dev.deviceType}`, providers: [
      { name: 'webnn', deviceType: dev.deviceType }] });
  } else {
    combos.push({ label: 'webnn/npu', providers: [
      { name: 'webnn', deviceType: 'npu' }] });
    combos.push({ label: 'webnn', providers: ['webnn'] });
  }
  combos.push({ label: 'webgpu', providers: ['webgpu'] },
              { label: 'wasm', providers: ['wasm'] });

  let lastErr = '';
  runner = null;
  for (const c of combos) {
    for (const m of MODELS) {
      try {
        statusEl.textContent = `trying ${c.label} with ${m.name} model…`;
        const s = await ort.InferenceSession.create(m.path, {
          executionProviders: c.providers,
        });
        return { session: s, ep: c.label, model: m };
      } catch (e) {
        lastErr = `${c.label}: ${e.message}`;
        console.warn(`[${c.label}/${m.name}] failed:`, e);
      }
    }
  }
  // fallback: raw WebNN graph via navigator.ml (no ORT wasm/jsep loader)
  if (navigator.ml) {
    const dev = DEVICE_OPTS.find((d) => d.id === selectedDevice);
    // auto: prefer the NPU, then the default device
    const candidates = dev.deviceType ? [dev.deviceType] : ['npu', null];
    for (const dt of candidates) {
      try {
        statusEl.textContent =
          `trying raw WebNN runner (${dt || 'default'})…`;
        const r = await createWebNNRunner(dt);
        runner = r;
        return {
          session: null,
          ep: `webnn-raw(${dt || 'default'})`,
          model: MODELS[0],
        };
      } catch (e) {
        lastErr = `webnn-raw(${dt || 'default'}): ${e.message}`;
        console.warn('[webnn-raw] failed:', e);
      }
    }
  }
  statusEl.textContent = `no execution provider available (${lastErr})`;
  return null;
}

async function init() {
  npuInfo = await probeNPU();
  jsepInfo = await probeJsep();
  console.warn('[jsep probe]', jsepInfo);
  setStats();
  const created = await createSession();
  if (!created) {
    statusEl.textContent = 'no execution provider available';
    return;
  }
  session = created.session;
  activeEP = created.ep;
  activeModel = created.model;
  statusEl.textContent = `ready — ${activeEP}, ${activeModel.name} model`;
  setStats();
  try {
    const img = await loadImage(await getBundledSample());
    await runSR(img);
  } catch (e) {
    console.warn('warmup run failed:', e);
    statusEl.textContent =
      `ready — ${activeEP}, ${activeModel.name} model (warmup failed: ` +
      `${e.message})`;
  }
}

$('file').addEventListener('change', async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  await initPromise;
  if (!session) return;
  statusEl.textContent = 'running…';
  try {
    const img = await loadImage(URL.createObjectURL(f));
    await runSR(img);
  } catch (e) {
    statusEl.textContent = `error: ${e.message}`;
  }
});

$('sample').addEventListener('click', async () => {
  await initPromise;
  if (!session) return;
  statusEl.textContent = 'running…';
  try {
    const img = await loadImage(await getBundledSample());
    await runSR(img);
  } catch (e) {
    statusEl.textContent = `error: ${e.message}`;
  }
});

// click a canvas to open the full-resolution render in a new tab
for (const id of ['sr', 'orig']) {
  $(id).addEventListener('click', () => {
    $(id).toBlob((blob) => {
      if (blob) window.open(URL.createObjectURL(blob), '_blank');
    });
  });
}

$('bench').addEventListener('click', async () => {
  await initPromise;
  if (!runner) {
    statusEl.textContent = 'raw WebNN runner not active — cannot benchmark';
    return;
  }
  const img = await loadImage(await getBundledSample());
  const inputCanvas = prepInput(img);
  const luma = toLuma(inputCanvas.getContext('2d')
    .getImageData(0, 0, W, H));
  const f16 = (typeof Float16Array !== 'undefined')
    ? new Float16Array(luma) : packFp16(luma);
  const u16in = f16 instanceof Float16Array
    ? new Uint16Array(f16.buffer, f16.byteOffset, f16.length) : f16;

  const N = 200;
  const times = new Float64Array(N);
  let lastOut = null;
  for (let i = 0; i < N; i++) {
    const t0 = performance.now();
    lastOut = await runner.run(u16in);
    times[i] = performance.now() - t0;
    if (i % 20 === 19) {
      statusEl.textContent = `benchmark: ${i + 1}/${N} on ${activeEP}…`;
    }
  }
  times.sort();
  const sum = times.reduce((a, b) => a + b, 0);
  statusEl.textContent =
    `benchmark done (${activeEP}): avg=${(sum / N).toFixed(2)} ms · ` +
    `median=${times[N >> 1].toFixed(2)} · min=${times[0].toFixed(2)} · ` +
    `max=${times[N - 1].toFixed(2)} — watch Task Manager NPU graph`;
  // single-tile semantics: original 240x360, SR output 720x1080
  drawBilinear(img, origCanvas, W, H);
  const tmp = document.createElement('canvas');
  drawBilinear(img, tmp, OW, OH);
  colorize(tmp, fp16ToF32(lastOut), srCtx);
  $('srCap').textContent = `SR output — ${OW}×${OH} (single tile, 3×)`;
  $('origCap').textContent = `Original — ${W}×${H} (tile input)`;
});

$('device').addEventListener('change', (ev) => {
  selectedDevice = ev.target.value;
  session = null;
  activeEP = null;
  activeModel = null;
  warm = false;
  initPromise = init();
});

$('graphExpand').addEventListener('change', renderGraph);

renderGraph();
initPromise = init();
