// EntropyCoder layer — port of packages/msrtc_rans/src/EntropyCoder.cpp
// (encoder impl: :431-505, decoder impl: :790-876) with symbolBits=16, bypassBits=2.
// encode(): flat arrays iterated in REVERSE; index < 0 skips; out-of-range values
// are bypass-coded with a zigzag + 2-bit chunks + unary-escaped count prefix.
import { RansEncoderStream, RansDecoderStream, buildEncSymbol } from "./rans.js";
import { buildCoder } from "./pmf.js";

export class EntropyCoder {
  constructor(pmfLengths, pmfOffsets, pmfTable, symbolBits = 16, bypassBits = 2) {
    const c = buildCoder(pmfLengths, pmfOffsets, pmfTable, symbolBits, bypassBits);
    this.numDists = c.numDists;
    this.descs = c.descs;
    this.encSymbols = c.encSymbols;
    this.cdf = c.cdf;
    this.bypassBits = c.bypassBits;
    this.bypassMaxValue = (1 << this.bypassBits) - 1;
    this.bypassSymbols = c.bypassSymbols;
    this._bypassChunks = new Uint32Array(32);
  }

  // ---------------------------------------------------------------- encode

  encode(indices, values, stream) {
    const n = indices.length;
    for (let i = n - 1; i >= 0; i--) {
      let index = indices[i];
      if (index < 0) continue; // skipped symbol; decoder emits 0
      if (index >= this.numDists) index = this.numDists - 1;
      const d = this.descs[index];
      let value = values[i] + d.valueOffset;
      let symbol;
      if (value < 0 || value >= d.bypassSentinel) {
        const bv = value < 0 ? 2 * -value - 1 : 2 * (value - d.bypassSentinel);
        this._encodeBypass(stream, bv);
        symbol = d.bypassSentinel;
      } else {
        symbol = value;
      }
      stream.putSymbol(this.encSymbols[d.symbolOffset + symbol]);
    }
  }

  _encodeBypass(stream, bv) {
    const chunks = this._bypassChunks;
    let chunkCount = 0;
    let v = bv;
    while (v !== 0) {
      chunks[chunkCount++] = v & this.bypassMaxValue;
      v >>>= this.bypassBits;
    }
    // put parts in reverse order (MSB chunk first)
    for (let i = chunkCount - 1; i >= 0; i--) stream.putSymbol(this.bypassSymbols[chunks[i]]);
    // count prefix: remainder symbol, then maxValue repeated as unary escape
    let count = chunkCount;
    let prefixCount = 0;
    while (count >= this.bypassMaxValue) {
      count -= this.bypassMaxValue;
      prefixCount++;
    }
    stream.putSymbol(this.bypassSymbols[count]);
    while (prefixCount-- > 0) stream.putSymbol(this.bypassSymbols[this.bypassMaxValue]);
  }

  // ---------------------------------------------------------------- decode

  decode(stream, indices, values) {
    for (let i = 0; i < indices.length; i++) {
      let index = indices[i];
      if (index < 0) {
        values[i] = 0;
        continue;
      }
      if (index >= this.numDists) index = this.numDists - 1;
      const d = this.descs[index];
      const cumFreq = stream.get(16);

      // upper_bound(cdf[1..sentinel+1], cumFreq) - 1 -> last start <= cumFreq
      let lo = 1;
      let hi = d.bypassSentinel + 1;
      const base = d.cdfOffset;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (this.cdf[base + mid] <= cumFreq) lo = mid + 1;
        else hi = mid;
      }
      const s = lo - 1;
      const freq = this.cdf[base + s + 1] - this.cdf[base + s];
      stream.advance(this.cdf[base + s], freq, 16);

      let symbol = s;
      if (symbol === d.bypassSentinel) {
        const bv = this._decodeBypass(stream);
        if (bv & 1) symbol = -((bv >>> 1) + 1);
        else symbol = (bv >>> 1) + d.bypassSentinel;
      }
      values[i] = symbol - d.valueOffset;
    }
  }

  _decodeBypass(stream) {
    // step 1: read count (remainder + unary escapes)
    let value = stream.get(this.bypassBits);
    stream.advance(value, 1, this.bypassBits);
    let count = value;
    while (value === this.bypassMaxValue) {
      value = stream.get(this.bypassBits);
      stream.advance(value, 1, this.bypassBits);
      count += value;
    }
    // step 2: read value chunks LSB-first
    count *= this.bypassBits;
    let enc = 0;
    for (let shift = 0; shift < count; shift += this.bypassBits) {
      const v = stream.get(this.bypassBits);
      stream.advance(v, 1, this.bypassBits);
      enc += v * 2 ** shift; // arithmetic (bitwise | would coerce to int32)
    }
    return enc >>> 0;
  }
}

