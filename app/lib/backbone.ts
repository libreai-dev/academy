/**
 * The LLM-Fundamentals **backbone** — pure structural data (no React, no copy).
 *
 * Two axes:
 *  - Pipeline (the 9 stations below, in build/run order) — the scrollable spine.
 *  - Depth (3 cumulative levels) — the "how deep?" selector. `fundamentals`
 *    shows only must-know lessons; `medium` adds mechanism; `expert` adds the
 *    deep-dives. Cumulative: a chosen depth shows its level **and everything
 *    shallower** (see `visibleAtDepth`).
 *
 * All user-facing strings (station + article titles, level names, blurbs) live
 * in `app/lib/copy/backbone.ts`, keyed by the `key` fields here. This module is
 * the single source of structure; the copy module is the single source of text.
 *
 * The full grid + the cumulative-coherence audit is documented in
 * `../../../docs/academy/llm-fundamentals-2d-backbone.md`.
 */

export type Level = "fundamentals" | "medium" | "expert";

/** Depth order, shallow → deep. Index doubles as the numeric rank. */
export const LEVELS: readonly Level[] = ["fundamentals", "medium", "expert"] as const;

export function levelRank(l: Level): number {
  return LEVELS.indexOf(l);
}

export interface BackboneArticle {
  /** Stable unique id — the copy key in `copy/backbone.ts` `articles`. */
  key: string;
  level: Level;
  /** Route, only when the lesson is built. Absent ⇒ "coming soon". */
  href?: string;
  /** Trace back to the source outline (e.g. "0.4", "2·A"). */
  ref: string;
  /** d3 glyph motif for this topic — a name `drawGlyph` understands. */
  motif: string;
}

/** Each station's identity glyph (a `drawGlyph` name). */
export const STAGE_GLYPH: Record<string, string> = {
  crawl: "crawl",
  filter: "filter",
  embed: "embed",
  transformer: "transformer",
  generate: "generate",
  pretrain: "pretrain",
  finetune: "finetune",
  align: "align",
  serve: "serve",
};

export interface BackboneStation {
  /** Stable unique id — the copy key + the anchor target (`#st-<key>`). */
  key: string;
  articles: BackboneArticle[];
}

