import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Optimizers from "../../../components/Optimizers";

export const metadata: Metadata = {
  title: "The optimizer: AdamW — Xavier Ramirez",
  description:
    "Backprop gives the gradient; the optimizer decides the step. Scroll through three live diagrams — SGD vs Adam on a loss surface, per-weight step sizes, and the warmup-then-decay learning-rate schedule — to see how AdamW trains large models stably.",
};

/** Stage 0 · 2.5.4 — how AdamW turns gradients into stable training steps. */
export default function Page() {
  return (
    <>
      <Header />
      <Optimizers />
      <Footer />
    </>
  );
}
