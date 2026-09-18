// 1:1 port of video/src/utils/rate_controller.py (the CBR controller).
// VBV-style leaky bucket + per-frame-type exponential rate models.
// int() in the Python is trunc-toward-zero; clip semantics mirror numpy.

export const FrameType = Object.freeze({
  I_FRAME: "i_frame",
  P_FRAME: "p_frame",
  LTR_RECOVERY: "ltr_recovery",
});

const clipInt = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

class LeakyBucket {
  constructor(bitrate, fps, bucketSize = 1.0, initialLevel = 0.1) {
    this._bitrate = bitrate;
    this._fps = fps;
    this._bucketSize = bucketSize;
    this._initialLevel = initialLevel;
    this._capacityBits = Math.trunc(bitrate * bucketSize);
    this._fillBits = Math.trunc(initialLevel * this._capacityBits);
    this._lastDrainTimestamp = null;
  }

  configure(bitrate, fps) {
    if (bitrate !== null && bitrate !== undefined) {
      const excess = this._fillBits - Math.trunc(this._initialLevel * this._capacityBits);
      const newCap = Math.trunc(bitrate * this._bucketSize);
      this._bitrate = bitrate;
      this._capacityBits = newCap;
      this._fillBits = clipInt(Math.trunc(this._initialLevel * newCap) + excess, 0, newCap);
    }
    if (fps !== null && fps !== undefined) this._fps = fps;
  }

  calcDrainSecs(presentationTime) {
    if (this._lastDrainTimestamp === null) return 1.0 / this._fps;
    return presentationTime - this._lastDrainTimestamp;
  }

  calcFillBits(presentationTime) {
    return this._fillBits - this._calcDrainBits(presentationTime);
  }

  update(presentationTime, frameBits) {
    this._fillBits = this.calcFillBits(presentationTime) + frameBits;
    this._lastDrainTimestamp = presentationTime;
  }

  get bitrate() {
    return this._bitrate;
  }
  get fps() {
    return this._fps;
  }
  get capacityBits() {
    return this._capacityBits;
  }
  get level() {
    return this._fillBits / this._capacityBits;
  }

  _calcDrainBits(presentationTime) {
    return Math.min(this._fillBits, Math.trunc(this.calcDrainSecs(presentationTime) * this._bitrate));
  }
}

class RateAllocator {
  constructor(bitrate, fps, targetLevel = 0.1, overshootTau = 0.25, undershootTau = 1.0, plannedExcessTau = 0.5) {
    this._targetLevel = targetLevel;
    this._overshootTau = overshootTau;
    this._undershootTau = undershootTau;
    this._plannedExcessTau = plannedExcessTau;
    this._bucket = new LeakyBucket(bitrate, fps, 1.0, targetLevel);
    this._accumulatedExcessBits = 0;
  }

  configure(bitrate, fps) {
    this._bucket.configure(bitrate, fps);
  }

  allocate(presentationTime, frameWeight, undershootTau = null, overshootTau = null) {
    const nominal = Math.trunc(frameWeight * (this._bucket.bitrate / this._bucket.fps));
    const plannedExcess = this._calcPlannedExcessBits(presentationTime, frameWeight);
    const targetFill = Math.trunc(this._targetLevel * this._bucket.capacityBits) + plannedExcess;
    const currentFill = this._bucket.calcFillBits(presentationTime);
    const errorBits = targetFill - (currentFill + nominal);
    const tau = errorBits >= 0 ? (undershootTau ?? this._undershootTau) : (overshootTau ?? this._overshootTau);
    const correction = Math.trunc((1.0 / (tau * this._bucket.fps)) * errorBits);
    const bucketMax = Math.trunc(0.9 * this._bucket.capacityBits);
    const headroom = bucketMax - currentFill;
    let allocated = clipInt(
      Math.min(nominal + correction, headroom),
      Math.trunc(0.33 * nominal),
      Math.trunc(2.0 * nominal)
    );
    if (currentFill + allocated > bucketMax) allocated = 0; // -> frame drop
    return {
      nominalBits: nominal,
      allocatedBits: allocated,
      effectiveTargetLevel: targetFill / this._bucket.capacityBits,
      estimatedLevel: (currentFill + allocated) / this._bucket.capacityBits,
    };
  }

