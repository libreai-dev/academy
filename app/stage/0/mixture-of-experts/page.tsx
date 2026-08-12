import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import MixtureOfExperts from "../../../components/MixtureOfExperts";

export const metadata: Metadata = {
  title: "Mixture of Experts — Xavier Ramirez",
  description:
    "Instead of one big feed-forward per token, a router sends each token to a few specialist experts. Play with three live diagrams — top-K routing, load balancing, and the always-on shared expert — to see how a model holds far more parameters at similar compute per token.",
};

/** Stage 0 · 2·B — Mixture of Experts: routing, load balancing, shared expert. */
export default function Page() {
  return (
    <>
      <Header />
      <MixtureOfExperts />
      <Footer />
    </>
  );
}
