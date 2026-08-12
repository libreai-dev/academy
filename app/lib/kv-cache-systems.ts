/**
 * Stage 0 · Serving (Expert) — KV-cache systems. Pure logic + data for the three
 * node diagrams (no React, no d3). Numbers are realistic-but-illustrative: a
 * 32-block cache stands in for the tens of thousands of real KV blocks on a GPU,
 * so the fragmentation / paging / prefix-sharing behaviour is visible at a glance.
 */

export const TOTAL_BLOCKS = 32;

/* ------------------------------------------------------------------ Node 1 -- */
/* Contiguous reservation → internal + external fragmentation.                  */

export const N1_IDS = ["R1", "R2", "R3"] as const;
/** Blocks each request actually generated (short answers vs its big reservation). */
export const N1_USED = [4, 3, 5];
export const N1_RESERVE_MIN = 4;
export const N1_RESERVE_MAX = 9;

export interface FragSlab {
  id: string;
  start: number;
  used: number;
  reserve: number;
  freed: boolean;
}

export interface FragResult {
  slabs: FragSlab[];
  freeRuns: { start: number; len: number }[];
  usedBlocks: number;
  emptyReserved: number;
  utilPct: number; //     usedBlocks / TOTAL_BLOCKS
  freeTotal: number;
  largestGap: number;
}

/** Lay the three requests out contiguously, each reserving `reserve` blocks. */
export function computeFrag(reserve: number, freeR2: boolean): FragResult {
  const slabs: FragSlab[] = N1_IDS.map((id, i) => ({
    id,
    start: i * reserve,
    used: Math.min(N1_USED[i], reserve),
    reserve,
    freed: freeR2 && id === "R2",
  }));

  const occ = new Array<boolean>(TOTAL_BLOCKS).fill(false);
  slabs.forEach((s) => {
    if (s.freed) return;
    for (let b = s.start; b < s.start + s.reserve && b < TOTAL_BLOCKS; b++) occ[b] = true;
  });

  const freeRuns: { start: number; len: number }[] = [];
  let i = 0;
  while (i < TOTAL_BLOCKS) {
    if (occ[i]) {
      i++;
      continue;
    }
    const start = i;
    while (i < TOTAL_BLOCKS && !occ[i]) i++;
    freeRuns.push({ start, len: i - start });
  }

  const active = slabs.filter((s) => !s.freed);
  const usedBlocks = active.reduce((a, s) => a + s.used, 0);
  const reservedBlocks = active.reduce((a, s) => a + s.reserve, 0);
  const freeTotal = freeRuns.reduce((a, r) => a + r.len, 0);
  const largestGap = freeRuns.reduce((a, r) => Math.max(a, r.len), 0);

  return {
    slabs,
    freeRuns,
    usedBlocks,
    emptyReserved: reservedBlocks - usedBlocks,
    utilPct: usedBlocks / TOTAL_BLOCKS,
    freeTotal,
    largestGap,
  };
}

/* ------------------------------------------------------------------ Node 2 -- */
/* Contiguous slabs vs fixed pages (PagedAttention).                            */

/** Blocks each request truly needs (index = request id − 1). */
export const N2_NEED = [3, 5, 2, 6, 4, 3];
/** Naive serving reserves this many contiguous blocks per request (its max). */
export const N2_RESERVE = 6;
/** Tokens per fixed page. */
export const N2_PAGE = 2;
export const N2_MAX_REQ = 6;
/** A deterministic scatter order so paged allocation looks non-contiguous. */
const PAGE_ORDER = [0, 2, 4, 6, 8, 10, 12, 14, 1, 3, 5, 7, 9, 11, 13, 15];

export interface PageResult {
  contigSlabs: { owner: number; start: number; used: number; reserve: number }[];
  contigRejected: number[]; //   owner indices that didn't fit
  contigUsed: number;
  contigLocked: number; //       blocks locked by admitted slabs
  /** Page ownership across the cache: owner index, or -1 for a free page. */
  pages: number[];
  pagedUsed: number;
  pagedLocked: number;
  pagedRejected: number[];
}

export function computePaging(active: number): PageResult {
  const needs = N2_NEED.slice(0, active);

  // Contiguous: greedily place a fixed-size slab per request, in order.
  let cursor = 0;
  const contigSlabs: PageResult["contigSlabs"] = [];
  const contigRejected: number[] = [];
  let contigUsed = 0;
  needs.forEach((need, i) => {
    if (cursor + N2_RESERVE <= TOTAL_BLOCKS) {
      contigSlabs.push({ owner: i, start: cursor, used: need, reserve: N2_RESERVE });
      cursor += N2_RESERVE;
      contigUsed += need;
    } else {
      contigRejected.push(i);
    }
  });

  // Paged: hand out just enough pages, scattered across the cache.
  const nPages = TOTAL_BLOCKS / N2_PAGE;
  const pages = new Array<number>(nPages).fill(-1);
  let oi = 0;
  let pagedUsed = 0;
  const pagedRejected: number[] = [];
  needs.forEach((need, i) => {
    const want = Math.ceil(need / N2_PAGE);
    if (oi + want <= nPages) {
      for (let k = 0; k < want; k++) pages[PAGE_ORDER[oi++]] = i;
      pagedUsed += need;
    } else {
      pagedRejected.push(i);
    }
  });

  const pagedLocked = pages.filter((p) => p >= 0).length * N2_PAGE;
  return {
    contigSlabs,
    contigRejected,
    contigUsed,
    contigLocked: contigSlabs.length * N2_RESERVE,
    pages,
    pagedUsed,
    pagedLocked,
    pagedRejected,
  };
}

/* ------------------------------------------------------------------ Node 3 -- */
/* Shared prefix stored once (RadixAttention) vs stored per request.            */

export const N3_PREFIX = 6;
export const N3_SUFFIX = [3, 4, 2, 3, 4, 2];
export const N3_MIN_REQ = 2;
export const N3_MAX_REQ = 6;

export interface RadixResult {
  prefix: number;
  suffixes: number[];
  storedShared: number; //   prefix + Σ suffix
  storedNaive: number; //    n·prefix + Σ suffix
  savedBlocks: number;
  savedPct: number;
}

export function computeRadix(active: number): RadixResult {
  const suffixes = N3_SUFFIX.slice(0, active);
  const sumSuffix = suffixes.reduce((a, b) => a + b, 0);
  const storedShared = N3_PREFIX + sumSuffix;
  const storedNaive = active * N3_PREFIX + sumSuffix;
  const savedBlocks = storedNaive - storedShared;
  return {
    prefix: N3_PREFIX,
    suffixes,
    storedShared,
    storedNaive,
    savedBlocks,
    savedPct: storedNaive > 0 ? savedBlocks / storedNaive : 0,
  };
}
