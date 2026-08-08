/**
 * The pure logic behind the Transformers & attention lesson. No React, no d3 —
 * just the honest little maths that attention actually is: a **softmax** over
 * affinities, and a **weighted sum** of value vectors.
 *
 * Two things are illustrative (chosen so the idea is *visible*), exactly like
 * the toy coordinates in the Embeddings lesson:
 *   - the per-head *affinities* in the attention lens, and
 *   - the tiny key/value vectors in the query·key toy.
 * Everything computed *from* them — the softmax that turns affinities into
 * weights, the dot products, the weighted blend of values — is the real
 * operation a transformer runs, unchanged.
 */

/** Numerically-stable softmax: turns a row of scores into weights that sum to 1. */
export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Dot product of two equal-length vectors. */
export function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/* =====================================================================
   1 — The attention lens: one sentence, three heads
   ===================================================================== */

/** A directed affinity: query token `i` is drawn to key token `j` by `w`. */
export type Edge = [i: number, j: number, w: number];

export interface Head {
  id: string; //  display name/description come from copy, keyed by this id
  edges: Edge[];
}

export interface Sentence {
  tokens: string[];
  heads: Head[];
}

/** Build the full affinity matrix for a head: every token keeps a little focus
 *  on itself (`self`), sits on a small floor so nothing is ever fully ignored,
 *  and then the authored edges add the head's actual job on top. */
function affinities(n: number, edges: Edge[], self = 1.1, floor = 0.15): number[][] {
  const M = Array.from({ length: n }, () => Array.from({ length: n }, () => floor));
  for (let i = 0; i < n; i++) M[i][i] += self;
  for (const [i, j, w] of edges) M[i][j] += w;
  return M;
}

/** The attention weights of query token `i` over every token, for one head:
 *  `softmax(affinities[i])`. This is the real normalization step. */
export function attend(sentence: Sentence, headId: string, i: number): number[] {
  const head = sentence.heads.find((h) => h.id === headId) ?? sentence.heads[0];
  const M = affinities(sentence.tokens.length, head.edges);
  return softmax(M[i]);
}

/** The lens sentence. A classic ambiguous-pronoun sentence so one head has a
 *  genuinely interesting job (what does “it” refer to?), alongside two head
 *  patterns real models are known to grow: a previous-token head and a head
 *  that links a verb to its subject and object. */
export const LENS: Sentence = {
  tokens: ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "tired"],
  heads: [
    {
      // what refers to what — the pronoun "it" (7) resolves to "animal" (1)
      id: "reference",
      edges: [
        [7, 1, 3.8], //  it → animal   (the referent)
        [7, 5, 1.0], //  it → street   (the tempting distractor)
        [9, 7, 2.2], //  tired → it
        [9, 1, 1.4], //  tired → animal
        [3, 1, 1.2], //  cross → animal
      ],
    },
    {
      // a "previous-token" head: each token looks one step back
      id: "previous",
      edges: [
        [1, 0, 3.4], [2, 1, 3.4], [3, 2, 3.4], [4, 3, 3.4], [5, 4, 3.4],
        [6, 5, 3.4], [7, 6, 3.4], [8, 7, 3.4], [9, 8, 3.4],
      ],
    },
    {
      // a syntax head: verbs reach for their subject and object
      id: "syntax",
      edges: [
        [3, 1, 3.0], //  cross → animal (subject)
        [3, 5, 3.0], //  cross → street (object)
        [2, 3, 2.0], //  didn't → cross
        [8, 7, 2.4], //  was → it
        [8, 9, 2.4], //  was → tired
      ],
    },
  ],
};

/** For a query token + head, the key token it attends to most (and how much). */
export function topTarget(sentence: Sentence, headId: string, i: number): { j: number; w: number } {
  const w = attend(sentence, headId, i);
  let best = 0;
  for (let j = 1; j < w.length; j++) if (w[j] > w[best]) best = j;
  return { j: best, w: w[best] };
}

/* =====================================================================
   2 — The hero flip: one word swings what “it” looks at
   ===================================================================== */

export const HERO = {
  tokens: ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was"],
  queryIdx: 7, //  "it"
  animalIdx: 1,
  streetIdx: 5,
  /** Precomputed so the hero paints instantly, before anything else loads. */
  weights: {
    // "…too tired" → it means the animal
    tired: softmax(affinities(9, [[7, 1, 3.8], [7, 5, 0.8]])[7]),
    // "…too wide" → it means the street
    wide: softmax(affinities(9, [[7, 5, 3.8], [7, 1, 0.8]])[7]),
  },
};

/* =====================================================================
   3 — The query·key·value toy: “bank” finds its meaning in context
   ===================================================================== */

/** A context word the target token can listen to: a fixed key *direction* it is
 *  matched against, and a value = its meaning as a 2D point (same idea as the
 *  Embeddings map — near = similar). */
export interface CtxToken {
  id: "river" | "money";
  key: [number, number]; //   what this token "offers" — matched against the query
  value: [number, number]; // its meaning, as a point on the little map (0..100)
}

export interface QkvResult {
  scores: number[]; //   raw q·k affinity per context token
  weights: number[]; //  softmax(scores) — how much “bank” listens to each
  /** The contextual meaning of “bank”: the weighted blend of the values. */
  blended: [number, number];
}

export const QKV = {
  /** The word whose meaning is decided by context. Its base point sits between
   *  the two neighbourhoods until attention pulls it one way. */
  target: "bank",
  base: [50, 50] as [number, number],
  tokens: [
    { id: "river", key: [-1, 0.35], value: [24, 74] },
    { id: "money", key: [1, -0.35], value: [80, 28] },
  ] as CtxToken[],
  /** How sharp the softmax is — bigger = a more decisive winner. */
  beta: 3,
  presets: [
    { id: "river", t: 0.04 },
    { id: "mixed", t: 0.5 },
    { id: "money", t: 0.96 },
  ] as const,
};

/** The query direction the slider produces at position `t` (0 = river side,
 *  1 = money side). A real query is learned; here you steer it by hand so you
 *  can watch the weights — and the meaning — move. */
export function queryAt(t: number): [number, number] {
  return [2 * t - 1, 0];
}

/** Run the toy for a query position `t`: real dot products → real softmax →
 *  real weighted sum of the value points. */
export function runQkv(t: number): QkvResult {
  const q = queryAt(t);
  const scores = QKV.tokens.map((tok) => dot(q, tok.key));
  const weights = softmax(scores.map((s) => s * QKV.beta));
  const bx = QKV.tokens.reduce((s, tok, i) => s + weights[i] * tok.value[0], 0);
  const by = QKV.tokens.reduce((s, tok, i) => s + weights[i] * tok.value[1], 0);
  return { scores, weights, blended: [bx, by] };
}