// ---------------------------------------------------------------------------
// Model-facing coders (mirror conversion/_coder.py)
// ---------------------------------------------------------------------------

export function makeGaussianCoder(pmfJson) {
  return new EntropyCoder(pmfJson.pmf_lengths, pmfJson.pmf_offsets, pmfJson.pmf_table, 16, 2);
}

export function makeBitEstimatorCoder(pmfJson, channels) {
  return new EntropyCoder(pmfJson.pmf_lengths, pmfJson.pmf_offsets, pmfJson.pmf_table, 16, 2);
}

// Build flat z indices: distribution = channel + q_index * channels
// for a [1, C, zh, zw] tensor (row-major).
export function makeZIndices(channels, zh, zw, qIndex) {
  const n = channels * zh * zw;
  const indices = new Int32Array(n);
  for (let c = 0; c < channels; c++) {
    const base = qIndex * channels + c;
    indices.fill(base, c * zh * zw, (c + 1) * zh * zw);
  }
  return indices;
}

// Gaussian scales are already in index space (gaussian_pmf.json index_space: true);
// int32 truncation toward zero + clamp, mirrors _coder.py / C++ clamp.
export function scalesToIndices(scales, out) {
  const n = scales.length;
  for (let i = 0; i < n; i++) {
    const v = scales[i];
    out[i] = Number.isFinite(v) ? Math.trunc(v) : 0;
  }
  return out;
}

// One frame's encode: y_raw_1, y_raw_0, z_raw pushed in that order (reverse msg order).
export class FrameEntropyEncoder {
  constructor(gaussianCoder, zCoder) {
    this.gaussian = gaussianCoder;
    this.z = zCoder;
    this.stream = new RansEncoderStream();
  }

  encodeY(yRaw, scales) {
    const indices = scalesToIndices(scales, new Int32Array(scales.length));
    this.gaussian.encode(indices, yRaw, this.stream);
  }

  encodeZ(zRaw, qIndex, channels, zh, zw) {
    const indices = makeZIndices(channels, zh, zw, qIndex);
    this.z.encode(indices, zRaw, this.stream);
  }

  flush() {
    return this.stream.flush();
  }
}

// One frame's decode: z first, then y_raw_0, then y_raw_1 (eof check on the last).
export class FrameEntropyDecoder {
  constructor(bytes, gaussianCoder, zCoder) {
    this.stream = new RansDecoderStream(bytes);
    this.gaussian = gaussianCoder;
    this.z = zCoder;
  }

  decodeZ(qIndex, channels, zh, zw) {
    this.stream.init();
    const indices = makeZIndices(channels, zh, zw, qIndex);
    const values = new Int32Array(indices.length);
    this.z.decode(this.stream, indices, values);
    return values;
  }

  decodeY(scales, isLast) {
    const indices = scalesToIndices(scales, new Int32Array(scales.length));
    const values = new Int32Array(indices.length);
    this.gaussian.decode(this.stream, indices, values);
    if (isLast && !this.stream.checkEOF()) {
      throw new Error("rANS: EOF check failed — stream not fully consumed");
    }
    return values;
  }
}

export { buildEncSymbol };
