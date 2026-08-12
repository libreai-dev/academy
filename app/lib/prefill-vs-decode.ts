/**
 * Pure model of two-phase LLM serving: a fast, parallel **prefill** that reads
 * the whole prompt at once, then a token-by-token **decode** that writes the
 * answer one step at a time. No React, no d3 — just the numbers the diagrams and
 * readouts draw from. Figures are illustrative but realistic for a mid-size
 * model on one GPU.
 */

/** ms added per prompt token during prefill — cheap, because the pass is parallel. */
export const PREFILL_MS_PER_TOKEN = 0.15;
/** Fixed prefill overhead (ms): kernel launch + first-pass setup. */
export const PREFILL_BASE_MS = 40;
/** Decode speed: one output token every this many ms (~50 tokens/second). */
export const DECODE_MS_PER_TOKEN = 20;

export interface Timeline {
  promptTokens: number;
  answerTokens: number;
  /** One fast parallel pass over the whole prompt. */
  prefillMs: number;
  /** answerTokens sequential steps, one token each. */
  decodeMs: number;
  /** Time to the first visible token = prefill + one decode step. */
  ttftMs: number;
  totalMs: number;
  /** Share of the total wall-clock spent in decode (0..100). */
  decodePct: number;
  tokPerSec: number;
}

export function timeline(promptTokens: number, answerTokens: number): Timeline {
  const prefillMs = PREFILL_BASE_MS + promptTokens * PREFILL_MS_PER_TOKEN;
  const decodeMs = answerTokens * DECODE_MS_PER_TOKEN;
  const totalMs = prefillMs + decodeMs;
  const ttftMs = prefillMs + DECODE_MS_PER_TOKEN;
  const decodePct = totalMs > 0 ? (decodeMs / totalMs) * 100 : 0;
  const tokPerSec = 1000 / DECODE_MS_PER_TOKEN;
  return { promptTokens, answerTokens, prefillMs, decodeMs, ttftMs, totalMs, decodePct, tokPerSec };
}

/** Compact human time: "120 ms" under a second, "4.10 s" / "20.3 s" above. */
export function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`;
}
