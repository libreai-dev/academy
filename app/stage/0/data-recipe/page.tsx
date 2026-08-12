import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Recipe from "../../../components/Recipe";

export const metadata: Metadata = {
  title: "Data recipe & synthetic expansion — Xavier Ramirez",
  description:
    "A clean corpus isn't a training set yet. Scroll through six live diagrams — the domain mixer, temperature sampling, the epoch cliff, synthetic textbook generation, the 3-gate synthetic audit, and the final locked recipe — to see how labs weight domains and manufacture dense synthetic text.",
};

/** Stage 0 · Phase 0.5 — data recipe & synthetic expansion. */
export default function Page() {
  return (
    <>
      <Header />
      <Recipe />
      <Footer />
    </>
  );
}
