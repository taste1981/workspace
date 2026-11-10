// Bit-level reading helpers shared by the HEVC and AV1 parsers.

// Reads big-endian bit fields from a byte array. Values up to 32 bits wide are
// returned as plain numbers.
export class BitReader {
  constructor(bytes, byteOffset = 0) {
    this.bytes = bytes;
    this.pos = byteOffset * 8;
  }

  get bitsLeft() {
    return this.bytes.length * 8 - this.pos;
  }

  get byteAligned() {
    return (this.pos & 7) === 0;
  }

  // Unsigned n-bit field, u(n) in the HEVC spec and f(n) in the AV1 spec.
  u(n) {
    if (n > this.bitsLeft) {
      throw new RangeError(`Read of ${n} bits past the end of the data`);
    }
    let value = 0;
    for (let i = 0; i < n; i++) {
      const bit = (this.bytes[this.pos >> 3] >> (7 - (this.pos & 7))) & 1;
      value = value * 2 + bit;
      this.pos++;
    }
    return value;
  }

  flag() {
    return this.u(1) === 1;
  }

  skip(n) {
    if (n > this.bitsLeft) {
      throw new RangeError(`Skip of ${n} bits past the end of the data`);
    }
    this.pos += n;
  }

  byteAlign() {
    this.pos = (this.pos + 7) & ~7;
  }

  // Unsigned Exp-Golomb code, ue(v).
  ue() {
    let leadingZeros = 0;
    while (this.u(1) === 0) {
      if (++leadingZeros > 31) {
        throw new RangeError('Invalid Exp-Golomb code');
      }
    }
    return leadingZeros === 0 ? 0 : 2 ** leadingZeros - 1 + this.u(leadingZeros);
  }

  // Signed Exp-Golomb code, se(v).
  se() {
    const k = this.ue();
    return k % 2 === 1 ? (k + 1) / 2 : -k / 2;
  }

  // AV1 leb128(): little-endian base-128, byte aligned.
  leb128() {
    let value = 0;
    for (let i = 0; i < 8; i++) {
      const byte = this.u(8);
      value += (byte & 0x7f) * 2 ** (7 * i);
      if (!(byte & 0x80)) {
        return value;
      }
    }
    throw new RangeError('leb128 value longer than 8 bytes');
  }

  // AV1 uvlc().
  uvlc() {
    let leadingZeros = 0;
    while (this.u(1) === 0) {
      if (++leadingZeros >= 32) {
        return 2 ** 32 - 1;
      }
    }
    return 2 ** leadingZeros - 1 + this.u(leadingZeros);
  }
}

// Removes emulation prevention bytes (the 0x03 in 0x00 0x00 0x03) from a
// NAL unit, producing its raw byte sequence payload.
export function unescapeRbsp(nal) {
  const out = new Uint8Array(nal.length);
  let length = 0;
  let zeros = 0;
  for (const byte of nal) {
    if (zeros >= 2 && byte === 0x03) {
      zeros = 0;
      continue;
    }
    out[length++] = byte;
    zeros = byte === 0 ? zeros + 1 : 0;
  }
  return out.subarray(0, length);
}

// Splits an Annex B byte stream into NAL units, without start codes.
export function splitAnnexB(bytes) {
  const nals = [];
  let start = -1;
  let i = 0;
  while (i + 2 < bytes.length) {
    if (bytes[i] === 0 && bytes[i + 1] === 0 && bytes[i + 2] === 1) {
      if (start >= 0) {
        nals.push(trimTrailingZeros(bytes, start, i));
      }
      i += 3;
      start = i;
    } else {
      i++;
    }
  }
  if (start >= 0 && start < bytes.length) {
    nals.push(trimTrailingZeros(bytes, start, bytes.length));
  }
  return nals;
}

// A NAL unit never ends in a zero byte, so zeros before the next start code
// belong to that start code or to trailing_zero_8bits.
function trimTrailingZeros(bytes, start, end) {
  while (end > start && bytes[end - 1] === 0) {
    end--;
  }
  return bytes.subarray(start, end);
}

export function toHex(value, digits = 2) {
  return value.toString(16).toUpperCase().padStart(digits, '0');
}
