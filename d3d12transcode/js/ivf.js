// Minimal IVF container support, used to load AV1 sources and to save the
// demo's AV1 output.

const ascii = (bytes) => String.fromCharCode(...bytes);
const encodeAscii = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));

export function parseIvf(bytes) {
  if (bytes.length < 32 || ascii(bytes.subarray(0, 4)) !== 'DKIF') {
    throw new Error('Not an IVF file');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerSize = view.getUint16(6, true);
  const frames = [];
  let pos = headerSize;
  while (pos + 12 <= bytes.length) {
    const size = view.getUint32(pos, true);
    if (pos + 12 + size > bytes.length) {
      break;  // Truncated final frame.
    }
    frames.push({
      timestamp: Number(view.getBigUint64(pos + 4, true)),
      data: bytes.subarray(pos + 12, pos + 12 + size),
    });
    pos += 12 + size;
  }
  return {
    fourcc: ascii(bytes.subarray(8, 12)),
    width: view.getUint16(12, true),
    height: view.getUint16(14, true),
    frameRate: view.getUint32(16, true) / (view.getUint32(20, true) || 1),
    frames,
  };
}

export function writeIvf({fourcc = 'AV01', width, height, frameRate = 30,
                          frames}) {
  const size = 32 + frames.reduce((n, f) => n + 12 + f.length, 0);
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  out.set(encodeAscii('DKIF'), 0);
  view.setUint16(4, 0, true);  // version
  view.setUint16(6, 32, true);  // header size
  out.set(encodeAscii(fourcc), 8);
  view.setUint16(12, width, true);
  view.setUint16(14, height, true);
  view.setUint32(16, frameRate, true);  // timebase denominator
  view.setUint32(20, 1, true);  // timebase numerator
  view.setUint32(24, frames.length, true);
  let pos = 32;
  frames.forEach((frame, i) => {
    view.setUint32(pos, frame.length, true);
    view.setBigUint64(pos + 4, BigInt(i), true);
    out.set(frame, pos + 12);
    pos += 12 + frame.length;
  });
  return out;
}
