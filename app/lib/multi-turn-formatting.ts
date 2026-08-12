/**
 * Stage 0 · 1.2 — Multi-turn & formatting. Pure logic/data for the article
 * (no React, no d3). The one idea: longer chats, tool results, and reasoning
 * all fold back into the same stack of role blocks the model was trained on.
 *
 * Only code-literal, protocol-level strings live here (the ChatML delimiters
 * and the role names). Everything user-facing is in app/lib/copy/multi-turn-
 * formatting.ts.
 */

/** The four transcript roles, plus the pre-filled reasoning scratchpad. */
export type Role = "system" | "user" | "assistant" | "tool" | "think";

/** ChatML delimiters — the special tokens from the previous lesson. */
export const IM_START = "<|im_start|>";
export const IM_END = "<|im_end|>";

/** Colour token per role — all defined in globals.css, AA-safe in both themes. */
export const ROLE_FILL: Record<Role, string> = {
  system: "var(--tok-punct)",
  user: "var(--tok-num)",
  assistant: "var(--signal)",
  tool: "var(--tok-sub)",
  think: "var(--tok-space)",
};

/** One rendered role block in the transcript diagram. */
export interface Block {
  role: Role;
  /** Block body text (from copy). Empty when the block is being generated. */
  text: string;
  /** A pre-filled reasoning scratchpad, shown greyed above the answer. */
  think?: string;
  /** A small muted tag under the body (e.g. "← model writes this next"). */
  tag?: string;
  /** Render as the open, actively-generated block (signal wash + caret). */
  active?: boolean;
}

/** Rough token estimate — ~4 characters per token, the usual rule of thumb. */
export function estTokens(text: string): number {
  return Math.max(0, Math.round(text.length / 4));
}

/** Greedy word-wrap to a max character count per line (pure; used by the d3 draw). */
export function wrapLine(text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + " " + w).length <= max) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}
