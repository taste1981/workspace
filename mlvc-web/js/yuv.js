// YUV / RGB conversions — port of video/src/transforms/functional.py (BT.709)
// and the numpy pre/post-processing of conversion/_split_model/_base_split_model.py.
// All plane buffers are Float32Array in [0, 1]; RGB is Uint8ClampedArray RGBA.

const KR = 0.2126;
const KG = 0.7152;
const KB = 0.0722;

const clip01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// RGBA (Uint8ClampedArray, 4 bytes/px) -> YUV420 planes [0,1]
// y: h*w, u: (h/2)*(w/2), v: (h/2)*(w/2). Chroma = 2x2 mean of per-pixel cb/cr, clip after.
export function rgbaToYuv420(rgba, w, h) {
  const y = new Float32Array(h * w);
  const u = new Float32Array((h / 2) * (w / 2));
  const v = new Float32Array((h / 2) * (w / 2));
  const hw = w >> 1;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = (j * w + i) * 4;
      const r = rgba[o] / 255;
      const g = rgba[o + 1] / 255;
      const b = rgba[o + 2] / 255;
      y[j * w + i] = clip01(KR * r + KG * g + KB * b);
      if ((j & 1) === 0 && (i & 1) === 0) {
        // accumulate 2x2 averages of cb/cr per pixel (clip at the end)
        const c = (j >> 1) * hw + (i >> 1);
        let cbSum = 0;
        let crSum = 0;
        for (let dj = 0; dj < 2; dj++) {
          for (let di = 0; di < 2; di++) {
            const p = ((j + dj) * w + (i + di)) * 4;
            const pr = rgba[p] / 255;
            const pg = rgba[p + 1] / 255;
            const pb = rgba[p + 2] / 255;
            const py = KR * pr + KG * pg + KB * pb;
            cbSum += 0.5 * (pb - py) / (1 - KB) + 0.5;
            crSum += 0.5 * (pr - py) / (1 - KR) + 0.5;
          }
        }
        u[c] = clip01(cbSum / 4);
        v[c] = clip01(crSum / 4);
      }
    }
  }
  return { y, u, v };
}

// YUV420 -> YUV444 channel-first [3, H, W], NEAREST chroma repeat (order=0),
// matching the encoder feed path (ycbcr420_to_444 / scipy zoom order 0).
export function yuv420To444Nearest(yuv420, w, h) {
  const { y, u, v } = yuv420;
  const out = new Float32Array(3 * h * w);
  const hw = w >> 1;
  const hh = h >> 1;
  out.set(y, 0); // Y plane as-is
  const uOff = h * w;
  const vOff = 2 * h * w;
  for (let j = 0; j < h; j++) {
    const sj = j >> 1;
    for (let i = 0; i < w; i++) {
      const si = i >> 1;
      const c = sj * hw + si;
      out[uOff + j * w + i] = u[c];
      out[vOff + j * w + i] = v[c];
    }
  }
  return out;
}

// Pad the [3,H,W] tensor to model dims bottom-right with EDGE replication.
// Returns the padded tensor and the padding tuple (left, right, top, bottom).
export function padEdgeToModel(x444, w, h, modelW, modelH) {
  const padW = modelW - w;
  const padH = modelH - h;
  if (padW === 0 && padH === 0) return { x: x444, pad: [0, 0, 0, 0] };
  const out = new Float32Array(3 * modelW * modelH);
  for (let c = 0; c < 3; c++) {
    const src = c * w * h;
    const dst = c * modelW * modelH;
    for (let j = 0; j < modelH; j++) {
      const sj = Math.min(j, h - 1);
      for (let i = 0; i < modelW; i++) {
        const si = Math.min(i, w - 1);
        out[dst + j * modelW + i] = x444[src + sj * w + si];
      }
    }
  }
  return { x: out, pad: [0, padW, 0, padH] };
}

// Crop padding off a reconstructed [3,modelH,modelW] tensor, then YUV444 -> YUV420
// (U/V 2x2 box average, Y full-res). Returns {y,u,v} float planes.
export function cropAndToYuv420(xHat, w, h, pad) {
  const [padL, , padT] = pad; // left, right, top, bottom (bottom-right crop from origin)
  const modelW = w + pad[0] + pad[1];
  const modelH = h + pad[2] + pad[3];
  const y = new Float32Array(h * w);
  const u = new Float32Array((h >> 1) * (w >> 1));
  const v = new Float32Array((h >> 1) * (w >> 1));
  const hw = w >> 1;
  const plane = modelW * modelH;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const src = (j + padT) * modelW + (i + padL);
      y[j * w + i] = clip01(xHat[src]);
      if ((j & 1) === 0 && (i & 1) === 0) {
        const c = (j >> 1) * hw + (i >> 1);
        // channel layout is [Y, U, V]; U plane at offset plane, V at 2*plane
        u[c] = clip01(
          (xHat[plane + src] + xHat[plane + src + 1] + xHat[plane + src + modelW] + xHat[plane + src + modelW + 1]) / 4
        );
        v[c] = clip01(
          (xHat[2 * plane + src] + xHat[2 * plane + src + 1] + xHat[2 * plane + src + modelW] + xHat[2 * plane + src + modelW + 1]) / 4
        );
      }
    }
  }
  return { y, u, v };
}