export const BACKBONE: readonly BackboneStation[] = [
  {
    key: "crawl",
    articles: [
      { key: "crawl", level: "fundamentals", ref: "0.1", href: "/stage/0/web-scale-ingestion", motif: "graph" },
      { key: "domain", level: "medium", ref: "0.1", href: "/stage/0/domain-sources", motif: "docs" },
      { key: "pii", level: "expert", ref: "0.1", href: "/stage/0/pii-scrubbing", motif: "shield" },
    ],
  },
  {
    key: "filter",
    articles: [
      { key: "quality", level: "fundamentals", ref: "0.3", href: "/stage/0/quality-filtering", motif: "funnel" },
      { key: "extract", level: "medium", ref: "0.2", href: "/stage/0/extraction-parsing", motif: "docs" },
      { key: "classifier", level: "medium", ref: "0.3", href: "/stage/0/classifier-scoring", motif: "gauge" },
      { key: "safety", level: "medium", ref: "0.3", href: "/stage/0/safety-filtering", motif: "shield" },
      { key: "dedup", level: "medium", ref: "0.4", href: "/stage/0/deduplication", motif: "overlap" },
      { key: "recipe", level: "medium", ref: "0.5", href: "/stage/0/data-recipe", motif: "bars" },
      { key: "binpack", level: "expert", ref: "0.6", href: "/stage/0/bin-packing", motif: "pack" },
    ],
  },
  {
    key: "embed",
    articles: [
      { key: "tokendict", level: "fundamentals", ref: "1.3", href: "/stage/0/token-dictionary", motif: "tokens" },
      { key: "embedmatrix", level: "fundamentals", ref: "1.3", href: "/stage/0/embedding-matrix", motif: "points" },
      { key: "posenc", level: "medium", ref: "1.3", href: "/stage/0/positional-encoding", motif: "order" },
      { key: "specialtok", level: "medium", ref: "1.1", href: "/stage/0/special-tokens", motif: "tag" },
      { key: "scratchpad", level: "medium", ref: "1.2", href: "/stage/0/multi-turn-formatting", motif: "bubbles" },
      { key: "rope", level: "expert", ref: "1.3", href: "/stage/0/rope-math", motif: "rotate" },
      { key: "longctx", level: "expert", ref: "1.3", href: "/stage/0/long-context", motif: "expand" },
    ],
  },
  {
    key: "transformer",
    articles: [
      { key: "block", level: "fundamentals", ref: "2", href: "/stage/0/transformer-block", motif: "layers" },
      { key: "attention", level: "medium", ref: "2·A", href: "/stage/0/attention-mechanism", motif: "bipartite" },
      { key: "mlp", level: "medium", ref: "2·B", href: "/stage/0/feed-forward", motif: "wide" },
      { key: "flash", level: "expert", ref: "2·A", href: "/stage/0/flash-attention", motif: "bipartite" },
      { key: "moe", level: "expert", ref: "2·B", href: "/stage/0/mixture-of-experts", motif: "router" },
    ],
  },
  {
    key: "generate",
    articles: [
      { key: "hidden", level: "fundamentals", ref: "3", href: "/stage/0/choosing-the-next-token", motif: "bars" },
      { key: "arloop", level: "fundamentals", ref: "3", href: "/stage/0/autoregressive-loop", motif: "loop" },
      { key: "sampling", level: "medium", ref: "3", href: "/stage/0/sampling-strategies", motif: "bars" },
      { key: "constrained", level: "expert", ref: "3", href: "/stage/0/constrained-decoding", motif: "braces" },
      { key: "reasoning", level: "expert", ref: "3", href: "/stage/0/reasoning-tokens", motif: "bubbles" },
      { key: "tools", level: "expert", ref: "3", href: "/stage/0/tool-calling", motif: "tool" },
      { key: "search", level: "expert", ref: "3", href: "/stage/0/test-time-search", motif: "tree" },
    ],
  },
  {
    key: "pretrain",
    articles: [
      { key: "learn", level: "fundamentals", ref: "2.5", href: "/stage/0/how-models-learn", motif: "curve" },
      { key: "backprop", level: "medium", ref: "2.5·1", href: "/stage/0/backpropagation", motif: "curve" },
      { key: "optim", level: "medium", ref: "2.5·4", href: "/stage/0/optimizers", motif: "steps" },
      { key: "precision", level: "expert", ref: "2.5·2", href: "/stage/0/mixed-precision", motif: "bits" },
      { key: "distributed", level: "expert", ref: "Phase 2 infra", href: "/stage/0/distributed-training", motif: "pack" },
      { key: "matrixopt", level: "expert", ref: "2.5·4", href: "/stage/0/matrix-optimizers", motif: "matrix" },
    ],
  },
  {
    key: "finetune",
    articles: [
      { key: "basevs", level: "fundamentals", ref: "4.3", href: "/stage/0/base-vs-assistant", motif: "adapter" },
      { key: "sft", level: "medium", ref: "4.3", href: "/stage/0/supervised-fine-tuning", motif: "docs" },
      { key: "syndata", level: "medium", ref: "4.1", href: "/stage/0/synthetic-data", motif: "docs" },
      { key: "peft", level: "expert", ref: "4.3", href: "/stage/0/parameter-efficient-finetuning", motif: "adapter" },
      { key: "distill", level: "expert", ref: "4.2", href: "/stage/0/distillation", motif: "distill" },
    ],
  },
  {
    key: "align",
    articles: [
      { key: "whyalign", level: "fundamentals", ref: "4.4", href: "/stage/0/why-alignment", motif: "reward" },
      { key: "reward", level: "medium", ref: "4.4", href: "/stage/0/reward-modeling", motif: "gauge" },
      { key: "dpo", level: "medium", ref: "4.4", href: "/stage/0/preference-optimization", motif: "scale" },
      { key: "ppo", level: "expert", ref: "4.4", href: "/stage/0/ppo", motif: "scale" },
      { key: "grpo", level: "expert", ref: "4.4", href: "/stage/0/grpo", motif: "group" },
      { key: "verifiable", level: "expert", ref: "4.4", href: "/stage/0/verifiable-rewards", motif: "verify" },
    ],
  },
  {
    key: "serve",
    articles: [
      { key: "prefill", level: "fundamentals", ref: "3", href: "/stage/0/prefill-vs-decode", motif: "cache" },
      { key: "kvcache", level: "medium", ref: "3", href: "/stage/0/kv-cache", motif: "cache" },
      { key: "kvsystems", level: "expert", ref: "3", href: "/stage/0/kv-cache-systems", motif: "cache" },
      { key: "quant", level: "expert", ref: "3", href: "/stage/0/quantization", motif: "bits" },
      { key: "specdecode", level: "expert", ref: "3", href: "/stage/0/speculative-decoding", motif: "adapter" },
    ],
  },
] as const;

/** Articles in a station visible at the chosen depth (this level + shallower). */
export function visibleAtDepth(station: BackboneStation, depth: Level): BackboneArticle[] {
  const max = levelRank(depth);
  return station.articles.filter((a) => levelRank(a.level) <= max);
}

/** Total lessons across the whole pipeline at the chosen depth. */
export function pathCount(depth: Level): number {
  const max = levelRank(depth);
  return BACKBONE.reduce(
    (n, st) => n + st.articles.filter((a) => levelRank(a.level) <= max).length,
    0,
  );
}
