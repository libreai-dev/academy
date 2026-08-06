/**
 * Ordered routes for the Stage 1 lessons, aligned index-for-index with
 * `stage1List` in copy.ts. `null` marks a lesson that isn't built yet, so the
 * rail renders it as plain text rather than a dead link. Single source of truth
 * for cross-lesson navigation (rail + prev/next), so adding a lesson only
 * touches this list.
 */
export const STAGE1_ROUTES: (string | null)[] = [
  "/stage/1/life-of-an-llm", // 0 · The life of an LLM
  "/stage/1/tokens", //         1 · Tokens
  "/stage/1/data", //           2 · Data
  "/stage/1/bias", //           3 · Bias
  null, //                      4 · Neural networks
  null, //                      5 · How training works
  null, //                      6 · Embeddings
  null, //                      7 · Transformers
  null, //                      8 · Pretraining → alignment
];
