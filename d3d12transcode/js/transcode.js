// The transcoding pipeline: pick the source access units for the first
// displayed frames, decode them, re-encode with an application-defined
// reference structure, and parse what the encoder produced.

import {Av1StreamParser, describeSequenceHeader} from './av1.js';
import {splitAnnexB} from './bitreader.js';
import {describeSps, HevcStreamParser, splitAnnexBAccessUnits}
    from './hevc.js';
import {parseIvf} from './ivf.js';
import {simulate} from './refs.js';

export const FRAME_DURATION_US = 33333;

// Output profiles the demo can encode to. All are 10-bit, so all can carry
// HDR video; the 4:4:4 and 4:2:2 ones also keep full chroma resolution.
export const TARGETS = [
  {id: 'hevc-main10', family: 'hevc', label: 'HEVC Main 10',
   detail: '10-bit 4:2:0', codec: 'hvc1.2.4.L120.B0'},
  {id: 'av1-main10', family: 'av1', label: 'AV1 Main',
   detail: '10-bit 4:2:0', codec: 'av01.0.08M.10'},
  {id: 'av1-high10', family: 'av1', label: 'AV1 High',
   detail: '10-bit 4:4:4', codec: 'av01.1.08M.10.0.000'},
  {id: 'hevc-rext444', family: 'hevc', label: 'HEVC Main 4:4:4 10',
   detail: '10-bit 4:4:4 (RExt)', codec: 'hvc1.4.10.L120.9C.08'},
  {id: 'hevc-rext422', family: 'hevc', label: 'HEVC Main 4:2:2 10',
   detail: '10-bit 4:2:2 (RExt)', codec: 'hvc1.4.10.L120.9D.08'},
];

const isIvf = (bytes) =>
    bytes.length >= 4 && String.fromCharCode(...bytes.subarray(0, 4)) === 'DKIF';

const hdrMetadataOf = (messages) => ({
  mdcv: messages.find((m) => m.mdcv)?.mdcv ?? null,
  cll: messages.find((m) => m.cll)?.cll ?? null,
});

function av1CodecString(seq) {
  const c = seq.color;
  const base = `av01.${seq.profile}.` +
      `${String(seq.operatingPoints[0].level).padStart(2, '0')}M.` +
      `${String(c.bitDepth).padStart(2, '0')}`;
  // Chrome assumes 4:2:0 when the chroma fields are left out.
  return seq.profile === 0 ? base
      : `${base}.${c.monochrome ? 1 : 0}.${c.subsampling.join('')}0`;
}

// Picks the chunks needed to decode the first `count` displayed frames of
// an HEVC Annex B or AV1 IVF stream, and describes the stream.
export function loadSource(bytes, count) {
  if (isIvf(bytes)) {
    const ivf = parseIvf(bytes);
    const parser = new Av1StreamParser();
    const chunks = [];
    let metadata = [];
    for (const [i, frame] of ivf.frames.entries()) {
      const unit = parser.parseTemporalUnit(frame.data, i);
      if (i === 0) {
        metadata = unit.metadata;
      }
      // Low-delay streams show one frame per temporal unit.
      chunks.push({type: i === 0 ? 'key' : 'delta',
                   timestamp: i * FRAME_DURATION_US, data: frame.data});
      if (chunks.length === count) {
        break;
      }
    }
    return {
      family: 'av1',
      codec: av1CodecString(parser.seq),
      info: describeSequenceHeader(parser.seq),
      hdr: hdrMetadataOf(metadata),
      chunks,
    };
  }

  const parser = new HevcStreamParser();
  const chunks = [];
  const needed = new Set(Array.from({length: count}, (_, i) => i));
  let first = null;
  for (const nals of splitAnnexBAccessUnits(bytes)) {
    const unit = parser.parseAccessUnit(nals);
    first ??= unit;
    // Annex B again, so each chunk carries its own start codes.
    const data = concatNals(nals);
    chunks.push({type: unit.key ? 'key' : 'delta',
                 timestamp: unit.poc * FRAME_DURATION_US, data});
    needed.delete(unit.poc);
    if (needed.size === 0) {
      break;
    }
  }
  if (!first?.sps || !first.key) {
    throw new Error('The stream must start with parameter sets and a key frame.');
  }
  const info = describeSps(first.sps);
  return {family: 'hevc', codec: info.codec, info,
          hdr: hdrMetadataOf(first.sei), chunks};
}

