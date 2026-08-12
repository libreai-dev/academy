/**
 * Stage 0 · Test-time search — pure logic + data (no React, no d3).
 *
 * One idea: you can spend more compute at INFERENCE to get better answers.
 *   - Best-of-N: sample many answers, keep the top by a reward score.
 *   - Tree search (MCTS): explore a tree of reasoning steps, pour budget into
 *     the promising branches, judged by a value model.
 *
 * All numbers are illustrative-but-realistic; the shapes (best rises with N,
 * tree finds the winner without expanding everything, both curves flatten) are
 * the real lesson, not the exact digits.
 */

/* ------------------------------------------------------------ Best-of-N ---- */

/** A fixed pool of reward scores (0–100) for candidate answers. Slicing the
 *  first N keeps earlier candidates stable, so the best is non-decreasing as
 *  N grows — exactly how Best-of-N behaves. */
export const CANDIDATE_POOL: number[] = [
  41, 63, 38, 71, 52, 47, 68, 84, 55, 44, 79, 61,
];

export const MAX_N = CANDIDATE_POOL.length; // 12

export interface BestOfNResult {
  scores: number[];
  bestIdx: number;
  best: number;
  mean: number;
}

export function bestOfN(n: number): BestOfNResult {
  const scores = CANDIDATE_POOL.slice(0, Math.max(1, Math.min(MAX_N, n)));
  let bestIdx = 0;
  scores.forEach((s, i) => {
    if (s > scores[bestIdx]) bestIdx = i;
  });
  const best = scores[bestIdx];
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { scores, bestIdx, best, mean };
}

/* ------------------------------------------------------------ Tree search -- */

export type TreeKind = "root" | "step" | "leaf";

export interface TreeNode {
  id: string;
  parent: string | null;
  depth: number; //   0 root, 1 reasoning step, 2 leaf (final answer)
  col: number; //     horizontal slot (leaf columns are 0..5)
  value: number; //   value-model estimate (step) or final score (leaf)
  kind: TreeKind;
}

/** A small hand-authored reasoning tree: root → 3 first steps → 2 leaves each.
 *  Branch B has the highest value estimate and hides the best leaf (90). */
export const SEARCH_TREE: TreeNode[] = [
  { id: "root", parent: null, depth: 0, col: 2.5, value: 0, kind: "root" },
  { id: "A", parent: "root", depth: 1, col: 0.5, value: 58, kind: "step" },
  { id: "B", parent: "root", depth: 1, col: 2.5, value: 81, kind: "step" },
  { id: "C", parent: "root", depth: 1, col: 4.5, value: 44, kind: "step" },
  { id: "L0", parent: "A", depth: 2, col: 0, value: 47, kind: "leaf" },
  { id: "L1", parent: "A", depth: 2, col: 1, value: 62, kind: "leaf" },
  { id: "L2", parent: "B", depth: 2, col: 2, value: 78, kind: "leaf" },
  { id: "L3", parent: "B", depth: 2, col: 3, value: 90, kind: "leaf" },
  { id: "L4", parent: "C", depth: 2, col: 4, value: 40, kind: "leaf" },
  { id: "L5", parent: "C", depth: 2, col: 5, value: 55, kind: "leaf" },
];

/** What each unit of budget reveals, best-first: score the three first steps,
 *  then expand the most promising branch (B), then A, then C. */
const REVEAL_GROUPS: string[][] = [
  ["A", "B", "C"], // budget 1 — value estimates on every first step
  ["L2", "L3"], //    budget 2 — expand B (best estimate) first
  ["L0", "L1"], //    budget 3 — expand A
  ["L4", "L5"], //    budget 4 — expand C
];

export const BUDGET_MAX = REVEAL_GROUPS.length; // 4

export interface SearchState {
  revealed: Set<string>;
  bestPath: Set<string>;
  bestScore: number;
}

const NODE_BY_ID: Record<string, TreeNode> = Object.fromEntries(
  SEARCH_TREE.map((n) => [n.id, n]),
);

export function searchAt(budget: number): SearchState {
  const b = Math.max(0, Math.min(BUDGET_MAX, budget));
  const revealed = new Set<string>(["root"]);
  for (let i = 0; i < b; i++) REVEAL_GROUPS[i].forEach((id) => revealed.add(id));

  // Best complete path so far = highest-scoring revealed leaf + its ancestors.
  let bestLeaf: TreeNode | null = null;
  SEARCH_TREE.forEach((n) => {
    if (n.kind === "leaf" && revealed.has(n.id)) {
      if (!bestLeaf || n.value > bestLeaf.value) bestLeaf = n;
    }
  });

  const bestPath = new Set<string>();
  let bestScore = 0;
  if (bestLeaf) {
    bestScore = (bestLeaf as TreeNode).value;
    let cur: TreeNode | null = bestLeaf;
    while (cur) {
      bestPath.add(cur.id);
      cur = cur.parent ? NODE_BY_ID[cur.parent] : null;
    }
  }
  return { revealed, bestPath, bestScore };
}

/** Nodes revealed / total, for the readout. */
export function revealedCount(budget: number): number {
  return searchAt(budget).revealed.size;
}

/* ------------------------------------------------------------ Trade-off ---- */

/** Compute budget in model calls, and the best score each method reaches at
 *  that budget. Tree search sits above Best-of-N and both flatten out. */
export const COMPUTE_LEVELS = [1, 2, 4, 8, 16, 32];
export const BON_QUALITY = [41, 63, 71, 84, 88, 92];
export const TREE_QUALITY = [52, 78, 90, 93, 95, 96];
