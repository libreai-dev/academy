/**
 * The running example for the Neural networks lesson: resolving **"hot dog"**.
 * The model reads *"I'm hungry, I want a hot dog"* and must decide the intent —
 * **Eat** or **Pet**. Two pieces share this file.
 *
 * 1) THE SINGLE NEURON — "Hot + Dog" Fusion Detector (Neuron 3). A dot product of
 *    its weights with the sentence's word vector fires when *hot* and *dog* both
 *    appear. On its own it only knows the phrase was said — not what it means.
 *
 * 2) THE 7-NEURON NETWORK (3 → 2 → 2). Three input neurons (Hunger, Pet-words,
 *    and the Hot+Dog detector) feed two hidden context gates (Eat, Pet), which
 *    feed two output neurons (EAT, PET). The network re-routes meaning: the same
 *    +3.5 "hot dog" signal reads as food when hunger is high, but as a real dog
 *    when the context is about a pet.
 *
 * Numbers are fixed/hand-tuned so the demo is deterministic. Labels live in
 * copy.ts (bilingual); indices line up with the arrays here.
 */

const sig = (z: number) => 1 / (1 + Math.exp(-z));

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ── 1. The "Hot + Dog" Fusion Detector (the dot-product neuron) ───────────── */

// Word-presence features in the sentence: [hot, dog, cold, cute].
export const FUSE_W = [1.75, 1.75, -1.0, -1.0];
// A bias set so the squash σ(w·x + b) only clears 0.5 when BOTH words are present.
export const FUSE_B = -2.5;
// Example sentences as word-presence vectors (0 or 1).
export const FUSE_SENTENCES: number[][] = [
  [1, 1, 0, 0], //  "I'm hungry, I want a hot dog"  → +3.5  (both words → fires)
  [1, 0, 0, 0], //  "ugh, the soup is too hot"      → +1.75 (hot only)
  [0, 1, 0, 1], //  "aww, look at that cute dog"     → +0.75 (dog, but cute → weak)
];

/** Neuron 3's dot product on sentence `i`. `z` is the raw fusion signature. */
export function scoreFusion(i: number): { vec: number[]; z: number } {
  const vec = FUSE_SENTENCES[i];
  const z = FUSE_W.reduce((acc, w, k) => acc + w * vec[k], 0) + FUSE_B;
  return { vec, z };
}

/** The phrase reads as present once both words clear this bar. */
export const FUSE_THRESHOLD = 2.5;

/* ── 2. The 7-neuron intent network (3 inputs → 2 hidden → 2 outputs) ──────── */

// Network inputs = the three input-layer neurons:
// [hunger (N1), pet-words (N2), hot+dog signal (N3)].
export const NET_W1: number[][] = [
  [0.8, 0.0, 1.0], //   N4 Eat gate  — hunger + the hot-dog phrase
  [-1.2, 2.0, 0.3], //  N5 Pet gate  — pet words, but hunger crushes it
];
export const NET_B1 = [-3.0, -0.5];
export const NET_W2: number[][] = [
  [3.0, -1.0], //  N6 EAT — driven by the Eat gate
  [-1.0, 3.0], //  N7 PET — driven by the Pet gate
];
export const NET_B2 = [-1.0, -1.0];

// Sentences as [hunger, pet-words, hot+dog signal].
export const NET_SENTENCES: number[][] = [
  [2.0, 0.1, 3.5], //  "I'm hungry, I want a hot dog"      → EAT
  [0.2, 3.0, 0.75], // "aww, let me pet that cute dog"      → PET
  [0.1, 2.0, 3.5], //  "the dog is panting in the hot sun"  → PET (hot+dog fires, context overrules)
];

/** Full forward pass for sentence `i`: inputs → 2 gates → softmax over [EAT, PET]. */
export function forwardHotdog(i: number): { inputs: number[]; hidden: number[]; probs: number[] } {
  const inputs = NET_SENTENCES[i];
  const hidden = NET_W1.map((row, h) => sig(row.reduce((acc, w, k) => acc + w * inputs[k], 0) + NET_B1[h]));
  const logits = NET_W2.map((row, o) => row.reduce((acc, w, h) => acc + w * hidden[h], 0) + NET_B2[o]);
  return { inputs, hidden, probs: softmax(logits) };
}

/** Parameters in the network: 2×3 + 2 (gates) plus 2×2 + 2 (outputs). */
export const NET_PARAMS = NET_W1.length * NET_W1[0].length + NET_B1.length + NET_W2.length * NET_W2[0].length + NET_B2.length; // 14
