/**
 * A tiny, hand-crafted embedding space for the Embeddings lesson — 36 words laid
 * out on a 2D map so that *nearby = similar meaning* and gendered pairs share one
 * consistent offset, which makes vector arithmetic work as a parallelogram:
 * `king − man + woman ≈ queen`. These are illustrative teaching coordinates, not
 * real GloVe/word2vec vectors — the point is the *idea*, computed with honest
 * math (distance + vector add) on a toy space small enough to see all at once.
 */

export type EmbGroup = "people" | "animal" | "food" | "tech";
export type EmbWord = { w: string; x: number; y: number; g: EmbGroup };

export const EMB: EmbWord[] = [
  { w: "man", x: 12, y: 34, g: "people" },
  { w: "woman", x: 23, y: 45, g: "people" },
  { w: "boy", x: 18, y: 40, g: "people" },
  { w: "girl", x: 29, y: 51, g: "people" },
  { w: "actor", x: 16, y: 52, g: "people" },
  { w: "actress", x: 27, y: 63, g: "people" },
  { w: "uncle", x: 30, y: 44, g: "people" },
  { w: "aunt", x: 41, y: 55, g: "people" },
  { w: "king", x: 26, y: 74, g: "people" },
  { w: "queen", x: 37, y: 85, g: "people" },
  { w: "prince", x: 34, y: 66, g: "people" },
  { w: "princess", x: 45, y: 77, g: "people" },
  { w: "teacher", x: 42, y: 60, g: "people" },
  { w: "doctor", x: 48, y: 66, g: "people" },
  { w: "artist", x: 38, y: 52, g: "people" },
  { w: "writer", x: 50, y: 58, g: "people" },
  { w: "dog", x: 70, y: 40, g: "animal" },
  { w: "cat", x: 78, y: 44, g: "animal" },
  { w: "lion", x: 86, y: 48, g: "animal" },
  { w: "tiger", x: 90, y: 40, g: "animal" },
  { w: "horse", x: 64, y: 30, g: "animal" },
  { w: "wolf", x: 74, y: 30, g: "animal" },
  { w: "mouse", x: 84, y: 26, g: "animal" },
  { w: "bird", x: 90, y: 34, g: "animal" },
  { w: "pizza", x: 14, y: 16, g: "food" },
  { w: "bread", x: 24, y: 10, g: "food" },
  { w: "apple", x: 32, y: 20, g: "food" },
  { w: "banana", x: 38, y: 12, g: "food" },
  { w: "coffee", x: 10, y: 26, g: "food" },
  { w: "cake", x: 20, y: 26, g: "food" },
  { w: "laptop", x: 70, y: 76, g: "tech" },
  { w: "phone", x: 78, y: 80, g: "tech" },
  { w: "keyboard", x: 86, y: 72, g: "tech" },
  { w: "server", x: 90, y: 84, g: "tech" },
  { w: "robot", x: 64, y: 68, g: "tech" },
  { w: "code", x: 76, y: 88, g: "tech" },
];

export const EMB_GROUPS: EmbGroup[] = ["people", "animal", "food", "tech"];

const BY_WORD = new Map(EMB.map((e) => [e.w, e]));
export const embOf = (w: string): EmbWord | undefined => BY_WORD.get(w);

const dist2 = (ax: number, ay: number, bx: number, by: number) => (ax - bx) ** 2 + (ay - by) ** 2;

/** The `k` map words nearest to a point, closest first, skipping `exclude`. */
export function nearest(x: number, y: number, exclude: string[], k: number): { word: EmbWord; d: number }[] {
  const skip = new Set(exclude);
  return EMB.filter((e) => !skip.has(e.w))
    .map((e) => ({ word: e, d: Math.sqrt(dist2(x, y, e.x, e.y)) }))
    .sort((p, q) => p.d - q.d)
    .slice(0, k);
}

export interface AnalogyResult {
  x: number; //         result point = a − b + c
  y: number;
  ranked: { word: EmbWord; d: number }[]; //  candidates by distance to the point
}

/** Vector arithmetic on the map: a − b + c, then rank words by nearness. */
export function analogy(a: string, b: string, c: string): AnalogyResult | null {
  const A = embOf(a), B = embOf(b), C = embOf(c);
  if (!A || !B || !C) return null;
  const x = A.x - B.x + C.x;
  const y = A.y - B.y + C.y;
  return { x, y, ranked: nearest(x, y, [a, b, c], 3) };
}

/** The analogy presets offered as one-tap chips (a − b + c). */
export const ANALOGIES: { a: string; b: string; c: string }[] = [
  { a: "king", b: "man", c: "woman" },
  { a: "prince", b: "man", c: "woman" },
  { a: "actor", b: "man", c: "woman" },
  { a: "queen", b: "woman", c: "man" },
];