  update(presentationTime, frameWeight, frameBits) {
    this._accumulatedExcessBits = this._calcPlannedExcessBits(presentationTime, frameWeight);
    this._bucket.update(presentationTime, frameBits);
  }

  get targetLevel() {
    return this._targetLevel;
  }
  get bucketLevel() {
    return this._bucket.level;
  }

  _calcPlannedExcessBits(presentationTime, frameWeight) {
    const drainSecs = this._bucket.calcDrainSecs(presentationTime);
    const decay = Math.trunc((drainSecs / this._plannedExcessTau) * this._accumulatedExcessBits);
    const excess = Math.max(0, Math.trunc((frameWeight - 1.0) * (this._bucket.bitrate / this._bucket.fps)));
    const maxExcess = Math.trunc(0.5 * this._bucket.capacityBits);
    return clipInt(this._accumulatedExcessBits - decay + excess, 0, maxExcess);
  }
}

class RateModel {
  constructor({ initialAlpha, beta, alphaTau, seedAlphaTau = 2.0, betaRampTarget = null, betaRampDuration = null, minQIndex = 0, maxQIndex = 63 }) {
    this._initialAlpha = initialAlpha;
    this._beta0 = beta;
    this._alphaTau = alphaTau;
    this._seedAlphaTau = seedAlphaTau;
    this._betaRampTarget = betaRampTarget;
    this._betaRampDuration = betaRampDuration;
    this._minQIndex = minQIndex;
    this._maxQIndex = maxQIndex;
    this._seedAlpha = initialAlpha;
    this.reset();
  }

  reset() {
    this._alpha = this._seedAlpha;
    this._beta = this._beta0;
    this._numUpdates = 0;
  }

  solveQIndex(bpp) {
    const q = -Math.log(Math.max(1e-9, bpp) / this._alpha) / this._beta;
    return clipInt(Math.round(q), this._minQIndex, this._maxQIndex);
  }

  predictBpp(qIndex) {
    return this._alpha * Math.exp(-this._beta * qIndex);
  }

  update(qIndex, bpp) {
    const observedAlpha = bpp * Math.exp(this._beta * qIndex);
    this._alpha += (1.0 / this._alphaTau) * (observedAlpha - this._alpha);
    if (this._numUpdates === 0) {
      this._seedAlpha += (1.0 / this._seedAlphaTau) * (observedAlpha - this._seedAlpha);
    }
    this._numUpdates += 1;
    if (this._betaRampTarget !== null && this._betaRampDuration !== null) {
      const progress = Math.min(1.0, this._numUpdates / Math.max(1.0, this._betaRampDuration));
      const newBeta = this._beta + progress * (this._betaRampTarget - this._beta);
      this._alpha *= Math.exp((newBeta - this._beta) * qIndex); // preserve predicted bpp at q
      this._beta = newBeta;
    }
  }
}

class RateImplementation {
  constructor() {
    this._iframeModel = new RateModel({ initialAlpha: 0.04969, beta: -0.03626, alphaTau: 2.0 });
    this._ltrRecoveryModel = new RateModel({ initialAlpha: 0.01047, beta: -0.05306, alphaTau: 2.0 });
    this._pframeAfterIdrModel = new RateModel({
      initialAlpha: 0.02156,
      beta: -0.03173,
      alphaTau: 2.0,
      betaRampTarget: -0.07654,
      betaRampDuration: 9.0,
    });
    this._pframeAfterLtrModel = new RateModel({
      initialAlpha: 0.00315,
      beta: -0.05925,
      alphaTau: 2.0,
      betaRampTarget: -0.08307,
      betaRampDuration: 9.0,
    });
    this._lastRecoveryType = FrameType.I_FRAME;
  }

  solveQIndex(frameType, bpp) {
    return this._getModel(frameType).solveQIndex(bpp);
  }

  update(frameType, qIndex, bpp) {
    this._getModel(frameType).update(qIndex, bpp);
    if (frameType === FrameType.I_FRAME || frameType === FrameType.LTR_RECOVERY) {
      this._pframeAfterIdrModel.reset();
      this._pframeAfterLtrModel.reset();
      this._lastRecoveryType = frameType;
    }
  }

  predictBpp(frameType, qIndex) {
    return this._getModel(frameType).predictBpp(qIndex);
  }

