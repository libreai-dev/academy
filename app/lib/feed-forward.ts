/**
 * Pure logic + data for the "Feed-forward network" lesson (Stage 0 · 2·B).
 *
 * No React, no d3 — just the small deterministic math the three diagrams draw:
 *   1. Expand — capacity/parameter numbers as the expansion factor changes.
 *   2. Activate — a deterministic, clustered "firing" pattern per example input
 *      (so each input lights a distinct subset of the hidden units).
 *   3. Compress — no computation; the down-projection + residual is drawn from
 *      the toggle state alone.
 *
 * All numbers are realistic-but-illustrative (a mid-size LLM layer).
 */

/* ----------------------------------------------------------- Node 1 --------- */

/** Illustrative model width (a token vector's length). */
export const D_MODEL = 4096;

export interface ExpandStat {
  factor: number;
  /** Hidden width d_ff = factor × d_model. */
  dFf: number;
  /** Params in this feed-forward layer (up + down ≈ 2·d_model·d_ff), millions. */
  paramsM: number;
}

/** Capacity + parameter count for one feed-forward layer at a given width. */
export function expandStat(factor: number): ExpandStat {
  const dFf = D_MODEL * factor;
  const params = 2 * D_MODEL * dFf; // up-projection + down-projection
  return { factor, dFf, paramsM: Math.round(params / 1e6) };
}

/* ----------------------------------------------------------- Node 2 --------- */
/*  A sampled grid of hidden units; each example input opens a distinct cluster. */

export const FIRE_COLS = 12;
export const FIRE_ROWS = 6;
export const FIRE_N = FIRE_COLS * FIRE_ROWS; // 72 sampled units

/** Above this gate value a unit "fires" (passes information through). */
export const FIRE_THRESHOLD = 0.5;

/** Cluster centres (col,row) per example input — different inputs, different
 *  regions light up. Purely illustrative: real units aren't this tidy. */
const CENTERS: [number, number][][] = [
  [ [2, 1], [3, 2], [9, 4] ],        // input 0 — a "geography/places" cluster
  [ [8, 0], [9, 1], [4, 4], [5, 5] ],// input 1 — a "code/syntax" cluster
  [ [6, 2], [1, 4], [2, 5] ],        // input 2 — a "sentiment/tone" cluster
];

/** Deterministic gate value in [0,1] for every sampled unit, for one input. */
export function gateValues(inputIdx: number): number[] {
  const centers = CENTERS[inputIdx % CENTERS.length];
  const sigma2 = 3.2; // cluster spread
  const out: number[] = [];
  for (let i = 0; i < FIRE_N; i++) {
    const col = i % FIRE_COLS;
    const row = Math.floor(i / FIRE_COLS);
    let g = 0;
    for (const [cc, cr] of centers) {
      const d2 = (col - cc) ** 2 + (row - cr) ** 2;
      g = Math.max(g, Math.exp(-d2 / sigma2));
    }
    // A touch of deterministic noise so it doesn't look like perfect blobs.
    let h = Math.sin((i + 1) * (inputIdx * 12.9898 + 78.233)) * 43758.5453;
    h = h - Math.floor(h);
    out.push(Math.min(1, g * 0.9 + h * 0.14));
  }
  return out;
}

/** How many sampled units fire for this input. */
export function firingCount(vals: number[], thr = FIRE_THRESHOLD): number {
  return vals.reduce((n, v) => (v > thr ? n + 1 : n), 0);
}
