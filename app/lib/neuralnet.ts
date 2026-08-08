/**
 * A tiny 2-2-1 neural network for the Neural networks lesson (pure, framework-
 * free — the component only renders). Two inputs → two hidden neurons → one
 * output. The hidden activation can be switched between a real nonlinearity
 * (tanh) and the identity ("straight"), which is the whole point of the lesson:
 * with the nonlinearity the stacked layers can bend a straight boundary into a
 * curve; without it, the whole network collapses back to a single line.
 *
 * Nothing here is trained at runtime — training is the *next* lesson. The
 * `SOLVE` presets are weights found offline (gradient descent) so the "Solve it"
 * button can load a known-good configuration for the learner to poke at.
 */

export type Weights = {
  W1: [[number, number], [number, number]]; // input → hidden (row per hidden neuron)
  b1: [number, number]; //                     hidden biases
  W2: [number, number]; //                     hidden → output
  b2: number; //                               output bias
};

export type Point = { x1: number; x2: number; y: 0 | 1 };
export type DatasetKey = "blobs" | "xor";

/** Build a Point[] from class-A and class-B coordinate lists. */
function mk(a: [number, number][], b: [number, number][]): Point[] {
  return [
    ...a.map(([x1, x2]): Point => ({ x1, x2, y: 1 })),
    ...b.map(([x1, x2]): Point => ({ x1, x2, y: 0 })),
  ];
}

/** Fixed, hand-generated datasets in [-1, 1]² (label 1 = class A, 0 = class B). */
export const DATASETS: Record<DatasetKey, Point[]> = {
  // Two clusters — separable by a single straight line.
  blobs: mk(
    [
      [-0.72, -0.489], [-0.396, -0.604], [-0.554, -0.634], [-0.291, -0.495], [-0.487, -0.607],
      [-0.673, -0.361], [-0.324, -0.521], [-0.612, -0.611], [-0.637, -0.578], [-0.674, -0.365],
    ],
    [
      [0.565, 0.702], [0.654, 0.364], [0.567, 0.388], [0.71, 0.534], [0.538, 0.528],
      [0.433, 0.335], [0.34, 0.767], [0.733, 0.676], [0.581, 0.668], [0.604, 0.481],
    ],
  ),
  // Same-sign quadrants vs opposite-sign — impossible to split with one line.
  xor: mk(
    [
      [0.5, 0.457], [0.491, 0.606], [0.496, 0.371], [0.561, 0.413], [0.532, 0.482],
      [-0.673, -0.724], [-0.355, -0.532], [-0.714, -0.353], [-0.577, -0.469], [-0.675, -0.533],
    ],
    [
      [0.748, -0.674], [0.624, -0.59], [0.526, -0.451], [0.421, -0.426], [0.672, -0.711],
      [-0.738, 0.404], [-0.495, 0.502], [-0.65, 0.553], [-0.542, 0.391], [-0.357, 0.489],
    ],
  ),
};

/** Weights that classify each dataset at 100% (found offline). Load with "Solve it". */
export const SOLVE: Record<DatasetKey, Weights> = {
  blobs: { W1: [[-2.23, -1.97], [-1.18, -1.71]], b1: [0.02, -0.05], W2: [5.81, 2.88], b2: 0.09 },
  xor: { W1: [[-4.01, -4.21], [3.48, 4.14]], b1: [1.93, 2.06], W2: [-6.98, -7.02], b2: 6.45 },
};

/** A visible, only-partly-right boundary the learner can push around (≈65% on blobs). */
export const START: Weights = { W1: [[1, -2], [0.6, -0.4]], b1: [0, 0], W2: [1, 2], b2: 0 };

/** The logistic squash: any real number → (0, 1). */
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** One forward pass. Returns the output probability (class A) and the hidden activations. */
export function forward(w: Weights, x1: number, x2: number, nonlinear: boolean): { prob: number; h: [number, number] } {
  const act = nonlinear ? Math.tanh : (z: number) => z;
  const h0 = act(w.b1[0] + w.W1[0][0] * x1 + w.W1[0][1] * x2);
  const h1 = act(w.b1[1] + w.W1[1][0] * x1 + w.W1[1][1] * x2);
  const prob = sigmoid(w.b2 + w.W2[0] * h0 + w.W2[1] * h1);
  return { prob, h: [h0, h1] };
}

/** Fraction of points classified correctly (threshold 0.5). */
export function accuracy(w: Weights, points: Point[], nonlinear: boolean): number {
  let correct = 0;
  for (const p of points) {
    const { prob } = forward(w, p.x1, p.x2, nonlinear);
    if ((prob > 0.5 ? 1 : 0) === p.y) correct++;
  }
  return correct / points.length;
}

/** The nine editable parameters, in diagram order. */
export type ParamId = "W1_0_0" | "W1_0_1" | "W1_1_0" | "W1_1_1" | "W2_0" | "W2_1" | "b1_0" | "b1_1" | "b2";

export function getParam(w: Weights, id: ParamId): number {
  switch (id) {
    case "W1_0_0": return w.W1[0][0];
    case "W1_0_1": return w.W1[0][1];
    case "W1_1_0": return w.W1[1][0];
    case "W1_1_1": return w.W1[1][1];
    case "W2_0": return w.W2[0];
    case "W2_1": return w.W2[1];
    case "b1_0": return w.b1[0];
    case "b1_1": return w.b1[1];
    case "b2": return w.b2;
  }
}

/** Return a new Weights with one parameter changed (never mutates). */
export function setParam(w: Weights, id: ParamId, v: number): Weights {
  const n: Weights = { W1: [[...w.W1[0]], [...w.W1[1]]], b1: [...w.b1], W2: [...w.W2], b2: w.b2 };
  switch (id) {
    case "W1_0_0": n.W1[0][0] = v; break;
    case "W1_0_1": n.W1[0][1] = v; break;
    case "W1_1_0": n.W1[1][0] = v; break;
    case "W1_1_1": n.W1[1][1] = v; break;
    case "W2_0": n.W2[0] = v; break;
    case "W2_1": n.W2[1] = v; break;
    case "b1_0": n.b1[0] = v; break;
    case "b1_1": n.b1[1] = v; break;
    case "b2": n.b2 = v; break;
  }
  return n;
}

/** Deterministic random weights in [-range, range] from a seed (for "Randomize"). */
export function randomWeights(seed: number, range = 2.5): Weights {
  let s = (seed * 2654435761) % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return ((s - 1) / 2147483646) * 2 * range - range;
  };
  const r = () => Math.round(next() * 100) / 100;
  return { W1: [[r(), r()], [r(), r()]], b1: [r(), r()], W2: [r(), r()], b2: r() };
}
