/**
 * Stage 0 · 1.3 — Positional encoding. Pure logic + data (no React, no d3).
 *
 * One idea: attention reads every token at once and, on its own, ignores word
 * order — so "dog bites man" and "man bites dog" would look identical. Positional
 * encoding fixes this by ADDING a small position signal to each token's vector,
 * so the same word in a different slot becomes a different vector.
 *
 * The heavy RoPE math is deliberately NOT here — that's a separate Expert lesson.
 * We use the original sinusoidal encoding (Vaswani et al. 2017), shrunk to a
 * tiny dimension so it draws cleanly, kept behind a "Go deeper" block.
 */

/** The small vector width we visualise (real models use hundreds–thousands). */
export const DIM = 8;

/** How many slots the position control offers. */
export const POSITIONS = [0, 1, 2, 3] as const;

/**
 * A fixed, illustrative "meaning" vector for the demo token — the kind of row
 * the embedding lesson looked up. Values in roughly [-1, 1]; identical for the
 * word no matter where it sits (that's the whole problem).
 */
export const MEANING_VECTOR: number[] = [0.72, -0.44, 0.55, 0.18, -0.66, 0.34, -0.12, 0.5];

/**
 * The real sinusoidal position signal for a given slot, shrunk to DIM.
 * Even dimensions use sin, odd use cos, and the wavelength grows across the
 * vector — so every position gets its own distinctive pattern. This is the
 * actual 2017 formula, just small; the derivation lives in the "Go deeper" block.
 */
export function positionalVector(pos: number, dim = DIM): number[] {
  const v: number[] = [];
  for (let i = 0; i < dim; i++) {
    const pair = Math.floor(i / 2);
    const denom = Math.pow(10000, (2 * pair) / dim);
    const angle = pos / denom;
    v.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
  }
  return v;
}

/** meaning + position (or just meaning, when the signal is switched off). */
export function combinedVector(pos: number, on: boolean, dim = DIM): number[] {
  const m = MEANING_VECTOR.slice(0, dim);
  if (!on) return m.slice();
  const p = positionalVector(pos, dim);
  return m.map((x, i) => x + p[i]);
}

/**
 * How different two slots' combined vectors are — a single plain number the
 * diagram can't show at a glance. 0 means "the model literally cannot tell the
 * two positions apart" (what happens with the signal off).
 */
export function slotDistance(a: number, b: number, on: boolean, dim = DIM): number {
  const va = combinedVector(a, on, dim);
  const vb = combinedVector(b, on, dim);
  let s = 0;
  for (let i = 0; i < dim; i++) s += (va[i] - vb[i]) ** 2;
  return Math.sqrt(s);
}

/* --------------------------------------------------------------- orderings -- */

/**
 * One arrangement of the same three words. `order` holds indices into the base
 * word list (0 = first noun, 1 = verb, 2 = second noun), so the copy stays in
 * one place and both languages reuse these positions.
 */
export interface Ordering {
  key: string;
  order: number[];
}

/** Same three words, three arrangements — two real sentences and one scramble. */
export const ORDERINGS: Ordering[] = [
  { key: "svo", order: [0, 1, 2] }, // dog bites man
  { key: "ovs", order: [2, 1, 0] }, // man bites dog
  { key: "scramble", order: [1, 2, 0] }, // bites man dog (nonsense)
];

/** The canonical, order-free arrangement the "bag" always shows (sorted slots). */
export const BAG_ORDER: number[] = [0, 1, 2];
