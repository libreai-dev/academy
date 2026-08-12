/**
 * Stage 0 · Serving — The KV cache. Pure logic + data for the lesson's three
 * nodes (no React, no d3). All user-facing text lives in copy/kv-cache.ts; this
 * module only computes numbers the diagrams draw.
 *
 * One idea: during decode the model files away each past token's key and value
 * (K/V) once, so writing the next token is cheap. Without that cache every step
 * would redo all the history — quadratic work. With it, the limit shifts from
 * compute to the memory the cache eats.
 */

/* ---- Nodes 1 & 2 · per-step work ---------------------------------------- */

/**
 * Work to write each new token, as a bar per decode step (1-indexed).
 * Without a cache the model recomputes K/V for every token so far, so step i
 * costs `i`. With the cache it only computes the one new token, so every step
 * costs 1.
 */
export function perStepWork(n: number, cached: boolean): number[] {
  return Array.from({ length: n }, (_, i) => (cached ? 1 : i + 1));
}

/** Total work over a whole answer: N(N+1)/2 without a cache, N with it. */
export function totalWork(n: number, cached: boolean): number {
  return cached ? n : (n * (n + 1)) / 2;
}

/** Passes that were pure waste — recomputing tokens that never changed. */
export function wastedWork(n: number): number {
  return (n * (n - 1)) / 2;
}

/** How many times faster the cached path is over a whole answer. */
export function speedup(n: number): number {
  if (n <= 0) return 1;
  return totalWork(n, false) / totalWork(n, true); // = (n+1)/2
}

/* ---- Node 3 · the memory the cache eats --------------------------------- */

/**
 * Illustrative GPU-memory budget. Figures are realistic-but-rounded: a single
 * 80 GB accelerator, a mid-size model's weights, and a per-token cache cost in
 * the right ballpark for a modern model (grouped-query attention).
 */
export const VRAM_GB = 80;
export const WEIGHTS_GB = 40;
export const MB_PER_TOKEN = 0.5; // KV bytes per token, illustrative

/** GB the KV cache occupies for a given context length (tokens). */
export function cacheGB(ctxTokens: number): number {
  return (ctxTokens * MB_PER_TOKEN) / 1024;
}

/** GB of VRAM left for the cache after the weights are loaded. */
export const FREE_FOR_CACHE_GB = VRAM_GB - WEIGHTS_GB;

export interface MemoryState {
  ctxTokens: number;
  cache: number; //     GB the cache wants
  used: number; //      GB used in total (weights + cache)
  free: number; //      GB still free (0 if overflowing)
  overflow: number; //  GB over the ceiling (0 if it fits)
  fits: boolean;
  pctOfVram: number; // cache as a share of total VRAM (0..1+)
}

export function memoryState(ctxTokens: number): MemoryState {
  const cache = cacheGB(ctxTokens);
  const used = WEIGHTS_GB + cache;
  const overflow = Math.max(0, used - VRAM_GB);
  const free = Math.max(0, VRAM_GB - used);
  return {
    ctxTokens,
    cache,
    used,
    free,
    overflow,
    fits: used <= VRAM_GB,
    pctOfVram: cache / VRAM_GB,
  };
}

/** The largest context that still fits in one GPU, in tokens. */
export function maxContextTokens(): number {
  return Math.floor((FREE_FOR_CACHE_GB * 1024) / MB_PER_TOKEN);
}

/** Compact token count: 1500 → "1.5k", 128000 → "128k". */
export function fmtTokens(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return String(n);
}
