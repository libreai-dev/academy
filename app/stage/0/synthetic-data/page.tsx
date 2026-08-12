import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SyntheticData from "../../../components/SyntheticData";

export const metadata: Metadata = {
  title: "Synthetic data — Xavier Ramirez",
  description:
    "Strong models write their own training data. Scroll through three live diagrams — evolving a seed prompt into harder variants, building a step-by-step reasoning trace, and a rejection-sampling funnel that keeps only the verified answers.",
};

/** Stage 0 · 4.1 — how models generate and grade their own training data. */
export default function Page() {
  return (
    <>
      <Header />
      <SyntheticData />
      <Footer />
    </>
  );
}
