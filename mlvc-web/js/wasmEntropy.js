// JS wrapper over the WASM-compiled msrtc_rans entropy coder (wasm/mlvc_rans.mjs).
// Encode: one combined-PMF call covers the whole frame's messages (y1, y0, z) —
// the C++ iterates arrays in reverse, so [y1, y0, z] reproduces the Python path's
// three pushes exactly.
// Decode: stream API — z first, then the y sections whose scale indices depend on
// the decoded z. EOF is validated before the frame is accepted.

let _modPromise = null;

export async function initRansWasm(moduleFactory) {
  if (!_modPromise) _modPromise = moduleFactory();
  const mod = await _modPromise;
  if (!mod._mlvc_encoder_create || !mod._mlvc_decoder_stream_create) {
    throw new Error("WASM rANS module missing exports");
  }
  return mod;
}

export class WasmEntropyCoder {
  constructor(mod, pmfLengths, pmfOffsets, pmfTable, symbolBits = 16, bypassBits = 2) {
    this._mod = mod;
    const n = pmfLengths.length;
    const t = pmfTable.length;

    this._lPtr = mod._malloc(n * 4);
    this._oPtr = mod._malloc(n * 4);
    this._tPtr = mod._malloc(t * 4);
    mod.HEAP32.set(Int32Array.from(pmfLengths), this._lPtr >> 2);
    mod.HEAP32.set(Int32Array.from(pmfOffsets), this._oPtr >> 2);
    mod.HEAP32.set(Int32Array.from(pmfTable), this._tPtr >> 2);

    this._enc = mod._mlvc_encoder_create(this._lPtr, this._oPtr, this._tPtr, n, t, symbolBits, bypassBits);
    this._dec = mod._mlvc_decoder_create(this._lPtr, this._oPtr, this._tPtr, n, t, symbolBits, bypassBits);
    if (!this._enc || !this._dec) {
      this.destroy();
      throw new Error("WASM rANS: coder initialization failed");
    }
  }

  // --- single-message encode (self-contained stream, buffer API) ---
  encode(indices, values) {
    const n = indices.length;
    const mod = this._mod;
    const iPtr = mod._malloc(n * 4);
    const vPtr = mod._malloc(n * 4);
    const outPtrPtr = mod._malloc(4);
    const outLenPtr = mod._malloc(4);
    mod.HEAP32.set(indices, iPtr >> 2);
    mod.HEAP32.set(values, vPtr >> 2);
    try {
      const rc = mod._mlvc_encode(this._enc, iPtr, vPtr, n, outPtrPtr, outLenPtr);
      if (rc !== 0) throw new Error(`WASM rANS encode failed: ${rc}`);
      const outPtr = mod.HEAP32[outPtrPtr >> 2];
      const outLen = mod.HEAP32[outLenPtr >> 2];
      const bytes = mod.HEAPU8.slice(outPtr, outPtr + outLen);
      mod._mlvc_free(outPtr);
      return bytes;
    } finally {
      mod._free(iPtr);
      mod._free(vPtr);
      mod._free(outPtrPtr);
      mod._free(outLenPtr);
    }
  }

  // --- single-message decode (self-contained stream, full EOF check inside) ---
  decode(bytes, indices) {
    const n = indices.length;
    const mod = this._mod;
    const iPtr = mod._malloc(n * 4);
    const vPtr = mod._malloc(n * 4);
    const dPtr = mod._malloc(bytes.length);
    mod.HEAP32.set(indices, iPtr >> 2);
    mod.HEAPU8.set(bytes, dPtr);
    try {
      const rc = mod._mlvc_decode(this._dec, vPtr, iPtr, dPtr, bytes.length, n);
      if (rc !== 0) throw new Error(`WASM rANS decode failed: ${rc}`);
      return mod.HEAP32.slice(vPtr >> 2, (vPtr >> 2) + n);
    } finally {
      mod._free(iPtr);
      mod._free(vPtr);
      mod._free(dPtr);
    }
  }

  // --- stream decode: append to an open decoder stream ---
  decodeStream(stream, indices) {
    const n = indices.length;
    const mod = this._mod;
    const iPtr = mod._malloc(n * 4);
    const vPtr = mod._malloc(n * 4);
    mod.HEAP32.set(indices, iPtr >> 2);
    try {
      const rc = mod._mlvc_decoder_stream_decode(stream, this._dec, vPtr, iPtr, n);
      if (rc !== 0) throw new Error(`WASM rANS stream decode failed: ${rc}`);
      return mod.HEAP32.slice(vPtr >> 2, (vPtr >> 2) + n);
    } finally {
      mod._free(iPtr);
      mod._free(vPtr);
    }
  }

  destroy() {
    const mod = this._mod;
    if (this._enc) mod._mlvc_destroy(this._enc);
    if (this._dec) mod._mlvc_destroy(this._dec);
    if (this._lPtr) mod._free(this._lPtr);
    if (this._oPtr) mod._free(this._oPtr);
    if (this._tPtr) mod._free(this._tPtr);
    this._enc = this._dec = 0;
  }
}

// ---------------------------------------------------------------------------
// Frame-level codec: gaussian coder + z coder + a combined encoder.
// ---------------------------------------------------------------------------

