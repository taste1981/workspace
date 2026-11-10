// HEVC (H.265) parsing for the demo: access units, parameter sets, HDR10 SEI
// messages, and the reference picture set of each slice. It covers the syntax
// needed to inspect HDR10 sources and Chrome's encoder output, not the whole
// spec.

import { BitReader, splitAnnexB, toHex, unescapeRbsp } from './bitreader.js';

export const NalType = {
  IDR_W_RADL: 19,
  IDR_N_LP: 20,
  VPS: 32,
  SPS: 33,
  PPS: 34,
  AUD: 35,
  PREFIX_SEI: 39,
  SUFFIX_SEI: 40,
};

const NAL_NAMES = {
  0: 'TRAIL_N', 1: 'TRAIL_R', 2: 'TSA_N', 3: 'TSA_R', 4: 'STSA_N',
  5: 'STSA_R', 6: 'RADL_N', 7: 'RADL_R', 8: 'RASL_N', 9: 'RASL_R',
  16: 'BLA_W_LP', 17: 'BLA_W_RADL', 18: 'BLA_N_LP', 19: 'IDR_W_RADL',
  20: 'IDR_N_LP', 21: 'CRA', 32: 'VPS', 33: 'SPS', 34: 'PPS', 35: 'AUD',
  36: 'EOS', 37: 'EOB', 38: 'FD', 39: 'SEI', 40: 'SEI (suffix)',
};

const SEI_NAMES = {
  0: 'Buffering period', 1: 'Picture timing', 4: 'User data (T.35)',
  5: 'User data (unregistered)', 129: 'Active parameter sets',
  137: 'Mastering display colour volume', 144: 'Content light level',
  147: 'Alternative transfer characteristics',
};

const SLICE_TYPES = ['B', 'P', 'I'];

export const nalTypeName = (type) => NAL_NAMES[type] ?? `NAL ${type}`;

export function nalHeader(nal) {
  return {
    type: (nal[0] >> 1) & 0x3f,
    temporalId: (nal[1] & 7) - 1,
  };
}

const isVcl = (type) => type < 32;
const isIrap = (type) => type >= 16 && type <= 23;
const isIdr = (type) =>
  type === NalType.IDR_W_RADL || type === NalType.IDR_N_LP;
const isLeading = (type) => type >= 6 && type <= 9;
// Sub-layer non-reference pictures: TRAIL_N, TSA_N, STSA_N, RADL_N, RASL_N
// and the reserved RSV_VCL_N10/12/14.
const isSubLayerNonReference = (type) => type <= 14 && type % 2 === 0;

// Groups NAL units into access units (one coded picture each), following
// the first-NAL-of-an-access-unit rules in H.265 section 7.4.2.4.4.
export function splitAccessUnits(nals) {
  const units = [];
  let current = [];
  let hasVcl = false;
  for (const nal of nals) {
    const { type } = nalHeader(nal);
    const firstSliceOfPicture = isVcl(type) && (nal[2] & 0x80) !== 0;
    const startsUnit = firstSliceOfPicture ||
        (type >= NalType.VPS && type <= NalType.AUD) ||
        type === NalType.PREFIX_SEI || (type >= 41 && type <= 44) ||
        (type >= 48 && type <= 55);
    if (hasVcl && startsUnit) {
      units.push(current);
      current = [];
      hasVcl = false;
    }
    current.push(nal);
    hasVcl ||= isVcl(type);
  }
  if (current.length) {
    units.push(current);
  }
  return units;
}

export function splitAnnexBAccessUnits(bytes) {
  return splitAccessUnits(splitAnnexB(bytes));
}

function parseProfileTierLevel(r, maxSubLayersMinus1) {
  const ptl = {
    profileSpace: r.u(2),
    tier: r.u(1),
    profileIdc: r.u(5),
    compatibilityFlags: r.u(32),
    constraintBytes: Array.from({length: 6}, () => r.u(8)),
    levelIdc: r.u(8),
  };
  const profilePresent = [];
  const levelPresent = [];
  for (let i = 0; i < maxSubLayersMinus1; i++) {
    profilePresent.push(r.flag());
    levelPresent.push(r.flag());
  }
  if (maxSubLayersMinus1 > 0) {
    r.skip(2 * (8 - maxSubLayersMinus1));
  }
  for (let i = 0; i < maxSubLayersMinus1; i++) {
    if (profilePresent[i]) {
      r.skip(88);
    }
    if (levelPresent[i]) {
      r.skip(8);
    }
  }
  return ptl;
}