// YUV420 -> RGBA (Uint8ClampedArray) with bilinear chroma upsample
// (scipy zoom order 1 == F.interpolate align_corners=False semantics) and
// the BT.709 inverse matrix.
export function yuv420ToRgba(yuv420, w, h) {
  const { y, u, v } = yuv420;
  const rgba = new Uint8ClampedArray(w * h * 4);
  const hw = w >> 1;
  const hh = h >> 1;
  const sampleU = (sj, si) => u[Math.min(Math.max(sj, 0), hh - 1) * hw + Math.min(Math.max(si, 0), hw - 1)];
  const sampleV = (sj, si) => v[Math.min(Math.max(sj, 0), hh - 1) * hw + Math.min(Math.max(si, 0), hw - 1)];
  for (let j = 0; j < h; j++) {
    // bilinear chroma coordinate: src = (o + 0.5) / 2 - 0.5
    let sy = (j + 0.5) / 2 - 0.5;
    let y0 = Math.floor(sy);
    if (y0 < 0) y0 = 0;
    let y1 = y0 + 1;
    if (y1 > hh - 1) y1 = hh - 1;
    const wy = sy - y0;
    for (let i = 0; i < w; i++) {
      let sx = (i + 0.5) / 2 - 0.5;
      let x0 = Math.floor(sx);
      if (x0 < 0) x0 = 0;
      let x1 = x0 + 1;
      if (x1 > hw - 1) x1 = hw - 1;
      const wx = sx - x0;
      const c00 = sampleU(y0, x0) * (1 - wy) + sampleU(y1, x0) * wy;
      const c01 = sampleU(y0, x1) * (1 - wy) + sampleU(y1, x1) * wy;
      const cb = c00 * (1 - wx) + c01 * wx;
      const d00 = sampleV(y0, x0) * (1 - wy) + sampleV(y1, x0) * wy;
      const d01 = sampleV(y0, x1) * (1 - wy) + sampleV(y1, x1) * wy;
      const cr = d00 * (1 - wx) + d01 * wx;

      const yy = y[j * w + i];
      const r = clip01(yy + 1.5748 * (cr - 0.5));
      const b = clip01(yy + 1.8556 * (cb - 0.5));
      const g = clip01((yy - KR * r - KB * b) / KG);
      const o = (j * w + i) * 4;
      rgba[o] = Math.round(r * 255);
      rgba[o + 1] = Math.round(g * 255);
      rgba[o + 2] = Math.round(b * 255);
      rgba[o + 3] = 255;
    }
  }
  return rgba;
}

// Planar byte planes from the WebGL capture -> float YUV420 in [0,1].
// yBytes: w*h; uvBytes: interleaved U/V, (w/2)*(h/2)*2 bytes.
export function yuv420PlanesToFloat(yBytes, uvBytes, w, h) {
  const y = new Float32Array(w * h);
  const half = (w >> 1) * (h >> 1);
  const u = new Float32Array(half);
  const v = new Float32Array(half);
  for (let i = 0; i < y.length; i++) y[i] = yBytes[i] / 255;
  for (let i = 0; i < half; i++) {
    u[i] = uvBytes[2 * i] / 255;
    v[i] = uvBytes[2 * i + 1] / 255;
  }
  return { y, u, v };
}

// Full-res (444) planes from the WebGL capture -> the encoder's channel-first
// [Y, U, V] float tensor at MODEL dims. yBytes: w*h; uvBytes: interleaved
// full-res U/V, w*h*2 bytes. No upsampling or padding happens on the CPU.
export function planes444ToX(yBytes, uvBytes, w, h) {
  const plane = w * h;
  const x = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    x[i] = yBytes[i] / 255;
    x[plane + i] = uvBytes[2 * i] / 255;
    x[2 * plane + i] = uvBytes[2 * i + 1] / 255;
  }
  return x;
}

// Derive YUV420 (video dims) from a model-size channel-first [Y,U,V] tensor —
// used for PSNR/metrics against the reconstructed frame. Y is cropped to the
// video rect (modelW == videoW for all resolutions here, so the first
// videoW*videoH entries are exact); U/V are 2x2-box-averaged.
export function x444ToYuv420(x, videoW, videoH, modelW) {
  const modelH = x.length / 3 / modelW;
  const plane = modelW * modelH;
  const y = new Float32Array(videoW * videoH);
  for (let j = 0; j < videoH; j++) {
    y.set(x.subarray(j * modelW, j * modelW + videoW), j * videoW);
  }
  const hw = videoW >> 1;
  const hh = videoH >> 1;
  const u = new Float32Array(hw * hh);
  const v = new Float32Array(hw * hh);
  for (let j = 0; j < hh; j++) {
    for (let i = 0; i < hw; i++) {
      const s = (2 * j) * modelW + 2 * i;
      const c = j * hw + i;
      u[c] = (x[plane + s] + x[plane + s + 1] + x[plane + s + modelW] + x[plane + s + modelW + 1]) / 4;
      v[c] = (x[2 * plane + s] + x[2 * plane + s + 1] + x[2 * plane + s + modelW] + x[2 * plane + s + modelW + 1]) / 4;
    }
  }
  return { y, u, v };
}

// PSNR between two [0,1] float planes of equal shape (per-pixel MSE over the plane)
export function calcPsnr(x1, x2) {
  let sum = 0;
  for (let i = 0; i < x1.length; i++) {
    const d = x1[i] - x2[i];
    sum += d * d;
  }
  const mse = sum / x1.length;
  if (!Number.isFinite(mse)) return -999.9;
  if (mse < 1e-10) return 999.9;
  return -10 * Math.log10(mse);
}