  _getModel(frameType) {
    switch (frameType) {
      case FrameType.I_FRAME:
        return this._iframeModel;
      case FrameType.P_FRAME:
        return this._lastRecoveryType === FrameType.LTR_RECOVERY
          ? this._pframeAfterLtrModel
          : this._pframeAfterIdrModel;
      case FrameType.LTR_RECOVERY:
        return this._ltrRecoveryModel;
      default:
        throw new Error(`Unsupported frame type: ${frameType}`);
    }
  }
}

export class RateController {
  constructor(imageWidth, imageHeight, bitrate, fps, {
    maxQIndexIncrease = null,
    maxQIndexDecrease = null,
    frameWeights = { [FrameType.I_FRAME]: 10.0, [FrameType.LTR_RECOVERY]: 6.0, [FrameType.P_FRAME]: 1.0 },
    frameWeightTau = 2.0,
  } = {}) {
    this._imageWidth = imageWidth;
    this._imageHeight = imageHeight;
    this._rateAlloc = new RateAllocator(bitrate, fps);
    this._rateImpl = new RateImplementation();
    this._maxQIndexIncrease = maxQIndexIncrease;
    this._maxQIndexDecrease = maxQIndexDecrease;
    this._frameWeights = frameWeights;
    this._frameWeightTau = frameWeightTau;

    this._presentationTime = 0.0;
    this._frameType = FrameType.I_FRAME;
    this._frameWeight = 1.0;
    this._allocResult = null;
    this._rawQIndex = null;
    this._resQIndex = null;
    this._prevFrameWeight = 1.0;
    this._prevResQIndex = null;
  }

  configure(bitrate, fps) {
    this._rateAlloc.configure(bitrate, fps);
  }

  solveQIndex(presentationTime, frameType, reservedOverheadBits = 0) {
    let frameWeight =
      this._prevFrameWeight + (1.0 / this._frameWeightTau) * (1.0 - this._prevFrameWeight);
    const w = this._frameWeights[frameType];
    if (w > frameWeight) frameWeight = w;

    const undershootTau =
      frameType === FrameType.I_FRAME || frameType === FrameType.LTR_RECOVERY ? 100.0 : null;

    const alloc = this._rateAlloc.allocate(presentationTime, frameWeight, undershootTau, null);

    const targetBpp =
      Math.max(0, alloc.allocatedBits - reservedOverheadBits) / (this._imageWidth * this._imageHeight);
    const modelQ = this._rateImpl.solveQIndex(frameType, targetBpp);

    let smoothed = modelQ;
    if (
      this._prevResQIndex !== null &&
      (this._maxQIndexDecrease !== null || this._maxQIndexIncrease !== null)
    ) {
      const lo = this._maxQIndexDecrease !== null ? this._prevResQIndex - this._maxQIndexDecrease : null;
      const hi = this._maxQIndexIncrease !== null ? this._prevResQIndex + this._maxQIndexIncrease : null;
      smoothed = clipInt(modelQ, lo, hi);
    }

    this._presentationTime = presentationTime;
    this._frameType = frameType;
    this._frameWeight = frameWeight;
    this._allocResult = alloc;
    this._rawQIndex = modelQ;
    this._resQIndex = smoothed;

    if (alloc.allocatedBits <= 0) return null; // drop
    return this._resQIndex;
  }

  update(headerBits, payloadBits) {
    if (this._resQIndex === null) throw new Error("solveQIndex() must be called before update()");
    const actualFrameBits = headerBits + payloadBits;
    this._rateAlloc.update(this._presentationTime, this._frameWeight, actualFrameBits);
    const actualPayloadBpp = payloadBits / (this._imageWidth * this._imageHeight);
    this._rateImpl.update(this._frameType, this._resQIndex, actualPayloadBpp);
    this._prevFrameWeight = this._frameWeight;
    this._prevResQIndex = this._resQIndex;
    return {
      targetBucketLevel: this._rateAlloc.targetLevel,
      effectiveBucketTargetLevel: this._allocResult.effectiveTargetLevel,
      estimatedBucketLevel: this._allocResult.estimatedLevel,
      actualBucketLevel: this._rateAlloc.bucketLevel,
      nominalFrameBits: this._allocResult.nominalBits,
      allocatedFrameBits: this._allocResult.allocatedBits,
      actualFrameBits,
      rawQIndex: this._rawQIndex,
      qIndex: this._resQIndex,
    };
  }
}
