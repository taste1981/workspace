// Frame loop — port of conversion/_frame_loop.py + _split_model/_base_split_model.py
// for the dmc61sbr_e1d1 split (encoder + decoder ONNX, WASM entropy coder, JS scale
// decoder). Encoder and decoder reference features are kept in separate managers.
import { calcPsnr, yuv420To444Nearest, padEdgeToModel, cropAndToYuv420, x444ToYuv420 } from "./yuv.js";
import { FrameType, RateController } from "./rateController.js";
import { UpsampleScaleDecoder } from "./scaleDecoder.js";

const ZERO = new Float32Array(0);

class RefManager {
  constructor() {
    this.frames = new Map(); // frameIdx -> { feature: Float32Array, ltr: boolean }
  }

  load(refIdx, featureReset, zeroFeature) {
    if (refIdx === null || featureReset) return { refFeature: zeroFeature, refExists: false };
    const entry = this.frames.get(refIdx);
    return entry ? { refFeature: entry.feature, refExists: true } : { refFeature: zeroFeature, refExists: false };
  }

  save(idx, feature, markAsLtr) {
    this.frames.set(idx, { feature, ltr: markAsLtr });
    // _prune: keep newest non-LTR only + newest 3 LTRs
    const nonLtr = [];
    const ltr = [];
    for (const [k, v] of this.frames) (v.ltr ? ltr : nonLtr).push(k);
    if (nonLtr.length > 1) {
      nonLtr.sort((a, b) => a - b);
      for (const k of nonLtr.slice(0, -1)) this.frames.delete(k);
    }
    if (ltr.length > 3) {
      ltr.sort((a, b) => a - b);
      for (const k of ltr.slice(0, -3)) this.frames.delete(k);
    }
  }

  clear() {
    this.frames.clear();
  }
}

export class MlvcFrameLoop {
  constructor({
    encoderSession, // { run(feeds: {name: Tensor}) -> Promise<{name: Tensor}> }
    decoderSession,
    frameCodec, // FrameCodec (WASM entropy coder)
    params, // model/video geometry + coding params (see below)
    rate, // { mode: 'cq', qIndex: number } | { mode: 'cbr', controller: RateController }
    qIndexOverrides = {}, // frameId -> qIndex (sticky)
  }) {
    this._enc = encoderSession;
    this._dec = decoderSession;
    this._codec = frameCodec;
    this._params = params;
    this._rate = rate;
    this._qIndexOverrides = qIndexOverrides;

    const { modelW, modelH, featureChannels, latentChannels } = params;
    this._featH = modelH / 8;
    this._featW = modelW / 8;
    this._zh = Math.ceil(modelH / 64);
    this._zw = Math.ceil(modelW / 64);
    this._yh = Math.ceil(modelH / 16);
    this._yw = Math.ceil(modelW / 16);

    this._zeroFeature = new Float32Array(featureChannels * this._featH * this._featW);
    this._scaleDecoder = new UpsampleScaleDecoder({
      latentChannels,
      channelRepeat: params.yScaleRepeat ?? 4,
      scaleLevels: 128,
      yh: this._yh,
      yw: this._yw,
    });

    this._refEnc = new RefManager();
    this._refDec = new RefManager();

    // loop state
    this.curFrameIdx = 0;
    this.presentationTime = 0.0;
    this.latestLtrFrameIdx = null;
    this.lastReconstructed = null;
    this.lastReconstructedX444 = null;
    this.qIndexOverride = null;
    this.frameId = 0; // absolute frame counter (incl. drops)
  }

  reset() {
    this._refEnc.clear();
    this._refDec.clear();
    this.curFrameIdx = 0;
    this.presentationTime = 0.0;
    this.latestLtrFrameIdx = null;
    this.lastReconstructed = null;
    this.lastReconstructedX444 = null;
    this.qIndexOverride = null;
  }

  _qShift() {
    const { frameIndexMap, qpShift } = this._params;
    return qpShift[frameIndexMap[(this.curFrameIdx + 1) % frameIndexMap.length]];
  }