export class FrameCodec {
  constructor(mod, gaussianPmf, bitEstimatorPmf, zChannels = 48) {
    this._mod = mod;
    this.gaussian = new WasmEntropyCoder(
      mod, gaussianPmf.pmf_lengths, gaussianPmf.pmf_offsets, gaussianPmf.pmf_table, 16, 2
    );
    this.z = new WasmEntropyCoder(
      mod, bitEstimatorPmf.pmf_lengths, bitEstimatorPmf.pmf_offsets, bitEstimatorPmf.pmf_table, 16, 2
    );
    const zOffset = gaussianPmf.pmf_lengths.length;
    this.encoder = new WasmEntropyCoder(
      mod,
      new Int32Array([...gaussianPmf.pmf_lengths, ...bitEstimatorPmf.pmf_lengths]),
      new Int32Array([...gaussianPmf.pmf_offsets, ...bitEstimatorPmf.pmf_offsets]),
      new Int32Array([...gaussianPmf.pmf_table, ...bitEstimatorPmf.pmf_table]),
      16,
      2
    );
    this.zOffset = zOffset;
    this.zChannels = zChannels;
    this._indices = new Int32Array(0);
    this._values = new Int32Array(0);
    this._zIdx = { key: "", arr: null, offsetKey: "", arrOff: null };
  }

  _zIndices(qIndex, zh, zw, offset) {
    const key = `${qIndex}:${zh}:${zw}`;
    const slot = offset ? this._zIdx.offsetKey === key && this._zIdx.arrOff : this._zIdx.key === key && this._zIdx.arr;
    if (slot) return offset ? this._zIdx.arrOff : this._zIdx.arr;
    const n = this.zChannels * zh * zw;
    const arr = new Int32Array(n);
    const base = offset ? this.zOffset : 0;
    for (let c = 0; c < this.zChannels; c++) {
      arr.fill(base + qIndex * this.zChannels + c, c * zh * zw, (c + 1) * zh * zw);
    }
    if (offset) {
      this._zIdx.offsetKey = key;
      this._zIdx.arrOff = arr;
    } else {
      this._zIdx.key = key;
      this._zIdx.arr = arr;
    }
    return arr;
  }

  // yRaw_* / zRaw: Float32Array model outputs (integer-valued); scales_*: index space.
  // rANS is a stack and the C++ iterates the array in REVERSE, so the combined
  // array must be [z, y0, y1] — reversed iteration then pushes y1, y0, z, exactly
  // the Python path's push order (decode order: z, y0, y1).
  encodeFrame({ yRaw1, scales1, yRaw0, scales0, zRaw, qIndex, zh, zw }) {
    const n = yRaw1.length + yRaw0.length + zRaw.length;
    if (this._indices.length < n) {
      this._indices = new Int32Array(n);
      this._values = new Int32Array(n);
    }
    const indices = this._indices;
    const values = this._values;
    let o = 0;
    const zIdx = this._zIndices(qIndex, zh, zw, true);
    for (let i = 0; i < zRaw.length; i++) {
      values[o] = Math.trunc(zRaw[i]);
      indices[o] = zIdx[i];
      o++;
    }
    for (let i = 0; i < yRaw0.length; i++) {
      values[o] = Math.trunc(yRaw0[i]);
      indices[o] = Number.isFinite(scales0[i]) ? Math.trunc(scales0[i]) : 0;
      o++;
    }
    for (let i = 0; i < yRaw1.length; i++) {
      values[o] = Math.trunc(yRaw1[i]);
      indices[o] = Number.isFinite(scales1[i]) ? Math.trunc(scales1[i]) : 0;
      o++;
    }
    return this.encoder.encode(indices.subarray(0, n), values.subarray(0, n));
  }

  // Decode a frame payload. scalesFromZ(zRaw, yh, yw) computes
  // { indices0: Int32Array, indices1: Int32Array } (y-scale distribution indices
  // derived from the decoded z via the JS scale decoder);
  // returns { zRaw, yRaw0, yRaw1 } (Int32Array views into fresh WASM heap copies).
  decodeFrame(bytes, { qIndex, zh, zw, yh, yw, scalesFromZ }) {
    const mod = this._mod;
    const stream = mod._mlvc_decoder_stream_create();
    if (!stream) throw new Error("WASM rANS: stream create failed");
    const dPtr = mod._malloc(bytes.length);
    mod.HEAPU8.set(bytes, dPtr);
    try {
      const rc = mod._mlvc_decoder_stream_open(stream, dPtr, bytes.length);
      if (rc !== 0) throw new Error(`WASM rANS: stream open failed: ${rc}`);

      const zRaw = this.z.decodeStream(stream, this._zIndices(qIndex, zh, zw, false));
      const { indices0, indices1 } = scalesFromZ(zRaw, yh, yw);
      const yRaw0 = this.gaussian.decodeStream(stream, indices0);
      const yRaw1 = this.gaussian.decodeStream(stream, indices1);
      if (!mod._mlvc_decoder_stream_check_eof(stream)) {
        throw new Error("WASM rANS: EOF check failed — corrupt bitstream");
      }
      return { zRaw, yRaw0, yRaw1 };
    } finally {
      mod._free(dPtr);
      mod._mlvc_decoder_stream_destroy(stream);
    }
  }

  destroy() {
    this.gaussian.destroy();
    this.z.destroy();
    this.encoder.destroy();
  }
}
