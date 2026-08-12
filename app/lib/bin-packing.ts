/**
 * Stage 0 · 0.6 — Bin-packing for training. Pure data + logic (no React, no d3).
 *
 * One idea: cleaned text is pre-tokenized once, concatenated into a single
 * stream with an end-of-sequence marker between documents, then sliced into
 * fixed-length blocks so a GPU batch wastes zero compute on padding.
 *
 * The numbers here are toy stand-ins (real blocks are 2,048–8,192 tokens); the
 * ratios — not the absolute sizes — are the point.
 */

export type DocKind = "word" | "num" | "sub" | "punct" | "byte";

export interface SampleDoc {
  id: number;
  len: number; // token count
  kind: DocKind;
}

/** A handful of pre-tokenized documents of different lengths. */
export const SAMPLE_DOCS: SampleDoc[] = [
  { id: 1, len: 8, kind: "word" },
  { id: 2, len: 4, kind: "num" },
  { id: 3, len: 10, kind: "sub" },
  { id: 4, len: 6, kind: "punct" },
  { id: 5, len: 5, kind: "byte" },
];

export const MAX_DOC_LEN = Math.max(...SAMPLE_DOCS.map((d) => d.len)); // 10

/** Block-length slider bounds (toy units standing in for 2k–8k tokens). L must
 *  be ≥ the longest document, otherwise the "pad each document" panel can't fit
 *  the longest doc in one row. */
export const L_MIN = MAX_DOC_LEN; // 10
export const L_MAX = 18;

/** One token in the concatenated stream. */
export interface StreamTok {
  kind: DocKind | "eos";
  docId: number; // 0 for the <eos> marker
}

/** Concatenate documents head-to-tail, planting one <eos> after each. */
export function buildStream(docs: SampleDoc[]): StreamTok[] {
  const out: StreamTok[] = [];
  docs.forEach((d) => {
    for (let i = 0; i < d.len; i++) out.push({ kind: d.kind, docId: d.id });
    out.push({ kind: "eos", docId: 0 });
  });
  return out;
}

/** Deterministic (seeded) shuffle so "shuffle" is reproducible per click. */
export function shuffled(docs: SampleDoc[], seed: number): SampleDoc[] {
  const a = docs.slice();
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Slice the stream into full blocks of L; the leftover tail carries to the
 *  next shard (real pipelines never pad it — they just keep going). */
export function packBlocks(
  stream: StreamTok[],
  L: number,
): { blocks: StreamTok[][]; carried: number } {
  const blocks: StreamTok[][] = [];
  const full = Math.floor(stream.length / L);
  for (let b = 0; b < full; b++) blocks.push(stream.slice(b * L, b * L + L));
  return { blocks, carried: stream.length - full * L };
}

/** The naive alternative: pad every document out to L with filler tokens. */
export function padStats(
  docs: SampleDoc[],
  L: number,
): {
  rows: { real: number; pad: number; kind: DocKind }[];
  realTokens: number;
  padTokens: number;
  wastePct: number;
} {
  const rows = docs.map((d) => ({
    real: Math.min(d.len, L),
    pad: Math.max(0, L - d.len),
    kind: d.kind,
  }));
  const realTokens = rows.reduce((s, r) => s + r.real, 0);
  const padTokens = rows.reduce((s, r) => s + r.pad, 0);
  const total = realTokens + padTokens;
  return { rows, realTokens, padTokens, wastePct: total ? (padTokens / total) * 100 : 0 };
}

/** Node 1 — per-step timing (toy ms). CPU tokenizes a batch; the GPU trains on
 *  it. If they don't overlap, the GPU waits `cpuMs` every step. As GPUs get
 *  faster the compute (`gpuMs`) shrinks, so that fixed wait is a bigger share. */
export function stepTimings(gpuSpeed: number): {
  cpuMs: number;
  gpuMs: number;
  onFlyIdlePct: number;
} {
  const cpuMs = 6; // CPU to tokenize one batch (fixed)
  const gpuMs = 30 / gpuSpeed; // GPU compute per step — shrinks as GPUs speed up
  const onFlyIdlePct = (cpuMs / (cpuMs + gpuMs)) * 100;
  return { cpuMs, gpuMs, onFlyIdlePct };
}
