// PMF loading + table precompute. Mirrors EntropyCoder.cpp Initialize paths:
// - descriptor per distribution: valueOffset, bypassSentinel (= len - 1, tail mass),
//   symbolOffset (running sum of lengths into the concatenated freq table)
// - encoder: one RansEncSymbol per (distribution, symbol)
// - decoder: CDF table per distribution, entries [start0 .. start_sentinel, total]
//   (start0 is always 0; total is 65536); symbol = last index with start <= cumFreq
import { buildEncSymbol, getBypassSymbols } from "./rans.js";

export const SYMBOL_BITS = 16;
export const SCALE = 1 << SYMBOL_BITS; // 65536

export function buildCoder(pmfLengths, pmfOffsets, pmfTable, symbolBits = SYMBOL_BITS, bypassBits = 2) {
  const numDists = pmfLengths.length;
  if (pmfOffsets.length !== numDists) throw new Error("pmf: lengths/offsets size mismatch");

  const descs = new Array(numDists);
  const encSymbols = [];

  // Encoder symbol tables (running-sum offsets into the concatenated freq table)
  let symCursor = 0;
  for (let d = 0; d < numDists; d++) {
    const len = pmfLengths[d];
    let start = 0;
    for (let s = 0; s < len; s++) {
      const freq = pmfTable[symCursor + s];
      if (!(freq > 0 && freq <= SCALE - start)) throw new Error(`pmf: bad freq at dist ${d} sym ${s}`);
      encSymbols.push(buildEncSymbol(start, freq, symbolBits));
      start += freq;
    }
    if (start !== SCALE) throw new Error(`pmf: dist ${d} freqs sum to ${start}, expected ${SCALE}`);
    descs[d] = { valueOffset: pmfOffsets[d], bypassSentinel: len - 1, symbolOffset: symCursor, cdfOffset: 0 };
    symCursor += len;
  }

  // Decoder CDF — exact C++ layout (EntropyCoder.cpp:723-742): entries for dist d
  // live at [cursor(d) + d .. cursor(d) + d + len], with the trailing total entry.
  const cdf = new Uint32Array(pmfTable.length + numDists);
  let cursor = 0;
  for (let d = 0; d < numDists; d++) {
    const len = pmfLengths[d];
    const sentinel = len - 1;
    let start = 0;
    for (let s = 0; s <= sentinel; s++, cursor++) {
      const freq = pmfTable[cursor];
      cdf[cursor + d] = start;
      start += freq;
    }
    cdf[cursor + d] = start; // total (== SCALE)
    descs[d].cdfOffset = descs[d].symbolOffset + d;
  }

  return { numDists, descs, encSymbols, cdf, symbolBits, bypassBits, bypassSymbols: getBypassSymbols(bypassBits) };
}

export async function loadPmfJson(url, symbolBits = SYMBOL_BITS, bypassBits = 2) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`pmf: failed to load ${url}: ${res.status}`);
  const json = await res.json();
  return buildCoder(json.pmf_lengths, json.pmf_offsets, json.pmf_table, symbolBits, bypassBits);
}
