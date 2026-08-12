/**
 * Stage 0 · Phase 3 — Reasoning tokens. Pure, language-neutral logic + data for
 * the lesson (no React, no d3). Only symbolic / code-literal strings live here —
 * the delimiter tags, illustrative token ids, and the algebra of the worked
 * example. Every natural-language string is in app/lib/copy/reasoning-tokens.ts.
 */

/** The two delimiter tokens that bracket the hidden scratchpad, plus the end
 *  token. Their ids are illustrative — they sit near the top of a ~200k
 *  vocabulary, the usual home for special tokens. */
export const THINK_OPEN = "<think>";
export const THINK_CLOSE = "</think>";
export const EOS = "<eos>";
export const THINK_OPEN_ID = 200_001;
export const THINK_CLOSE_ID = 200_002;
export const EOS_ID = 200_000;

/** The worked example: the classic bat-and-ball problem, whose fast intuitive
 *  answer ($0.10) is wrong and whose scratchpad answer ($0.05) is right. The
 *  derivation lines are algebra — language-neutral, so they live here. */
export const REASONING_STEPS: string[] = [
  "ball = x",
  "bat = x + 1.00",
  "x + (x + 1.00) = 1.10",
  "2x = 0.10",
  "x = 0.05",
];

export const BLURT_ANSWER = "$0.10";
export const THINK_ANSWER = "$0.05";

/** Steps of reasoning needed before the derivation actually reaches x = 0.05.
 *  Below this the model can't finish the algebra; illustrative threshold. */
export const CORRECT_AT = 4;
export const MAX_STEPS = REASONING_STEPS.length; // 5

/** Illustrative token accounting for the compute meter. A blurted answer is one
 *  forward pass over the prompt; each reasoning step adds a few scratchpad
 *  tokens, and every token is one more forward pass. */
export const PROMPT_TOKENS = 22;
export const TOKENS_PER_STEP = 4;
export const ANSWER_TOKENS = 3;

/** Forward passes (≈ tokens generated) for a given reasoning budget. */
export function forwardPasses(steps: number): number {
  const s = Math.max(0, Math.min(MAX_STEPS, steps));
  return PROMPT_TOKENS + s * TOKENS_PER_STEP + ANSWER_TOKENS;
}

/** Does this budget of steps finish the derivation? */
export function reachesAnswer(steps: number): boolean {
  return steps >= CORRECT_AT;
}

/** The answer a given budget produces. */
export function answerFor(steps: number): string {
  return reachesAnswer(steps) ? THINK_ANSWER : BLURT_ANSWER;
}

/** One token in the generated stream for Node 3's step-through. */
export interface StreamToken {
  piece: string;
  id: number;
  /** A special vocabulary entry (delimiter / end token) — drawn ringed. */
  special?: boolean;
  eos?: boolean;
}

/** The short generated stream Node 3 reveals one token at a time: open
 *  delimiter, a couple of scratchpad tokens, close delimiter, answer, end. */
export const STREAM: StreamToken[] = [
  { piece: THINK_OPEN, id: THINK_OPEN_ID, special: true },
  { piece: "2x", id: 17 },
  { piece: "=", id: 28 },
  { piece: "0.10", id: 1_546 },
  { piece: THINK_CLOSE, id: THINK_CLOSE_ID, special: true },
  { piece: THINK_ANSWER, id: 4_502 },
  { piece: EOS, id: EOS_ID, special: true, eos: true },
];