  async processFrame(yuv420, { forceIframe = false, prePadded = false, x444 = null, skipMetrics = false } = {}) {
    const { fps, videoW, videoH, modelW, modelH, iframePeriod, resetPeriod, ltrStartIdx, ltrPeriod, proactiveLtrRecovery = true } = this._params;
    const t0 = performance.now();

    // x444 mode (WebGL capture): the encoder input tensor is supplied directly
    // at model dims. The CPU metric reference is derived from it (yuv420 may be
    // null); when skipMetrics is set the worker computes PSNR on the GPU instead.
    const metricRef = skipMetrics ? null : x444 ? x444ToYuv420(x444, videoW, videoH, modelW) : yuv420;

    this.presentationTime += 1.0 / fps;

    // ---- frame type decision ----
    let frameType = FrameType.P_FRAME;
    if (this.frameId === 0 || forceIframe || (iframePeriod !== null && this.curFrameIdx % iframePeriod === 0)) {
      frameType = FrameType.I_FRAME;
      this.curFrameIdx = 0;
      this.latestLtrFrameIdx = null;
      this._refEnc.clear();
      this._refDec.clear();
    }
    const featureReset = resetPeriod !== null && resetPeriod !== undefined && (this.curFrameIdx + 1) % resetPeriod === 0;
    const markAsLtr =
      ltrPeriod !== null && ltrPeriod > 0 && (this.curFrameIdx === ltrStartIdx || (this.curFrameIdx > ltrStartIdx && this.curFrameIdx % ltrPeriod === 0));
    if (frameType !== FrameType.I_FRAME && proactiveLtrRecovery && markAsLtr && this.latestLtrFrameIdx !== null) {
      frameType = FrameType.LTR_RECOVERY;
    }

    let refFrameIdx;
    if (frameType === FrameType.I_FRAME) refFrameIdx = null;
    else if (frameType === FrameType.P_FRAME) refFrameIdx = this.curFrameIdx - 1;
    else refFrameIdx = this.latestLtrFrameIdx;

    // ---- rate control / q resolution ----
    if (this.frameId in this._qIndexOverrides) this.qIndexOverride = this._qIndexOverrides[this.frameId];

    let qIndex;
    if (this.qIndexOverride !== null && this.qIndexOverride !== undefined) {
      qIndex = this.qIndexOverride;
    } else if (this._rate.mode === "cbr") {
      qIndex = this._rate.controller.solveQIndex(this.presentationTime, frameType, 0);
    } else {
      qIndex = this._rate.qIndex;
    }

    // ---- frame drop ----
    if (qIndex === null || qIndex === -1) {
      const droppable = frameType === FrameType.P_FRAME && !markAsLtr && !featureReset;
      if (droppable && this.lastReconstructed) {
        const rec = this.lastReconstructed;
        const metrics = skipMetrics ? null : this._metrics(metricRef, rec, 0);
        this.frameId += 1;
        return {
          frameType,
          dropped: true,
          qIndex: -1,
          bits: 0,
          psnr: metrics?.psnr ?? null,
          psnrY: metrics?.psnrY ?? null,
          psnrU: metrics?.psnrU ?? null,
          psnrV: metrics?.psnrV ?? null,
          bpp: metrics?.bpp ?? 0,
          reconstructed: rec,
          reconstructedX444: this.lastReconstructedX444,
          rcInfo: null,
          encMs: performance.now() - t0,
          decMs: 0,
          entropyMs: 0,
        };
      }
      qIndex = 0; // non-droppable fallback
    }

    // ---- encode ----
    const tEnc0 = performance.now();
    let x;
    let pad;
    if (x444) {
      // WebGL capture emitted the full-res [Y,U,V] tensor at model dims already
      x = x444;
      pad = [0, 0, 0, 0];
    } else if (prePadded) {
      // planes already cover the model dims (edge pad done upstream)
      x = yuv420To444Nearest(yuv420, modelW, modelH);
      pad = [0, 0, 0, 0];
    } else {
      const xv = yuv420To444Nearest(yuv420, videoW, videoH);
      ({ x, pad } = padEdgeToModel(xv, videoW, videoH, modelW, modelH));
    }
    const qShifted = qIndex + this._qShift();

    const encRef = this._refEnc.load(refFrameIdx, featureReset, this._zeroFeature);
    const encOut = await this._enc.run({
      x,
      ref_feature: encRef.refFeature,
      q_index_shifted: Int32Array.of(qShifted),
    });
    const encMs = performance.now() - tEnc0;

    // entropy coding
    const tEnt0 = performance.now();
    const scales = this._scaleDecoder.extractScales(encOut.z_raw, this._zh, this._zw);
    const payload = this._codec.encodeFrame({
      yRaw1: encOut.y_raw_1,
      scales1: scales.scales1,
      yRaw0: encOut.y_raw_0,
      scales0: scales.scales0,
      zRaw: encOut.z_raw,
      qIndex,
      zh: this._zh,
      zw: this._zw,
    });
    const bits = 8 * payload.length;
    const entropyMs = performance.now() - tEnt0;

    let rcInfo = null;
    if (this._rate.mode === "cbr") {
      rcInfo = this._rate.controller.update(0, bits);
    }
    this._refEnc.save(this.curFrameIdx, encOut.feature, markAsLtr);

    // ---- decode ----
    const tDec0 = performance.now();
    const decRef = this._refDec.load(refFrameIdx, featureReset, this._zeroFeature);
    const { zRaw, yRaw0, yRaw1 } = this._codec.decodeFrame(payload, {
      qIndex,
      zh: this._zh,
      zw: this._zw,
      yh: this._yh,
      yw: this._yw,
      scalesFromZ: (zOut) => {
        const s = this._scaleDecoder.extractScales(zOut, this._zh, this._zw);
        return {
          indices0: UpsampleScaleDecoder.toIndices(s.scales0),
          indices1: UpsampleScaleDecoder.toIndices(s.scales1),
        };
      },
    });
    const decOut = await this._dec.run({
      z_raw: Float32Array.from(zRaw),
      y_raw_0: Float32Array.from(yRaw0),
      y_raw_1: Float32Array.from(yRaw1),
      ref_feature: decRef.refFeature,
      q_index_shifted: Int32Array.of(qShifted),
    });
    this._refDec.save(this.curFrameIdx, decOut.feature, markAsLtr);
    const decMs = performance.now() - tDec0;

    const reconstructed = cropAndToYuv420(decOut.x_hat, videoW, videoH, pad);
    const metrics = skipMetrics ? null : this._metrics(metricRef, reconstructed, bits);

    // ---- state updates ----
    if (markAsLtr) this.latestLtrFrameIdx = this.curFrameIdx;
    this.curFrameIdx += 1;
    this.lastReconstructed = reconstructed;
    this.lastReconstructedX444 = decOut.x_hat;
    this.frameId += 1;

    return {
      frameType,
      dropped: false,
      qIndex,
      bits,
      psnr: metrics?.psnr ?? null,
      psnrY: metrics?.psnrY ?? null,
      psnrU: metrics?.psnrU ?? null,
      psnrV: metrics?.psnrV ?? null,
      bpp: metrics?.bpp ?? 0,
      reconstructed,
      reconstructedX444: decOut.x_hat,
      rcInfo,
      encMs,
      decMs,
      entropyMs,
      frameIdx: this.curFrameIdx - 1,
    };
  }

  _metrics(orig, rec, bits) {
    const { videoW, videoH } = this._params;
    const psnrY = calcPsnr(orig.y, rec.y);
    const psnrU = calcPsnr(orig.u, rec.u);
    const psnrV = calcPsnr(orig.v, rec.v);
    const psnr = (6 * psnrY + psnrU + psnrV) / 8;
    const bpp = bits / (videoW * videoH);
    return { psnrY, psnrU, psnrV, psnr, bpp };
  }

  destroy() {
    this._codec.destroy();
  }
}

export function createRateController(mode, videoW, videoH, fps) {
  if (mode.mode === "cq") return null;
  return new RateController(videoW, videoH, mode.bitrateBitsPerSec, fps);
}

export { ZERO };