// The RFC 6381 / ISO 14496-15 codec string, e.g. "hvc1.2.4.L93.B0".
export function codecString(ptl, sampleEntry = 'hvc1') {
  let reversedCompatibility = 0;
  for (let i = 0; i < 32; i++) {
    const bit = Math.floor(ptl.compatibilityFlags / 2 ** (31 - i)) % 2;
    reversedCompatibility += bit * 2 ** i;
  }
  const constraints = ptl.constraintBytes.slice();
  while (constraints.length && constraints.at(-1) === 0) {
    constraints.pop();
  }
  return [
    sampleEntry,
    ['', 'A', 'B', 'C'][ptl.profileSpace] + ptl.profileIdc,
    reversedCompatibility.toString(16).toUpperCase(),
    (ptl.tier ? 'H' : 'L') + ptl.levelIdc,
    ...constraints.map((b) => toHex(b)),
  ].join('.');
}

function skipScalingListData(r) {
  for (let sizeId = 0; sizeId < 4; sizeId++) {
    for (let matrixId = 0; matrixId < 6; matrixId += sizeId === 3 ? 3 : 1) {
      if (!r.flag()) {  // scaling_list_pred_mode_flag
        r.ue();  // scaling_list_pred_matrix_id_delta
        continue;
      }
      const coefficients = Math.min(64, 1 << (4 + (sizeId << 1)));
      if (sizeId > 1) {
        r.se();  // scaling_list_dc_coef_minus8
      }
      for (let i = 0; i < coefficients; i++) {
        r.se();  // scaling_list_delta_coef
      }
    }
  }
}

// st_ref_pic_set(), returning the derived DeltaPocS0/S1 lists (H.265
// equations 7-61 to 7-64) as {negative, positive} arrays of {delta, used}.
function parseShortTermRefPicSet(r, index, sets, numSets) {
  const interPrediction = index !== 0 && r.flag();
  if (!interPrediction) {
    const numNegative = r.ue();
    const numPositive = r.ue();
    const negative = [];
    const positive = [];
    let poc = 0;
    for (let i = 0; i < numNegative; i++) {
      poc -= r.ue() + 1;
      negative.push({delta: poc, used: r.flag()});
    }
    poc = 0;
    for (let i = 0; i < numPositive; i++) {
      poc += r.ue() + 1;
      positive.push({delta: poc, used: r.flag()});
    }
    return {negative, positive};
  }

  const deltaIndex = index === numSets ? r.ue() + 1 : 1;
  const sign = r.u(1);
  const deltaRps = (1 - 2 * sign) * (r.ue() + 1);
  const ref = sets[index - deltaIndex];
  const refNegative = ref.negative.length;
  const numDeltaPocs = refNegative + ref.positive.length;
  const used = [];
  const useDelta = [];
  for (let j = 0; j <= numDeltaPocs; j++) {
    used[j] = r.flag();
    useDelta[j] = used[j] || r.flag();
  }

  const negative = [];
  const positive = [];
  for (let j = ref.positive.length - 1; j >= 0; j--) {
    const delta = ref.positive[j].delta + deltaRps;
    if (delta < 0 && useDelta[refNegative + j]) {
      negative.push({delta, used: used[refNegative + j]});
    }
  }
  if (deltaRps < 0 && useDelta[numDeltaPocs]) {
    negative.push({delta: deltaRps, used: used[numDeltaPocs]});
  }
  for (let j = 0; j < refNegative; j++) {
    const delta = ref.negative[j].delta + deltaRps;
    if (delta < 0 && useDelta[j]) {
      negative.push({delta, used: used[j]});
    }
  }
  for (let j = refNegative - 1; j >= 0; j--) {
    const delta = ref.negative[j].delta + deltaRps;
    if (delta > 0 && useDelta[j]) {
      positive.push({delta, used: used[j]});
    }
  }
  if (deltaRps > 0 && useDelta[numDeltaPocs]) {
    positive.push({delta: deltaRps, used: used[numDeltaPocs]});
  }
  for (let j = 0; j < ref.positive.length; j++) {
    const delta = ref.positive[j].delta + deltaRps;
    if (delta > 0 && useDelta[refNegative + j]) {
      positive.push({delta, used: used[refNegative + j]});
    }
  }
  return {negative, positive};
}

