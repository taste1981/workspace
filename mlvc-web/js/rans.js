// rANS (RansByte variant) — direct port of packages/msrtc_rans/private/include/msrtc_rans/rans.h
// 32-bit state, byte units: StateBits=31, LowerBound=0x800000, MaxScaleBits=30.
// The encoder uses the RECIPROCAL fast path (RansEncSymbol) exactly as the C++ does;
// the decoder is the plain textbook form. All state math is exact in JS doubles
// (products < 2^48), with >>> 0 applied where the C++ wraps uint32.

export const LOWER_BOUND = 0x800000; // 1 << 31

// ---------------------------------------------------------------------------
// 32x32 -> high 32 bits of the 64-bit product (Hacker's Delight mulhi)
// ---------------------------------------------------------------------------
export function mulhi32(a, b) {
  const aHi = a >>> 16;
  const aLo = a & 0xffff;
  const bHi = b >>> 16;
  const bLo = b & 0xffff;
  const p1 = Math.imul(aHi, bHi);
  const p2 = Math.imul(aHi, bLo);
  const p3 = Math.imul(aLo, bHi);
  const p4 = Math.imul(aLo, bLo);
  // mid can exceed 2^32 — keep it in doubles (exact, < 2^34) and carry arithmetically
  const mid = p2 + p3 + (p4 >>> 16);
  return (p1 + Math.floor(mid / 65536)) >>> 0;
}

// ---------------------------------------------------------------------------
// RansEncSymbol — precomputed per-symbol constants (rans.h RansEncSymbol ctor)
// ---------------------------------------------------------------------------
export function buildEncSymbol(start, freq, scaleBits) {
  const scale = 1 << scaleBits;
  // freq_t is 32-bit and StateBits == 31, so min(StateBits, 31) - scaleBits
  const xMaxHi = freq << (31 - scaleBits);

  let freqRcp, freqRcpShift, bias;
  if (freq > 1) {
    // Alverson "Integer Division using reciprocals"
    let shift = 1;
    while (freq > 1 << shift) shift++;
    // nom = (1 << (shift + bits - 1)) + (freq - 1), bits = 32
    // shift <= 17 for freq <= 65536, so nom < 2^49 — exact in doubles
    const nom = 2 ** (shift + 31) + (freq - 1);
    freqRcp = Math.floor(nom / freq);
    freqRcpShift = shift - 1 + 32; // +32: no Mul64Hi on the 32-bit state
    bias = start;
  } else {
    // freq == 1: rcp = ~0, shift = 0 => q = x - 1
    freqRcp = 0xffffffff;
    freqRcpShift = 32;
    bias = start + scale - 1;
  }
  const freqCmpl = scale - freq;
  return { xMaxHi, freqRcp, freqRcpShift, bias, freqCmpl };
}

// ---------------------------------------------------------------------------
// Encoder stream — writes backward from the end of a growable Uint8Array,
// mirroring ResizableBufferSink; bytes() returns the forward-ordered span.
// ---------------------------------------------------------------------------
export class RansEncoderStream {
  constructor(initialSize = 4096) {
    this.buf = new Uint8Array(initialSize);
    this.pos = initialSize - 1;
    this.state = LOWER_BOUND;
  }

  _sink(b) {
    if (this.pos < 0) this._grow();
    this.buf[this.pos--] = b;
  }

  _grow() {
    const valid = this.buf.length - 1 - this.pos; // bytes written so far
    const size = Math.max(this.buf.length * 2, valid + 4096);
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(this.pos + 1), size - valid);
    this.buf = next;
    this.pos = size - valid - 1;
  }

  // Put a precomputed symbol (rans.h RansEncoder::Put(symbol))
  putSymbol(sym) {
    // renormalize (one iteration always suffices: MaxScaleBits <= 8)
    let x = this.state;
    if (x >= sym.xMaxHi) {
      this._sink(x & 0xff);
      x >>>= 8;
    }
    // x += Quotient(x, sym) * freq_cmpl + bias   (wraps uint32 in C++)
    const q = (mulhi32(x, sym.freqRcp) >>> (sym.freqRcpShift - 32)) >>> 0;
    x = (x + q * sym.freqCmpl + sym.bias) >>> 0;
    this.state = x;
  }

  // Raw Put(start, freq, scaleBits) via a precomputed symbol
  put(start, freq, scaleBits) {
    this.putSymbol(buildEncSymbol(start, freq, scaleBits));
  }

  // Flush: emit state big-endian, byte units (rans.h RansEncoder::Flush)
  flush() {
    const x = this.state;
    this._sink((x >>> 24) & 0xff);
    this._sink((x >>> 16) & 0xff);
    this._sink((x >>> 8) & 0xff);
    this._sink(x & 0xff);
    const out = this.buf.subarray(this.pos + 1);
    return out;
  }
}

// ---------------------------------------------------------------------------
// Decoder stream (rans.h RansDecoder)
// ---------------------------------------------------------------------------
export class RansDecoderStream {
  constructor(bytes) {
    this.bytes = bytes;
    this.cursor = 0;
    this.state = 0;
  }

  // Init: read 4 bytes LSB-first; x must be >= LowerBound
  init() {
    const b = this.bytes;
    if (b.length < 4) throw new Error("rANS: stream too short");
    const x = b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
    if (x < LOWER_BOUND) throw new Error("rANS: invalid stream (init below lower bound)");
    this.cursor = 4;
    this.state = x;
  }

  // Get(scale_bits): cumulative frequency of the next symbol
  get(scaleBits) {
    return this.state & ((1 << scaleBits) - 1);
  }

  // Advance(start, freq, scale_bits)
  advance(start, freq, scaleBits) {
    const value = this.state & ((1 << scaleBits) - 1);
    let x = freq * (this.state >>> scaleBits) + value - start;
    while (x < LOWER_BOUND) {
      if (this.cursor >= this.bytes.length) throw new Error("rANS: unexpected end of stream");
      x = (x << 8) + this.bytes[this.cursor++];
    }
    this.state = x;
  }

  // CheckEOF: stream fully consumed down to the initial state
  checkEOF() {
    return this.cursor === this.bytes.length && this.state === LOWER_BOUND;
  }
}

// Precomputed bypass symbols for Put(v, 1, bypassBits) — cached per bypassBits
const bypassSymbolsCache = new Map();
export function getBypassSymbols(bypassBits) {
  let arr = bypassSymbolsCache.get(bypassBits);
  if (!arr) {
    const n = 1 << bypassBits;
    arr = new Array(n);
    for (let v = 0; v < n; v++) arr[v] = buildEncSymbol(v, 1, bypassBits);
    bypassSymbolsCache.set(bypassBits, arr);
  }
  return arr;
}
