/**
 * Stage 0 · Phase 3 — Tool calling. Pure, React-free logic for the lesson's
 * interactives (no d3, no JSX). All user-facing strings live in
 * `app/lib/copy/tool-calling.ts`; this module only holds structural helpers.
 */

/** The roles that appear in the conversation thread (Node 3). */
export type Role = "user" | "assistant-call" | "tool" | "assistant-answer";

/** How many phases the Node-3 transcript steps through. */
export const PHASE_COUNT = 4;

/**
 * The roles visible at a given phase (0..PHASE_COUNT-1). Phase 0 shows just the
 * user turn; each later phase appends exactly one more turn, so the thread grows
 * one card at a time — the whole point of the node.
 */
export function turnsAtPhase(phase: number): Role[] {
  const order: Role[] = ["user", "assistant-call", "tool", "assistant-answer"];
  const n = Math.max(1, Math.min(PHASE_COUNT, phase + 1));
  return order.slice(0, n);
}

/** Does the model choose to call a tool for this request, or answer directly? */
export function isToolCall(tool: string): boolean {
  return tool.trim().length > 0;
}
