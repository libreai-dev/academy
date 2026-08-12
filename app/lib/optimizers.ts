/**
 * Stage 0 · 2.5.4 — The optimizer (AdamW). Pure logic + data for the three
 * nodes; no React, no d3. Numbers are illustrative but computed honestly so the
 * diagrams and readouts stay in sync.
 *
 * Builds on Backpropagation: that lesson produced the gradient (the downhill
 * direction). This module turns a gradient into an actual *step* three ways —
 * plain SGD, Adam (momentum + per-weight scaling), and a learning-rate schedule.
 */

export interface Pt {
  x: number;
  y: number;
}

/* ---------------------------------------------------------------------------
 * Node 1 — SGD vs Adam on one loss surface.
 * An ill-conditioned quadratic bowl loss(x,y) = A·x² + B·y², A ≪ B, so the
 * valley is stretched: gentle along x (the "flat" weight), steep along y. A
 * single SGD step size must stay small to survive the steep walls, so it
 * zig-zags and crawls; Adam scales each axis on its own and heads straight down.
 * ------------------------------------------------------------------------- */

export type Optimizer = "sgd" | "adam";

export const BOWL = { A: 0.05, B: 1.3 };
export const START: Pt = { x: -0.9, y: 0.85 };
export const STEPS = 16;

export function loss(x: number, y: number): number {
  return BOWL.A * x * x + BOWL.B * y * y;
}

function grad(x: number, y: number): [number, number] {
  return [2 * BOWL.A * x, 2 * BOWL.B * y];
}

/** The full descent trajectory (STEPS points after the start), per optimizer. */
export function descentPath(opt: Optimizer): Pt[] {
  const pts: Pt[] = [{ ...START }];
  let x = START.x;
  let y = START.y;

  if (opt === "sgd") {
    const lr = 0.62; // large enough to bounce off the steep y walls
    for (let i = 0; i < STEPS; i++) {
      const [gx, gy] = grad(x, y);
      x -= lr * gx;
      y -= lr * gy;
      pts.push({ x, y });
    }
  } else {
    const lr = 0.065;
    const b1 = 0.9;
    const b2 = 0.999;
    const eps = 1e-8;
    let mx = 0;
    let my = 0;
    let vx = 0;
    let vy = 0;
    for (let i = 0; i < STEPS; i++) {
      const [gx, gy] = grad(x, y);
      mx = b1 * mx + (1 - b1) * gx;
      my = b1 * my + (1 - b1) * gy;
      vx = b2 * vx + (1 - b2) * gx * gx;
      vy = b2 * vy + (1 - b2) * gy * gy;
      const t = i + 1;
      const mxh = mx / (1 - Math.pow(b1, t));
      const myh = my / (1 - Math.pow(b1, t));
      const vxh = vx / (1 - Math.pow(b2, t));
      const vyh = vy / (1 - Math.pow(b2, t));
      x -= (lr * mxh) / (Math.sqrt(vxh) + eps);
      y -= (lr * myh) / (Math.sqrt(vyh) + eps);
      pts.push({ x, y });
    }
  }
  return pts;
}

/** Distance from the final point to the minimum (0,0) — “how close did it get”. */
export function finalDist(opt: Optimizer): number {
  const p = descentPath(opt);
  const f = p[p.length - 1];
  return Math.hypot(f.x, f.y);
}

/** Did this optimizer essentially reach the bottom within the step budget? */
export function settled(opt: Optimizer): boolean {
  return finalDist(opt) < 0.1;
}

/* ---------------------------------------------------------------------------
 * Node 2 — per-weight step sizes.
 * Two weights with different gradient histories: one steady, one noisy. Raw SGD
 * steps in proportion to the gradient (noisy weight lurches); Adam divides each
 * step by that weight's own root-mean-square gradient, normalising every weight
 * to a similar, controlled step.
 * ------------------------------------------------------------------------- */

export const WEIGHTS: { steady: number[]; noisy: number[] } = {
  steady: [0.22, 0.26, 0.19, 0.24, 0.21],
  noisy: [1.5, 0.4, 1.9, 0.7, 1.6],
};

const mean = (a: number[]): number => a.reduce((s, v) => s + v, 0) / a.length;

/** Plain SGD step magnitude: learning-rate × the latest gradient. */
export function rawStep(grads: number[], lr = 0.4): number {
  return lr * grads[grads.length - 1];
}

/** Adam step magnitude: lr × mean / (rms), so any gradient scale ⇒ ~lr. */
export function adamStep(grads: number[], lr = 0.4): number {
  const m = mean(grads);
  const v = mean(grads.map((g) => g * g));
  return (lr * m) / (Math.sqrt(v) + 1e-8);
}

/* ---------------------------------------------------------------------------
 * Node 3 — the learning-rate schedule.
 * lrAt returns the rate as a FRACTION of the peak (0..1) at training-progress t
 * (0..1): a linear warmup ramp, then either a cosine glide or a WSD (warmup-
 * stable-decay) hold-then-drop.
 * ------------------------------------------------------------------------- */

export type Schedule = "cosine" | "wsd";

export const SCHED = { peak: 3e-4, totalSteps: 100000, floor: 0.1, wsdStable: 0.75 };

export function lrAt(t: number, warmup: number, mode: Schedule): number {
  if (t < warmup) return warmup <= 0 ? 1 : t / warmup;
  const prog = (t - warmup) / (1 - warmup);
  if (mode === "cosine") {
    return SCHED.floor + (1 - SCHED.floor) * 0.5 * (1 + Math.cos(Math.PI * prog));
  }
  // WSD: hold the peak flat, then decay linearly over the final stretch.
  if (prog < SCHED.wsdStable) return 1;
  return 1 - (1 - SCHED.floor) * ((prog - SCHED.wsdStable) / (1 - SCHED.wsdStable));
}

/** Sampled schedule curve: x = progress (0..1), y = rate fraction (0..1). */
export function scheduleCurve(warmup: number, mode: Schedule, n = 160): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({ x: t, y: lrAt(t, warmup, mode) });
  }
  return out;
}
