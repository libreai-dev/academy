/**
 * Stage 0 · 4.3 — Supervised fine-tuning (SFT). Pure, framework-free helpers
 * for the lesson's diagrams: how a prompt→response example is split into cells,
 * and an illustrative per-token loss for the loss-mask visual.
 *
 * The example *text* is prose (and bilingual), so it lives in the copy module
 * (`app/lib/copy/supervised-fine-tuning.ts`). Only the code-literal role markers
 * and the tokenisation/loss maths live here.
 */

/** Special "role" tokens that wrap each turn in a chat-formatted example. */
export const USER_TAG = "<|user|>";
export const ASST_TAG = "<|assistant|>";

/** Which part of the sequence a cell belongs to. */
export type CellRegion = "marker" | "prompt" | "response";

export interface Cell {
  piece: string;
  region: CellRegion;
}

/**
 * Split a line into word-ish tokens (whitespace split). This is illustrative —
 * a real tokenizer uses sub-word pieces — but "roughly one word per token" is
 * close enough to teach the loss mask without a heavy engine.
 */
export function tokenizeText(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Build the flat cell list for one training example:
 *   <|user|> · prompt tokens · <|assistant|> · response tokens
 * The two markers and the prompt are context; only the response is the target.
 */
export function buildCells(prompt: string, response: string): Cell[] {
  const cells: Cell[] = [{ piece: USER_TAG, region: "marker" }];
  for (const p of tokenizeText(prompt)) cells.push({ piece: p, region: "prompt" });
  cells.push({ piece: ASST_TAG, region: "marker" });
  for (const r of tokenizeText(response)) cells.push({ piece: r, region: "response" });
  return cells;
}

/** True when this cell's prediction feeds the loss, given the mask state. */
export function isGraded(region: CellRegion, masked: boolean): boolean {
  return masked ? region === "response" : true;
}

/**
 * A deterministic, illustrative per-token loss in [0.3, 1]. Not a real training
 * signal — just stable, varied bar heights so the mask visual reads as "these
 * tokens are being scored", without pretending to be numerically meaningful.
 */
export function tokenLoss(piece: string, i: number): number {
  let h = 2166136261 >>> 0;
  for (let c = 0; c < piece.length; c++) {
    h = Math.imul(h ^ piece.charCodeAt(c), 16777619) >>> 0;
  }
  h = Math.imul(h ^ (i + 1), 16777619) >>> 0;
  return 0.3 + (h % 1000) / 1000 * 0.7;
}

/** How many cells feed the loss vs. the total, for the diagram footer. */
export function gradedCount(cells: Cell[], masked: boolean): { graded: number; total: number } {
  const graded = cells.filter((c) => isGraded(c.region, masked)).length;
  return { graded, total: cells.length };
}
