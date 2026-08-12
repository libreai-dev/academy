/**
 * Pure logic + data for the "Base vs assistant" lesson (Stage 0 · 4.3).
 * No React, no d3 — only the numeric shape of node 3's bar chart lives here so
 * the component stays thin. Every user-facing string lives in the copy module.
 *
 * The 0–100 values are illustrative, not measured: the point is the *shape* of
 * the change — knowledge stays flat, helpful behaviour jumps — not a benchmark.
 */

export type Mode = "base" | "assistant";

/** One capability, scored for the base model and the fine-tuned assistant. */
export interface Capability {
  /** Stable key; the human label comes from copy (n3knowledge / n3behaviour). */
  key: "knowledge" | "behaviour";
  base: number; //      0–100
  assistant: number; // 0–100
}

/**
 * Node 3 — what fine-tuning moves. Knowledge is essentially identical (it was
 * learned in pretraining); helpful behaviour is what instruction tuning adds.
 */
export const CAPABILITIES: Capability[] = [
  { key: "knowledge", base: 90, assistant: 90 },
  { key: "behaviour", base: 14, assistant: 92 },
];

/** The value for a capability in a given mode. */
export function capValue(c: Capability, mode: Mode): number {
  return mode === "base" ? c.base : c.assistant;
}
