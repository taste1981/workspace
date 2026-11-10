// AV1 parsing for the demo: OBUs, the sequence header's color config, HDR
// metadata OBUs, and the reference fields at the start of each frame header.

import {BitReader} from './bitreader.js';

export const ObuType = {
  SEQUENCE_HEADER: 1,
  TEMPORAL_DELIMITER: 2,
  FRAME_HEADER: 3,
  TILE_GROUP: 4,
  METADATA: 5,
  FRAME: 6,
  REDUNDANT_FRAME_HEADER: 7,
  PADDING: 15,
};

const OBU_NAMES = {
  1: 'Sequence header', 2: 'Temporal delimiter', 3: 'Frame header',
  4: 'Tile group', 5: 'Metadata', 6: 'Frame', 7: 'Redundant frame header',
  8: 'Tile list', 15: 'Padding',
};

const METADATA_NAMES = {
  1: 'HDR content light level', 2: 'HDR mastering display',
  3: 'Scalability', 4: 'ITU-T T.35', 5: 'Timecode',
};

export const FrameType = {KEY: 0, INTER: 1, INTRA_ONLY: 2, SWITCH: 3};
const FRAME_TYPE_NAMES = ['Key', 'Inter', 'Intra-only', 'Switch'];
const SELECT = 2;  // SELECT_SCREEN_CONTENT_TOOLS / SELECT_INTEGER_MV
const PRIMARY_REF_NONE = 7;

export const obuTypeName = (type) => OBU_NAMES[type] ?? `OBU ${type}`;
export const frameTypeName = (type) => FRAME_TYPE_NAMES[type];

// Splits a low-overhead bitstream (one temporal unit) into OBUs.
export function splitObus(bytes) {
  const obus = [];
  let pos = 0;
  while (pos < bytes.length) {
    const header = bytes[pos];
    const type = (header >> 3) & 0xf;
    const hasExtension = (header >> 2) & 1;
    const hasSize = (header >> 1) & 1;
    let offset = pos + 1;
    let temporalId = 0;
    let spatialId = 0;
    if (hasExtension) {
      temporalId = bytes[offset] >> 5;
      spatialId = (bytes[offset] >> 3) & 3;
      offset++;
    }
    let size = bytes.length - offset;
    if (hasSize) {
      const r = new BitReader(bytes, offset);
      size = r.leb128();
      offset = r.pos / 8;
    }
    if (offset + size > bytes.length) {
      throw new RangeError('OBU extends past the end of the temporal unit');
    }
    obus.push({type, temporalId, spatialId,
               payload: bytes.subarray(offset, offset + size)});
    pos = offset + size;
  }
  return obus;
}

function parseColorConfig(r, profile) {
  const c = {};
  const highBitdepth = r.flag();
  c.bitDepth = 8;
  if (profile === 2 && highBitdepth) {
    c.bitDepth = r.flag() ? 12 : 10;
  } else if (highBitdepth) {
    c.bitDepth = 10;
  }
  c.monochrome = profile !== 1 && r.flag();
  c.described = r.flag();
  c.primaries = 2;
  c.transfer = 2;
  c.matrix = 2;
  if (c.described) {
    c.primaries = r.u(8);
    c.transfer = r.u(8);
    c.matrix = r.u(8);
  }
  if (c.monochrome) {
    c.fullRange = r.flag();
    c.subsampling = [1, 1];
    return c;
  }
  if (c.primaries === 1 && c.transfer === 13 && c.matrix === 0) {
    c.fullRange = true;  // sRGB
    c.subsampling = [0, 0];
  } else {
    c.fullRange = r.flag();
    if (profile === 0) {
      c.subsampling = [1, 1];
    } else if (profile === 1) {
      c.subsampling = [0, 0];
    } else if (c.bitDepth === 12) {
      const x = r.u(1);
      c.subsampling = [x, x ? r.u(1) : 0];
    } else {
      c.subsampling = [1, 0];
    }
    if (c.subsampling[0] && c.subsampling[1]) {
      r.skip(2);  // chroma_sample_position
    }
  }
  r.skip(1);  // separate_uv_delta_q
  return c;
}

export function chromaName([x, y], monochrome = false) {
  if (monochrome) {
    return '4:0:0';
  }
  return x ? (y ? '4:2:0' : '4:2:2') : '4:4:4';
}

