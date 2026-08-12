import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ClassifierScoring from "../../../components/ClassifierScoring";

export const metadata: Metadata = {
  title: "A model that grades the web — Xavier Ramirez",
  description:
    "Hand-written rules only catch obvious junk. Train a small classifier on good-vs-bad text, score every page 0–1, and keep only the high scorers — the FineWeb-Edu idea, in three live diagrams.",
};

/** Stage 0 · Phase 0.3 — classifier-based quality scoring (FineWeb-Edu). */
export default function Page() {
  return (
    <>
      <Header />
      <ClassifierScoring />
      <Footer />
    </>
  );
}
