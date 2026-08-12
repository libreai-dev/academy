import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SafetyFiltering from "../../../components/SafetyFiltering";

export const metadata: Metadata = {
  title: "Safety filtering — Xavier Ramirez",
  description:
    "A well-written page can still be hateful, explicit, or dangerous. Scroll through three live diagrams — the harm categories, the classify-then-cut gate, and the strictness tradeoff — to see how a safety pass strips harmful content out of the corpus before pretraining, and why cranking it to maximum backfires.",
};

/** Stage 0 · Phase 0.4 — stripping harmful content out before pretraining. */
export default function Page() {
  return (
    <>
      <Header />
      <SafetyFiltering />
      <Footer />
    </>
  );
}