export function parseSequenceHeader(payload) {
  const r = new BitReader(payload);
  const seq = {
    profile: r.u(3),
    decoderModelInfoPresent: false,
    equalPictureInterval: false,
    operatingPoints: [],
  };
  r.skip(1);  // still_picture
  seq.reducedStillPictureHeader = r.flag();
  if (seq.reducedStillPictureHeader) {
    seq.operatingPoints.push({idc: 0, level: r.u(5)});
  } else {
    if (r.flag()) {  // timing_info_present_flag
      r.skip(64);  // num_units_in_display_tick, time_scale
      seq.equalPictureInterval = r.flag();
      if (seq.equalPictureInterval) {
        r.uvlc();  // num_ticks_per_picture_minus_1
      }
      seq.decoderModelInfoPresent = r.flag();
      if (seq.decoderModelInfoPresent) {
        seq.bufferDelayLength = r.u(5) + 1;
        r.skip(32);  // num_units_in_decoding_tick
        seq.bufferRemovalTimeLength = r.u(5) + 1;
        seq.framePresentationTimeLength = r.u(5) + 1;
      }
    }
    const initialDisplayDelayPresent = r.flag();
    const count = r.u(5) + 1;
    for (let i = 0; i < count; i++) {
      const op = {idc: r.u(12), level: r.u(5), decoderModelPresent: false};
      if (op.level > 7) {
        r.skip(1);  // seq_tier
      }
      if (seq.decoderModelInfoPresent) {
        op.decoderModelPresent = r.flag();
        if (op.decoderModelPresent) {
          // decoder_buffer_delay, encoder_buffer_delay, low_delay_mode_flag
          r.skip(2 * seq.bufferDelayLength + 1);
        }
      }
      if (initialDisplayDelayPresent && r.flag()) {
        r.skip(4);  // initial_display_delay_minus_1
      }
      seq.operatingPoints.push(op);
    }
  }
  const widthBits = r.u(4) + 1;
  const heightBits = r.u(4) + 1;
  seq.maxWidth = r.u(widthBits) + 1;
  seq.maxHeight = r.u(heightBits) + 1;
  seq.frameIdNumbersPresent = !seq.reducedStillPictureHeader && r.flag();
  if (seq.frameIdNumbersPresent) {
    seq.deltaFrameIdLength = r.u(4) + 2;
    seq.frameIdLength = r.u(3) + 1 + seq.deltaFrameIdLength;
  }
  r.skip(3);  // 128x128 superblocks, filter intra, intra edge filter
  seq.enableOrderHint = false;
  seq.orderHintBits = 0;
  seq.forceScreenContentTools = SELECT;
  seq.forceIntegerMv = SELECT;
  if (!seq.reducedStillPictureHeader) {
    r.skip(4);  // interintra, masked compound, warped motion, dual filter
    seq.enableOrderHint = r.flag();
    if (seq.enableOrderHint) {
      r.skip(2);  // enable_jnt_comp, enable_ref_frame_mvs
    }
    seq.forceScreenContentTools = r.flag() ? SELECT : r.u(1);
    seq.forceIntegerMv = seq.forceScreenContentTools > 0
        ? (r.flag() ? SELECT : r.u(1))
        : SELECT;
    if (seq.enableOrderHint) {
      seq.orderHintBits = r.u(3) + 1;
    }
  }
  r.skip(3);  // superres, cdef, loop restoration
  seq.color = parseColorConfig(r, seq.profile);
  seq.filmGrainParamsPresent = r.flag();
  return seq;
}

export function parseMetadata(payload) {
  const r = new BitReader(payload);
  const type = r.leb128();
  const name = METADATA_NAMES[type] ?? `Metadata type ${type}`;
  if (type === 1) {
    return {type, name, cll: {maxCll: r.u(16), maxFall: r.u(16)}};
  }
  if (type === 2) {
    // Chromaticities are 0.16 fixed point, in red, green, blue order;
    // luminance_max is 24.8 and luminance_min 18.14 fixed point.
    const [red, green, blue] = Array.from(
        {length: 3}, () => [r.u(16) / 65536, r.u(16) / 65536]);
    const white = [r.u(16) / 65536, r.u(16) / 65536];
    return {type, name, mdcv: {
      red, green, blue, white,
      maxLuminance: r.u(32) / 256,
      minLuminance: r.u(32) / 16384,
    }};
  }
  return {type, name};
}

