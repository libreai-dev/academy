import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Domains from "../../../components/Domains";

export const metadata: Metadata = {
  title: "Domain-specific sources — Xavier Ramirez",
  description:
    "Web text is thin on reasoning. Scroll through six live diagrams — the data-recipe mixer, AST repo packing, copyleft scrubbing, two-stage PDF/OCR routing, temporal decay of Q&A, and benchmark-contamination filtering — to see how labs blend high-density sources into a training corpus.",
};

/** Stage 0 · Phase 0.1b — domain-specific source selection. */
export default function Page() {
  return (
    <>
      <Header />
      <Domains />
      <Footer />
    </>
  );
}
