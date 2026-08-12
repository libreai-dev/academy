import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Distill from "../../../components/Distill";

export const metadata: Metadata = {
  title: "Model distillation — Xavier Ramirez",
  description:
    "How a small model learns from a giant. Scroll through six live diagrams — the memory bottleneck, soft-target logits, behavioral cloning, on- vs off-policy distillation, edge deployment economics, and the reasoning floor — to see how frontier intelligence is compressed to run on a laptop, a phone, or a cheap server.",
};

/** Stage 0 · Phase 4.2 — model distillation. */
export default function Page() {
  return (
    <>
      <Header />
      <Distill />
      <Footer />
    </>
  );
}