// Parses uncompressed_header() up to ref_frame_idx[], which is all the demo
// needs to follow the reference structure.
export function parseFrameHeader(payload, seq, obu) {
  const r = new BitReader(payload);
  const h = {showExistingFrame: false};
  if (seq.reducedStillPictureHeader) {
    h.frameType = FrameType.KEY;
    h.showFrame = true;
    h.errorResilient = true;
  } else {
    h.showExistingFrame = r.flag();
    if (h.showExistingFrame) {
      h.frameToShow = r.u(3);
      return h;
    }
    h.frameType = r.u(2);
    h.showFrame = r.flag();
    if (h.showFrame && seq.decoderModelInfoPresent &&
        !seq.equalPictureInterval) {
      r.skip(seq.framePresentationTimeLength);  // temporal_point_info()
    }
    if (!h.showFrame) {
      r.skip(1);  // showable_frame
    }
    h.errorResilient =
        h.frameType === FrameType.SWITCH ||
        (h.frameType === FrameType.KEY && h.showFrame) || r.flag();
  }
  const intra =
      h.frameType === FrameType.KEY || h.frameType === FrameType.INTRA_ONLY;
  r.skip(1);  // disable_cdf_update
  const allowScreenContentTools =
      seq.forceScreenContentTools === SELECT ? r.u(1)
                                             : seq.forceScreenContentTools;
  if (allowScreenContentTools && seq.forceIntegerMv === SELECT) {
    r.skip(1);  // force_integer_mv
  }
  if (seq.frameIdNumbersPresent) {
    r.skip(seq.frameIdLength);  // current_frame_id
  }
  if (h.frameType !== FrameType.SWITCH && !seq.reducedStillPictureHeader) {
    r.skip(1);  // frame_size_override_flag
  }
  h.orderHint = r.u(seq.orderHintBits);
  h.primaryRefFrame =
      intra || h.errorResilient ? PRIMARY_REF_NONE : r.u(3);
  if (seq.decoderModelInfoPresent && r.flag()) {  // buffer_removal_time_present
    for (const op of seq.operatingPoints) {
      if (!op.decoderModelPresent) {
        continue;
      }
      const inTemporalLayer = (op.idc >> obu.temporalId) & 1;
      const inSpatialLayer = (op.idc >> (obu.spatialId + 8)) & 1;
      if (op.idc === 0 || (inTemporalLayer && inSpatialLayer)) {
        r.skip(seq.bufferRemovalTimeLength);
      }
    }
  }
  h.refreshFrameFlags =
      h.frameType === FrameType.SWITCH ||
      (h.frameType === FrameType.KEY && h.showFrame) ? 0xff : r.u(8);
  if ((!intra || h.refreshFrameFlags !== 0xff) && h.errorResilient &&
      seq.enableOrderHint) {
    r.skip(8 * seq.orderHintBits);  // ref_order_hint[]
  }
  h.refFrameIdx = [];
  if (intra) {
    return h;
  }
  h.shortSignaling = seq.enableOrderHint && r.flag();
  if (h.shortSignaling) {
    h.lastFrameIdx = r.u(3);
    h.goldFrameIdx = r.u(3);
  }
  for (let i = 0; i < 7; i++) {
    if (!h.shortSignaling) {
      h.refFrameIdx.push(r.u(3));
    }
    if (seq.frameIdNumbersPresent) {
      r.skip(seq.deltaFrameIdLength);  // delta_frame_id_minus_1
    }
  }
  return h;
}

// Tracks the sequence header and the eight reference slots across temporal
// units, so each frame can be described with the frames it references.
export class Av1StreamParser {
  constructor() {
    this.seq = null;
    this.slots = new Array(8).fill(null);
    this.frameCount = 0;
  }

  // Parses one temporal unit. `label` identifies the frame in reference
  // lists (the demo uses the frame index).
  parseTemporalUnit(bytes, label = this.frameCount) {
    const unit = {obuTypes: [], metadata: [], frames: [], seq: null};
    for (const obu of splitObus(bytes)) {
      unit.obuTypes.push(obuTypeName(obu.type));
      if (obu.type === ObuType.SEQUENCE_HEADER) {
        this.seq = parseSequenceHeader(obu.payload);
        unit.seq = this.seq;
      } else if (obu.type === ObuType.METADATA) {
        unit.metadata.push(parseMetadata(obu.payload));
      } else if (obu.type === ObuType.FRAME ||
                 obu.type === ObuType.FRAME_HEADER) {
        if (!this.seq) {
          throw new Error('Frame before the sequence header');
        }
        const header = parseFrameHeader(obu.payload, this.seq, obu);
        if (!header.showExistingFrame) {
          unit.frames.push(
              {...this.applyFrame(header, label), temporalId: obu.temporalId});
        }
      }
    }
    this.frameCount++;
    return unit;
  }

  applyFrame(header, label) {
    const frame = {
      type: frameTypeName(header.frameType),
      key: header.frameType === FrameType.KEY,
      showFrame: header.showFrame,
      orderHint: header.orderHint,
      refreshFrameFlags: header.refreshFrameFlags,
      primaryRefFrame: header.primaryRefFrame,
      refFrameIdx: header.refFrameIdx,
      shortSignaling: !!header.shortSignaling,
      references: [],
    };
    if (header.refFrameIdx.length) {
      frame.references = [...new Set(header.refFrameIdx.map((s) => this.slots[s]))];
    }
    for (let slot = 0; slot < 8; slot++) {
      if (header.refreshFrameFlags & (1 << slot)) {
        this.slots[slot] = label;
      }
    }
    return frame;
  }
}

export function describeSequenceHeader(seq) {
  const names = ['Main', 'High', 'Professional'];
  const c = seq.color;
  return {
    profile: `AV1 ${names[seq.profile] ?? `profile ${seq.profile}`}`,
    width: seq.maxWidth,
    height: seq.maxHeight,
    bitDepth: c.bitDepth,
    chroma: chromaName(c.subsampling, c.monochrome),
    color: {described: c.described, primaries: c.primaries,
            transfer: c.transfer, matrix: c.matrix, fullRange: c.fullRange},
  };
}
