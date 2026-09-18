// Scale decoder — port of conversion/_scale_decoder.py (UpsampleScaleDecoder,
// _normalize_and_pack, _get_mask_dual). Pure typed-array math, integer-exact.
//
// z_raw [1, 48, zh, zw] -> scales_0/scales_1 [1, 24, yh, yw]:
//   y_scales = |z_raw[:, :12]|
//   repeat-upsample: channel x4 (c -> c >> 2), spatial x4 (nearest) -> [48, zh*4, zw*4]
//   crop to [yh, yw], clip to [0, scale_levels-1]
//   dual checkerboard masks (same mask for both channel halves):
//     x1, x2 = split(mask0 * y_scales, 2, axis=1); scales_0 = x1 + x2
//     y1, y2 = split(mask1 * y_scales, 2, axis=1); scales_1 = y1 + y2

const maskCache = new Map();

function getDualMasks(yh, yw) {
  const key = `${yh}x${yw}`;
  let m = maskCache.get(key);
  if (!m) {
    const m0 = new Float32Array(yh * yw);
    const m1 = new Float32Array(yh * yw);
    for (let j = 0; j < yh; j++) {
      for (let i = 0; i < yw; i++) {
        const same = (j & 1) === (i & 1) ? 1 : 0;
        m0[j * yw + i] = same;
        m1[j * yw + i] = 1 - same;
      }
    }
    m = { m0, m1 };
    maskCache.set(key, m);
  }
  return m;
}

export class UpsampleScaleDecoder {
  constructor({ latentChannels = 48, channelRepeat = 4, scaleLevels = 128, yh, yw }) {
    this.latentChannels = latentChannels;
    this.channelRepeat = channelRepeat;
    this.baseChannels = latentChannels / channelRepeat;
    this.scaleMaxIdx = scaleLevels - 1;
    this.yh = yh;
    this.yw = yw;
    this.masks = getDualMasks(yh, yw);
    this._scalesBuf = new Float32Array(latentChannels * yh * yw);
    this._s0 = new Float32Array((latentChannels / 2) * yh * yw);
    this._s1 = new Float32Array((latentChannels / 2) * yh * yw);
  }

  // zRaw: flat Float32Array or Int32Array [48, zh, zw] row-major (zh x zw per channel)
  extractScales(zRaw, zh, zw) {
    const { yh, yw } = this;
    const scales = this._scalesBuf;
    const half = this.latentChannels >> 1;
    for (let c = 0; c < this.latentChannels; c++) {
      const baseC = c >> 2; // channel repeat 4: c -> c / 4
      const zOff = baseC * zh * zw;
      const sOff = c * yh * yw;
      for (let j = 0; j < yh; j++) {
        const zj = (j >> 2) * zw;
        for (let i = 0; i < yw; i++) {
          const v = Math.abs(zRaw[zOff + zj + (i >> 2)]);
          scales[sOff + j * yw + i] = v > this.scaleMaxIdx ? this.scaleMaxIdx : v;
        }
      }
    }
    // dual-mask packing: first channel half gets mask0, second half gets mask1
    // (complementary across halves — _get_mask_dual concat semantics):
    //   scales_0 = m0 * half0 + m1 * half1
    //   scales_1 = m1 * half0 + m0 * half1
    const { m0, m1 } = this.masks;
    const s0 = this._s0;
    const s1 = this._s1;
    const halfLen = half * yh * yw;
    const maskLen = yh * yw;
    for (let o = 0; o < halfLen; o++) {
      const mo = o % maskLen; // mask pattern repeats per channel
      s0[o] = scales[o] * m0[mo] + scales[halfLen + o] * m1[mo];
      s1[o] = scales[o] * m1[mo] + scales[halfLen + o] * m0[mo];
    }
    return { scales0: s0, scales1: s1 };
  }

  // Distribution indices for the y-decode (index space: trunc toward zero; values
  // are already in [0, scaleMaxIdx]).
  static toIndices(scales) {
    const out = new Int32Array(scales.length);
    for (let i = 0; i < scales.length; i++) out[i] = scales[i]; // exact integers as floats
    return out;
  }
}
