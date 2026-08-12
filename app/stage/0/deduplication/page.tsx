import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Dedup from "../../../components/Dedup";

export const metadata: Metadata = {
  title: "Multi-stage deduplication — Xavier Ramirez",
  description:
    "The open web repeats itself constantly. Scroll through six live diagrams — the memorization gate, exact hash + suffix-array trimming, a real MinHash estimator, the LSH S-curve, semantic clustering, and the 3-stage funnel — to see how labs strip exact, fuzzy, and semantic redundancy from a training corpus.",
};

/** Stage 0 · Phase 0.3 — multi-stage deduplication. */
export default function Page() {
  return (
    <>
      <Header />
      <Dedup />
      <Footer />
    </>
  );
}