function concatNals(nals) {
  const size = nals.reduce((n, nal) => n + 4 + nal.length, 0);
  const out = new Uint8Array(size);
  let pos = 0;
  for (const nal of nals) {
    out.set([0, 0, 0, 1], pos);
    out.set(nal, pos + 4);
    pos += 4 + nal.length;
  }
  return out;
}

// Decodes `chunks` and returns the frames in display order. Frames with a
// timestamp at or past `count` frames are closed and dropped.
export async function decodeChunks(codec, chunks, count = Infinity) {
  const frames = [];
  let failure = null;
  const decoder = new VideoDecoder({
    output: (frame) => frames.push(frame),
    error: (e) => { failure = e; },
  });
  decoder.configure({codec});
  for (const chunk of chunks) {
    decoder.decode(new EncodedVideoChunk(chunk));
  }
  await decoder.flush().catch((e) => { failure ??= e; });
  if (decoder.state !== 'closed') {
    decoder.close();
  }
  if (failure) {
    frames.forEach((f) => f.close());
    throw failure;
  }
  frames.sort((a, b) => a.timestamp - b.timestamp);
  const kept = [];
  for (const frame of frames) {
    if (frame.timestamp < count * FRAME_DURATION_US) {
      kept.push(frame);
    } else {
      frame.close();
    }
  }
  return kept;
}

export const manualReferencesAvailable = () =>
    typeof VideoEncoder !== 'undefined' &&
    'getAllFrameBuffers' in VideoEncoder.prototype;

export function encoderConfig(target, {width, height, rateControl, bitrate,
                                       manual, scalabilityMode}) {
  const config = {
    codec: target.codec,
    width,
    height,
    framerate: 30,
    hardwareAcceleration: 'prefer-hardware',
    latencyMode: 'realtime',
    bitrateMode: rateControl,
  };
  if (rateControl !== 'quantizer') {
    config.bitrate = bitrate;
  }
  if (manual) {
    config.scalabilityMode = 'manual';
  } else if (scalabilityMode) {
    config.scalabilityMode = scalabilityMode;
  }
  if (target.family === 'hevc') {
    config.hevc = {format: 'annexb'};
  }
  return config;
}

const isSupported = async (config) =>
    (await VideoEncoder.isConfigSupported(config)).supported;

// Explains why `config` isn't supported, by retrying without the optional
// features it asks for.
async function unsupportedReason(target, config) {
  const {scalabilityMode, bitrateMode, ...base} = config;
  const name = `${target.label} (${target.detail})`;
  if (!await isSupported(base)) {
    return `This GPU can't encode ${name} in hardware.`;
  }
  if (scalabilityMode && !await isSupported({...base, scalabilityMode})) {
    return scalabilityMode === 'manual'
        ? `The ${name} encoder doesn't support manual reference control.`
        : `The ${name} encoder doesn't support ${scalabilityMode}.`;
  }
  return `The ${name} encoder doesn't support ${bitrateMode} rate control.`;
}

// Encodes `frames` with the reference structure in `plan` and returns the
// encoded chunks. `onFrame(index, chunk)` reports progress.
export async function encodeFrames(frames, target, settings, plan, onFrame) {
  const config = encoderConfig(target, settings);
  if (!await isSupported(config)) {
    throw new Error(await unsupportedReason(target, config));
  }

  const chunks = [];
  let decoderConfig = null;
  let failure = null;
  let notify = () => {};
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      chunks.push({type: chunk.type, timestamp: chunk.timestamp, data,
                   temporalLayerId: metadata?.svc?.temporalLayerId ?? null});
      decoderConfig = metadata?.decoderConfig ?? decoderConfig;
      onFrame?.(chunks.length - 1, chunks.at(-1));
      notify();
    },
    error: (e) => {
      failure = e;
      notify();
    },
  });
  encoder.configure(config);

  let buffers = settings.manual ? encoder.getAllFrameBuffers() : [];
  try {
    for (const [i, frame] of frames.entries()) {
      const step = plan[i];
      const options = {keyFrame: step.key};
      if (settings.manual) {
        if (!step.key) {
          options.referenceBuffers = step.refs.map((b) => buffers[b]);
        }
        if (step.update !== null) {
          options.updateBuffer = buffers[step.update];
        }
      }
      if (settings.rateControl === 'quantizer') {
        options[target.family] = {quantizer: settings.quantizer};
      }
      const outputs = chunks.length;
      const arrived = new Promise((resolve) => { notify = resolve; });
      encoder.encode(frame, options);
      // Wait for each output, so a failing frame is pinpointed and the buffer
      // count is known before any frame depends on it.
      await Promise.race([arrived, new Promise((r) => setTimeout(r, 3000))]);
      if (failure) {
        throw failure;
      }
      if (chunks.length === outputs) {
        await encoder.flush();
      }
      if (i === 0 && settings.manual) {
        // The real buffer count arrives with the encoder's first update.
        buffers = encoder.getAllFrameBuffers();
        const {errors} = simulate(plan, {family: target.family,
                                         bufferCount: buffers.length});
        if (errors.length) {
          throw new Error(`The encoder has ${buffers.length} reference ` +
                          `buffers: ${errors[0]}`);
        }
      }
    }
    await encoder.flush();
  } finally {
    if (encoder.state !== 'closed') {
      encoder.close();
    }
  }
  if (failure) {
    throw failure;
  }
  return {chunks, decoderConfig, bufferCount: buffers.length, config};
}

