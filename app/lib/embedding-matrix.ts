/**
 * Stage 1 · 1.3 — The embedding matrix. Pure per-node data + logic (no React,
 * no d3). All *displayed words* live in the copy module (bilingual), indexed to
 * these numeric rows; this file only owns the numbers: token ids, the (tiny,
 * illustrative) embedding rows, the trained 2D map, a random pre-training map,
 * and a nearest-neighbour helper.
 */

/** The four illustrative meaning-groups, in a fixed order. */
export type EmClusterIndex = 0 | 1 | 2 | 3; // animals · royalty · numbers · food

/** Design-token colour per cluster (resolved to `var(--…)` in the component). */
export const EM_CLUSTER_TOKENS = ["--tok-word", "--tok-punct", "--tok-num", "--tok-sub"] as const;

/** Which cluster each of the 13 rows belongs to (index-aligned to copy.words). */
export const EM_CLUSTER: EmClusterIndex[] = [
  0, 0, 0, 0, // cat, dog, wolf, kitten
  1, 1, 1,    // king, queen, prince
  2, 2, 2,    // one, two, three
  3, 3, 3,    // apple, bread, cheese
];

/** A plausible token id per row (the row number into the embedding matrix). */
export const EM_IDS = [
  8241, 5012, 21877, 42310,
  9127, 14203, 33190,
  606, 1088, 2884,
  15980, 19004, 40662,
];

/** Trained 2D coordinates (0..1). Clusters sit tight in four corners. */
export const EM_XY: { x: number; y: number }[] = [
  { x: 0.20, y: 0.22 }, { x: 0.29, y: 0.25 }, { x: 0.22, y: 0.33 }, { x: 0.30, y: 0.31 }, // animals
  { x: 0.72, y: 0.20 }, { x: 0.80, y: 0.23 }, { x: 0.75, y: 0.31 },                        // royalty
  { x: 0.19, y: 0.72 }, { x: 0.27, y: 0.74 }, { x: 0.23, y: 0.82 },                        // numbers
  { x: 0.72, y: 0.72 }, { x: 0.80, y: 0.75 }, { x: 0.75, y: 0.82 },                        // food
];

/** Random pre-training coordinates (0..1) — a shapeless cloud, no structure. */
export const EM_RXY: { x: number; y: number }[] = [
  { x: 0.55, y: 0.40 }, { x: 0.12, y: 0.68 }, { x: 0.83, y: 0.15 }, { x: 0.41, y: 0.88 },
  { x: 0.68, y: 0.52 }, { x: 0.22, y: 0.19 }, { x: 0.90, y: 0.77 },
  { x: 0.34, y: 0.30 }, { x: 0.60, y: 0.83 }, { x: 0.15, y: 0.44 },
  { x: 0.78, y: 0.36 }, { x: 0.47, y: 0.61 }, { x: 0.05, y: 0.85 },
];

/** Rows to expose as "focus word" buttons in node 2 (one per cluster). */
export const EM_FOCUS = [0, 4, 9, 11]; // cat · king · three · bread

/** Dimensions of the tiny illustrative vector we render (real ones: hundreds+). */
export const EM_DIMS = 8;

/* --- The embedding rows -------------------------------------------------- */

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

/** Deterministic tiny PRNG (mulberry32) so the vectors are stable, no imports. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Per-cluster "meaning" — a base vector; same-cluster rows share it (+jitter),
 *  so similar words really do have similar rows. Illustrative, not from a model. */
const CLUSTER_BASE: number[][] = [
  [0.8, 0.2, -0.6, 0.4, -0.3, 0.7, 0.1, -0.5], // animals
  [-0.5, 0.7, 0.3, -0.6, 0.5, 0.2, -0.4, 0.6], // royalty
  [0.2, -0.7, 0.6, 0.5, -0.6, -0.3, 0.7, 0.1], // numbers
  [-0.6, -0.3, -0.4, 0.2, 0.6, -0.5, 0.3, 0.7], // food
];

/** The trained embedding matrix: one row (length EM_DIMS) per token. */
export const EM_VECTORS: number[][] = EM_IDS.map((id, i) => {
  const base = CLUSTER_BASE[EM_CLUSTER[i]];
  const r = rng(id);
  return base.map((b) => clamp(b + (r() * 2 - 1) * 0.28));
});

/* --- Neighbours ---------------------------------------------------------- */

/**
 * Nearest rows to `i` on the trained map, within `radius` (so we never draw a
 * long line to an unrelated cluster), capped at `k`. Returns row indices.
 */
export function neighboursOf(i: number, k = 3, radius = 0.24): number[] {
  const a = EM_XY[i];
  return EM_XY
    .map((p, j) => ({ j, d: Math.hypot(p.x - a.x, p.y - a.y) }))
    .filter((o) => o.j !== i && o.d <= radius)
    .sort((u, v) => u.d - v.d)
    .slice(0, k)
    .map((o) => o.j);
}
