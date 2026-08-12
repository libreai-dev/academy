import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import MixedPrecision from "../../../components/MixedPrecision";

export const metadata: Metadata = {
  title: "Mixed-precision training — Xavier Ramirez",
  description:
    "Training runs in low-precision numbers for speed and memory. Scroll through three live diagrams — the bit layouts of FP32/BF16/FP8, gradient survival under loss scaling, and a one-GPU memory budget — to see why BF16 became the default and how a master copy keeps tiny gradients alive.",
};

/** Stage 0 · 2.5 — mixed-precision training: BF16/FP8, loss scaling, memory. */
export default function Page() {
  return (
    <>
      <Header />
      <MixedPrecision />
      <Footer />
    </>
  );
}
