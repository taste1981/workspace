// Names for the color description code points (ITU-T H.273) shared by HEVC
// VUI and the AV1 color config.

const PRIMARIES = {
  1: 'BT.709', 2: 'Unspecified', 4: 'BT.470 M', 5: 'BT.470 BG', 6: 'BT.601',
  7: 'SMPTE 240M', 8: 'Film', 9: 'BT.2020', 10: 'XYZ', 11: 'DCI-P3',
  12: 'Display P3', 22: 'EBU 3213',
};

const TRANSFER = {
  1: 'BT.709', 2: 'Unspecified', 4: 'Gamma 2.2', 5: 'Gamma 2.8', 6: 'BT.601',
  7: 'SMPTE 240M', 8: 'Linear', 13: 'sRGB', 14: 'BT.2020 10-bit',
  15: 'BT.2020 12-bit', 16: 'PQ', 17: 'SMPTE ST 428', 18: 'HLG',
};

const MATRIX = {
  0: 'Identity (RGB)', 1: 'BT.709', 2: 'Unspecified', 5: 'BT.470 BG',
  6: 'BT.601', 9: 'BT.2020 NCL', 10: 'BT.2020 CL', 14: 'ICtCp',
};

export const primariesName = (code) => PRIMARIES[code] ?? `code ${code}`;
export const transferName = (code) => TRANSFER[code] ?? `code ${code}`;
export const matrixName = (code) => MATRIX[code] ?? `code ${code}`;

// True for the PQ and HLG transfer functions.
export const isHdrTransfer = (code) => code === 16 || code === 18;
