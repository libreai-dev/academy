import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import MatrixOptimizers from "../../../components/MatrixOptimizers";

export const metadata: Metadata = {
  title: "Optimizers that fit — Xavier Ramirez",
  description:
    "AdamW stores two extra numbers per weight. Play with three live diagrams — the per-weight memory tax, optimizer-state bytes for Lion, Adafactor and Muon, and loss-vs-steps convergence — to see how newer optimizers trade memory against stability and speed.",
};

/** Stage 0 · 2.5·4 — matrix optimizers: AdamW's memory tax vs Lion / Adafactor / Muon. */
export default function Page() {
  return (
    <>
      <Header />
      <MatrixOptimizers />
      <Footer />
    </>
  );
}
