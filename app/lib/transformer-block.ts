/**
 * Stage 0 · Reference 2 — pure per-node logic/data for the transformer-block
 * lesson. No React, no d3, no user-facing prose (that lives in
 * app/lib/copy/transformer-block.ts). Numbers here are illustrative but shaped
 * to teach the right intuition.
 */

/* ---- Node 1: attention weights -----------------------------------------------
 * A hand-authored, causal (lower-triangular) attention matrix over the 9-token
 * sentence. Row q holds the weight token q puts on each earlier-or-equal token
 * k (0..q). Position-aligned across EN/ES so one matrix serves both languages.
 * "The/El cat/gato drank/bebió the/la milk/leche because/porque it/él was/estaba full/lleno"
 */
const ATTENTION: number[][] = [
  [1.0], //                                    0 The
  [0.3, 0.7], //                               1 cat
  [0.1, 0.6, 0.3], //                          2 drank → cat
  [0.15, 0.1, 0.15, 0.6], //                   3 the
  [0.05, 0.15, 0.35, 0.15, 0.3], //            4 milk → drank
  [0.05, 0.1, 0.25, 0.05, 0.2, 0.35], //       5 because
  [0.05, 0.5, 0.1, 0.03, 0.22, 0.03, 0.07], // 6 it → cat (+ milk)
  [0.03, 0.15, 0.25, 0.02, 0.1, 0.05, 0.25, 0.15], //     7 was → it/drank
  [0.03, 0.2, 0.1, 0.02, 0.22, 0.03, 0.25, 0.05, 0.1], // 8 full → it/milk/cat
];

/** The default token to highlight — the pronoun, where attention is clearest. */
export const N1_DEFAULT_QUERY = 6;

export interface AttnLink {
  k: number; // index of the attended-to (earlier) token
  w: number; // normalised weight in [0,1]
}

/** Normalised attention from token `q` to every token k ≤ q (sums to 1). */
export function attentionRow(q: number): AttnLink[] {
  const raw = ATTENTION[Math.max(0, Math.min(ATTENTION.length - 1, q))] ?? [1];
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((w, k) => ({ k, w: w / sum }));
}

/** The earlier-or-equal token that `q` attends to most (for the note line). */
export function topAttended(q: number): number {
  const row = attentionRow(q);
  return row.reduce((best, l) => (l.w > row[best].w ? l.k : best), 0);
}

/* ---- Node 3: depth → next-token distribution ---------------------------------
 * Illustrative: a deeper stack "sharpens" the guess. Base scores favour the
 * first candidate; deeper stacks scale the scores up, so softmax concentrates
 * mass on the leader. Same shape for EN/ES (candidate lists are aligned).
 */
export const N3_MIN_DEPTH = 1;
export const N3_MAX_DEPTH = 12;
export const N3_DEFAULT_DEPTH = 6;

const BASE_SCORES = [2.4, 1.5, 1.0, 0.7, 0.4];

/** Softmax over next-token scores, sharpened by stack depth. Returns 5 probs. */
export function nextTokenProbs(depth: number): number[] {
  const d = Math.max(N3_MIN_DEPTH, Math.min(N3_MAX_DEPTH, depth));
  const sharpen = 0.35 + (d - 1) * 0.15; // depth 1 → flat, depth 12 → peaked
  const logits = BASE_SCORES.map((s) => s * sharpen);
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Index of the most-likely next token at a given depth. */
export function topPrediction(depth: number): number {
  const p = nextTokenProbs(depth);
  return p.reduce((best, v, i) => (v > p[best] ? i : best), 0);
}