// The video signal type fields of vui_parameters(); the rest of the VUI is
// not needed.
function parseVuiColor(r) {
  const color = {described: false, primaries: 2, transfer: 2, matrix: 2,
                 fullRange: false};
  if (r.flag()) {  // aspect_ratio_info_present_flag
    if (r.u(8) === 255) {
      r.skip(32);  // sar_width, sar_height
    }
  }
  if (r.flag()) {  // overscan_info_present_flag
    r.skip(1);
  }
  if (r.flag()) {  // video_signal_type_present_flag
    r.skip(3);  // video_format
    color.fullRange = r.flag();
    if (r.flag()) {  // colour_description_present_flag
      color.described = true;
      color.primaries = r.u(8);
      color.transfer = r.u(8);
      color.matrix = r.u(8);
    }
  }
  return color;
}

export function parseSps(nal) {
  const r = new BitReader(unescapeRbsp(nal), 2);
  const sps = {};
  r.skip(4);  // sps_video_parameter_set_id
  const maxSubLayersMinus1 = r.u(3);
  r.skip(1);  // sps_temporal_id_nesting_flag
  sps.profileTierLevel = parseProfileTierLevel(r, maxSubLayersMinus1);
  sps.id = r.ue();
  sps.chromaFormatIdc = r.ue();
  sps.separateColourPlane = sps.chromaFormatIdc === 3 && r.flag();
  sps.width = r.ue();
  sps.height = r.ue();
  if (r.flag()) {  // conformance_window_flag
    const [left, right, top, bottom] = [r.ue(), r.ue(), r.ue(), r.ue()];
    const unitX = sps.chromaFormatIdc === 1 || sps.chromaFormatIdc === 2 ? 2 : 1;
    const unitY = sps.chromaFormatIdc === 1 ? 2 : 1;
    sps.width -= unitX * (left + right);
    sps.height -= unitY * (top + bottom);
  }
  sps.bitDepth = r.ue() + 8;
  sps.bitDepthChroma = r.ue() + 8;
  sps.log2MaxPocLsb = r.ue() + 4;
  const orderingInfoPresent = r.flag();
  for (let i = orderingInfoPresent ? 0 : maxSubLayersMinus1;
       i <= maxSubLayersMinus1; i++) {
    sps.maxDecPicBuffering = r.ue() + 1;
    r.ue();  // sps_max_num_reorder_pics
    r.ue();  // sps_max_latency_increase_plus1
  }
  r.ue();  // log2_min_luma_coding_block_size_minus3
  r.ue();  // log2_diff_max_min_luma_coding_block_size
  r.ue();  // log2_min_luma_transform_block_size_minus2
  r.ue();  // log2_diff_max_min_luma_transform_block_size
  r.ue();  // max_transform_hierarchy_depth_inter
  r.ue();  // max_transform_hierarchy_depth_intra
  if (r.flag() && r.flag()) {  // scaling list enabled, data present
    skipScalingListData(r);
  }
  r.skip(2);  // amp_enabled_flag, sample_adaptive_offset_enabled_flag
  if (r.flag()) {  // pcm_enabled_flag
    r.skip(8);  // PCM sample bit depths
    r.ue();
    r.ue();
    r.skip(1);  // pcm_loop_filter_disabled_flag
  }
  const numShortTermRefPicSets = r.ue();
  sps.shortTermRefPicSets = [];
  for (let i = 0; i < numShortTermRefPicSets; i++) {
    sps.shortTermRefPicSets.push(parseShortTermRefPicSet(
        r, i, sps.shortTermRefPicSets, numShortTermRefPicSets));
  }
  sps.longTermRefPicsPresent = r.flag();
  sps.longTermRefPics = [];
  if (sps.longTermRefPicsPresent) {
    const count = r.ue();
    for (let i = 0; i < count; i++) {
      sps.longTermRefPics.push(
          {pocLsb: r.u(sps.log2MaxPocLsb), used: r.flag()});
    }
  }
  r.skip(2);  // sps_temporal_mvp_enabled_flag, strong_intra_smoothing
  sps.color = r.flag() ? parseVuiColor(r)
                       : {described: false, primaries: 2, transfer: 2,
                          matrix: 2, fullRange: false};
  return sps;
}

export function parsePps(nal) {
  const r = new BitReader(unescapeRbsp(nal), 2);
  return {
    id: r.ue(),
    spsId: r.ue(),
    dependentSliceSegments: r.flag(),
    outputFlagPresent: r.flag(),
    numExtraSliceHeaderBits: r.u(3),
  };
}

