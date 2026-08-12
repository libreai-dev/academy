/**
 * Stage 0 · 4.6 — Verifiable rewards (RLVR). Pure logic + data for the three
 * nodes: no React, no d3. All user-facing prose lives in the copy module; only
 * code-literal / math-literal strings (problem statements, code snippets, test
 * expressions, step arithmetic) live here.
 */

/* ============================================================ NODE 1 ======= */
/* An objective verifier for a math answer: extract the number, normalise, and
 * compare it to the ground-truth gold answer → a crisp 1 (pass) or 0 (fail). */

export const MATH_PROBLEM = "12 × 12 + 5 = ?";
export const MATH_GOLD = 149;

export interface Candidate {
  key: string;
  /** The raw model output the verifier receives. */
  raw: string;
}

/** The four candidate answers the learner cycles through. */
export const CANDIDATES: Candidate[] = [
  { key: "prose", raw: "The answer is 149." },
  { key: "exact", raw: "149" },
  { key: "decimal", raw: "149.0" },
  { key: "wrong", raw: "144" },
];

/** Pull the last number out of a free-text answer (what a real math verifier
 *  does before comparing) — handles "The answer is 149." and "149.0" alike. */
export function extractNumber(s: string): number | null {
  const m = s.match(/-?\d+(?:\.\d+)?/g);
  if (!m || m.length === 0) return null;
  return Number(m[m.length - 1]);
}

export interface MathVerdict {
  extracted: number | null;
  gold: number;
  matched: boolean;
}

/** Extract → normalise → exact-compare against the gold answer. */
export function verifyMath(raw: string): MathVerdict {
  const extracted = extractNumber(raw);
  return { extracted, gold: MATH_GOLD, matched: extracted !== null && extracted === MATH_GOLD };
}

/* ============================================================ NODE 2 ======= */
/* Outcome reward (ORM) vs process reward (PRM). Same worked solution, two ways
 * to score it: one signal at the very end, or one signal per reasoning step. */

export interface SolStep {
  /** Short math-literal expression shown on the step row. */
  expr: string;
  /** Whether this individual step is mathematically valid. */
  ok: boolean;
}

export interface Solution {
  key: string;
  steps: SolStep[];
  /** Whether the FINAL answer happens to be correct. */
  finalOk: boolean;
}

/** Two solutions to `3x + 6 = 21`. The "lucky" one lands on the right final
 *  answer through two cancelling errors — invisible to an outcome-only grader. */
export const SOLUTIONS: Solution[] = [
  {
    key: "sound",
    finalOk: true,
    steps: [
      { expr: "3x = 21 − 6", ok: true },
      { expr: "3x = 15", ok: true },
      { expr: "x = 15 ÷ 3", ok: true },
      { expr: "x = 5", ok: true },
    ],
  },
  {
    key: "lucky",
    finalOk: true,
    steps: [
      { expr: "3x = 21 − 6", ok: true },
      { expr: "3x = 14", ok: false },
      { expr: "x = 14 ÷ 3", ok: false },
      { expr: "x = 5", ok: true },
    ],
  },
];

/** Outcome reward: a single number, handed to every step, decided only by the
 *  final answer. A wrong step inside a right answer is rewarded all the same. */
export function outcomeReward(sol: Solution): number {
  return sol.finalOk ? 1 : 0;
}

/** Process reward: one signal per step — 1 for a valid step, 0 for a broken one. */
export function processRewards(sol: Solution): number[] {
  return sol.steps.map((s) => (s.ok ? 1 : 0));
}

/* ============================================================ NODE 3 ======= */
/* Reward hacking. A model can pass a weak verifier without solving the task —
 * so you add held-out hidden tests. The visible tests only cover easy cases. */

export const TASK = "is_prime(n)";

/** The tests the model can see while it "solves" — deliberately weak (only two
 *  prime inputs), which is exactly what a hacker exploits. */
export const VISIBLE_TESTS = ["is_prime(7) == True", "is_prime(13) == True"];
/** Held-out tests the model never sees — they include the cases a cheat misses. */
export const HIDDEN_TESTS = ["is_prime(2) == True", "is_prime(9) == False"];

export interface Solver {
  key: string;
  /** Source lines shown in the code panel. */
  code: string[];
  passesVisible: boolean;
  passesHidden: boolean;
  /** True when the code games the verifier rather than solving the task. */
  hack: boolean;
}

export const SOLVERS: Solver[] = [
  {
    key: "hardcode",
    hack: true,
    code: ["def is_prime(n):", "    return n in {7, 13}"],
    passesVisible: true, // covers exactly the two visible primes
    passesHidden: false, // is_prime(2) → False, but gold is True
  },
  {
    key: "always",
    hack: true,
    code: ["def is_prime(n):", "    return True"],
    passesVisible: true, // both visible cases are True
    passesHidden: false, // is_prime(9) → True, but gold is False
  },
  {
    key: "real",
    hack: false,
    code: ["def is_prime(n):", "    if n < 2: return False", "    d = 2", "    while d*d <= n:", "        if n % d == 0: return False", "        d += 1", "    return True"],
    passesVisible: true,
    passesHidden: true,
  },
];

export type Verdict = "gamed" | "caught" | "solved" | "failed";

export interface HackResult {
  passVisible: boolean;
  passHidden: boolean;
  /** Whether the verifier the learner has configured accepts the answer. */
  rewarded: boolean;
  reward: number;
  verdict: Verdict;
}

/**
 * Run a solver through the verifier. With the guard OFF only the visible tests
 * count; with the guard ON the hidden tests must also pass. A hack that clears
 * the visible tests but fails the hidden ones is `gamed` (guard off) or `caught`
 * (guard on).
 */
export function runVerifier(solver: Solver, guard: boolean): HackResult {
  const passVisible = solver.passesVisible;
  const passHidden = solver.passesHidden;
  const rewarded = guard ? passVisible && passHidden : passVisible;
  let verdict: Verdict;
  if (!passVisible) verdict = "failed";
  else if (!passHidden && !guard) verdict = "gamed";
  else if (!passHidden && guard) verdict = "caught";
  else verdict = "solved";
  return { passVisible, passHidden, rewarded, reward: rewarded ? 1 : 0, verdict };
}