// Parses the encoder output: per-frame type and references (as frame
// indices), plus the stream's color description and HDR metadata. For HEVC,
// also lists the frames each picture keeps without using, and references to
// frames that an earlier picture already dropped.
export function analyzeOutput(family, chunks) {
  if (family === 'av1') {
    const parser = new Av1StreamParser();
    const units = chunks.map((c, i) => parser.parseTemporalUnit(c.data, i));
    const frames = units.map((unit, i) => {
      const frame = unit.frames[0];
      return {
        index: i,
        type: frame?.type ?? '?',
        key: !!frame?.key,
        references: frame?.references ?? [],
        // AV1 frames stay in their slots until a later frame refreshes them,
        // so nothing is dropped behind the encoder's back.
        kept: [],
        missing: [],
        dropped: [],
        // The temporal layer in the bitstream, and as WebCodecs reports it.
        temporalId: frame?.temporalId ?? 0,
        layer: chunks[i].temporalLayerId,
        structure: unit.obuTypes,
        detail: frame ? `refresh ${frame.refreshFrameFlags.toString(2)
            .padStart(8, '0')}, ref_frame_idx [${frame.refFrameIdx}]` : '',
        bytes: chunks[i].data.length,
      };
    });
    return {
      info: parser.seq ? describeSequenceHeader(parser.seq) : null,
      hdr: hdrMetadataOf(units.flatMap((u) => u.metadata)),
      frames,
    };
  }

  const parser = new HevcStreamParser();
  const units = chunks.map((c) => parser.parseAccessUnit(splitAnnexB(c.data)));
  const sps = units.find((u) => u.sps)?.sps;
  // POCs restart at every IDR picture, so map them to frames as they come.
  const frameOfPoc = new Map();
  const toFrames = (pocs) => pocs.map((poc) => frameOfPoc.get(poc) ?? null);
  // Follows the decoded picture buffer like a decoder does: each picture
  // keeps the pictures listed in its reference picture set, plus itself, and
  // drops the rest. A picture can't be decoded if it predicts from a picture
  // that is no longer there.
  let dpb = new Set();
  const frames = units.map((unit, i) => {
    const used = unit.references.map((r) => r.poc);
    const kept = unit.kept.map((r) => r.poc);
    const listed = [...used, ...kept];
    const frame = {
      index: i,
      type: `${unit.sliceType}${unit.key ? ' (IDR)' : ''}`,
      key: unit.key,
      references: toFrames(used),
      kept: toFrames(kept),
      missing: toFrames(used.filter((poc) => !dpb.has(poc))),
      dropped: toFrames([...dpb].filter((poc) => !listed.includes(poc))),
      temporalId: unit.temporalId,
      layer: chunks[i].temporalLayerId,
      structure: unit.nalTypes,
      detail: `POC ${unit.poc}, ref POCs [${used}]` +
              (kept.length ? `, keeps [${kept}]` : ''),
      bytes: chunks[i].data.length,
    };
    dpb = new Set(listed.filter((poc) => dpb.has(poc)));
    dpb.add(unit.poc);
    if (unit.key) {
      frameOfPoc.clear();
    }
    frameOfPoc.set(unit.poc, i);
    return frame;
  });
  return {
    info: sps ? describeSps(sps) : null,
    hdr: hdrMetadataOf(units.flatMap((u) => u.sei)),
    frames,
  };
}