function decodeSeiMessage(type, payload) {
  const name = SEI_NAMES[type] ?? `SEI type ${type}`;
  const r = new BitReader(payload);
  if (type === 137 && payload.length >= 24) {
    // Primaries are stored in green, blue, red order.
    const [green, blue, red] = Array.from(
        {length: 3}, () => [r.u(16) / 50000, r.u(16) / 50000]);
    const white = [r.u(16) / 50000, r.u(16) / 50000];
    return {type, name, mdcv: {
      red, green, blue, white,
      maxLuminance: r.u(32) / 10000,
      minLuminance: r.u(32) / 10000,
    }};
  }
  if (type === 144 && payload.length >= 4) {
    return {type, name, cll: {maxCll: r.u(16), maxFall: r.u(16)}};
  }
  return {type, name};
}

export function parseSei(nal) {
  const rbsp = unescapeRbsp(nal);
  const messages = [];
  let i = 2;
  // Stop at rbsp_trailing_bits (a final 0x80).
  while (i < rbsp.length && !(i === rbsp.length - 1 && rbsp[i] === 0x80)) {
    let type = 0;
    while (rbsp[i] === 0xff) {
      type += 255;
      i++;
    }
    type += rbsp[i++];
    let size = 0;
    while (rbsp[i] === 0xff) {
      size += 255;
      i++;
    }
    size += rbsp[i++];
    messages.push(decodeSeiMessage(type, rbsp.subarray(i, i + size)));
    i += size;
  }
  return messages;
}

// Parses the first slice segment header of a picture up to the reference
// picture set. Returns null for dependent or non-first slice segments.
function parseSliceHeader(nal, spsById, ppsById) {
  const {type} = nalHeader(nal);
  const r = new BitReader(unescapeRbsp(nal), 2);
  if (!r.flag()) {  // first_slice_segment_in_pic_flag
    return null;
  }
  if (isIrap(type)) {
    r.skip(1);  // no_output_of_prior_pics_flag
  }
  const pps = ppsById.get(r.ue());
  const sps = pps && spsById.get(pps.spsId);
  if (!sps) {
    throw new Error('Slice refers to a missing SPS or PPS');
  }
  r.skip(pps.numExtraSliceHeaderBits);
  const header = {
    sliceType: SLICE_TYPES[r.ue()] ?? '?',
    pocLsb: 0,
    shortTerm: {negative: [], positive: []},
    longTerm: [],
    sps,
  };
  if (pps.outputFlagPresent) {
    r.skip(1);
  }
  if (sps.separateColourPlane) {
    r.skip(2);
  }
  if (isIdr(type)) {
    return header;
  }
  header.pocLsb = r.u(sps.log2MaxPocLsb);
  const numSets = sps.shortTermRefPicSets.length;
  if (!r.flag()) {  // short_term_ref_pic_set_sps_flag
    header.shortTerm =
        parseShortTermRefPicSet(r, numSets, sps.shortTermRefPicSets, numSets);
  } else {
    const index = numSets > 1 ? r.u(Math.ceil(Math.log2(numSets))) : 0;
    header.shortTerm = sps.shortTermRefPicSets[index];
  }
  if (sps.longTermRefPicsPresent) {
    const numCandidates = sps.longTermRefPics.length;
    const numFromSps = numCandidates > 0 ? r.ue() : 0;
    const numExplicit = r.ue();
    let msbCycle = 0;
    for (let i = 0; i < numFromSps + numExplicit; i++) {
      let entry;
      if (i < numFromSps) {
        const index =
            numCandidates > 1 ? r.u(Math.ceil(Math.log2(numCandidates))) : 0;
        entry = {...sps.longTermRefPics[index]};
      } else {
        entry = {pocLsb: r.u(sps.log2MaxPocLsb), used: r.flag()};
      }
      if (r.flag()) {  // delta_poc_msb_present_flag
        // DeltaPocMsbCycleLt accumulates within each of the two groups.
        msbCycle = (i === 0 || i === numFromSps ? 0 : msbCycle) + r.ue();
        entry.msbCycle = msbCycle;
      }
      header.longTerm.push(entry);
    }
  }
  return header;
}

const mod = (a, n) => ((a % n) + n) % n;

// Tracks parameter sets and picture order counts across a stream, so each
// access unit can be described with its POC and the POCs it references.
export class HevcStreamParser {
  constructor() {
    this.spsById = new Map();
    this.ppsById = new Map();
    this.prevTid0Poc = 0;
    this.decodedPocs = [];
  }

  parseAccessUnit(nals) {
    const unit = {nalTypes: [], sei: [], poc: null, sliceType: null,
                  key: false, references: [], kept: [], sps: null,
                  temporalId: null};
    for (const nal of nals) {
      const header = nalHeader(nal);
      unit.nalTypes.push(nalTypeName(header.type));
      if (header.type === NalType.SPS) {
        const sps = parseSps(nal);
        this.spsById.set(sps.id, sps);
        unit.sps = sps;
      } else if (header.type === NalType.PPS) {
        const pps = parsePps(nal);
        this.ppsById.set(pps.id, pps);
      } else if (header.type === NalType.PREFIX_SEI ||
                 header.type === NalType.SUFFIX_SEI) {
        unit.sei.push(...parseSei(nal));
      } else if (isVcl(header.type) && unit.poc === null) {
        unit.temporalId = header.temporalId;
        const slice = parseSliceHeader(nal, this.spsById, this.ppsById);
        if (slice) {
          this.resolvePicture(unit, slice, header);
        }
      }
    }
    return unit;
  }

  // Derives PicOrderCntVal (H.265 section 8.3.1), the POCs of the pictures
  // the current one uses for prediction, and the POCs it only keeps for later
  // pictures. A decoder drops every picture that is in neither list.
  resolvePicture(unit, slice, nal) {
    const maxPocLsb = 2 ** slice.sps.log2MaxPocLsb;
    // BLA and IDR pictures always have NoRaslOutputFlag set; a CRA only when
    // it starts the stream.
    const noRaslOutput = isIrap(nal.type) &&
        (nal.type <= NalType.IDR_N_LP || this.decodedPocs.length === 0);
    let pocMsb = 0;
    if (!noRaslOutput) {
      const prevLsb = mod(this.prevTid0Poc, maxPocLsb);
      const prevMsb = this.prevTid0Poc - prevLsb;
      if (slice.pocLsb < prevLsb && prevLsb - slice.pocLsb >= maxPocLsb / 2) {
        pocMsb = prevMsb + maxPocLsb;
      } else if (slice.pocLsb > prevLsb &&
                 slice.pocLsb - prevLsb > maxPocLsb / 2) {
        pocMsb = prevMsb - maxPocLsb;
      } else {
        pocMsb = prevMsb;
      }
    }
    if (noRaslOutput) {
      this.decodedPocs = [];
    }
    const poc = pocMsb + slice.pocLsb;
    if (nal.temporalId === 0 && !isLeading(nal.type) &&
        !isSubLayerNonReference(nal.type)) {
      this.prevTid0Poc = poc;
    }

    unit.poc = poc;
    unit.sliceType = slice.sliceType;
    unit.key = isIrap(nal.type);
    for (const {delta, used} of [...slice.shortTerm.negative,
                                 ...slice.shortTerm.positive]) {
      (used ? unit.references : unit.kept)
          .push({poc: poc + delta, longTerm: false});
    }
    for (const entry of slice.longTerm) {
      let refPoc;
      if (entry.msbCycle !== undefined) {
        refPoc = poc - entry.msbCycle * maxPocLsb - (slice.pocLsb - entry.pocLsb);
      } else {
        refPoc = this.decodedPocs.findLast(
            (p) => mod(p, maxPocLsb) === entry.pocLsb);
      }
      (entry.used ? unit.references : unit.kept)
          .push({poc: refPoc, longTerm: true});
    }
    this.decodedPocs.push(poc);
  }
}

// Summarizes an SPS for display.
export function describeSps(sps) {
  const chroma = ['4:0:0', '4:2:0', '4:2:2', '4:4:4'][sps.chromaFormatIdc];
  return {
    codec: codecString(sps.profileTierLevel),
    profile: profileName(sps.profileTierLevel),
    width: sps.width,
    height: sps.height,
    bitDepth: sps.bitDepth,
    chroma,
    color: sps.color,
  };
}

function profileName(ptl) {
  const names = {1: 'Main', 2: 'Main 10', 3: 'Main Still Picture',
                 4: 'Range Extensions'};
  return `HEVC ${names[ptl.profileIdc] ?? `profile ${ptl.profileIdc}`}`;
}
