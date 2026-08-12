import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ConstrainedDecoding from "../../../components/ConstrainedDecoding";

export const metadata: Metadata = {
  title: "Constrained decoding — Xavier Ramirez",
  description:
    "Guarantee valid JSON, every time. Three live diagrams show why free sampling breaks, how logit masking forces invalid tokens to zero probability, and how a grammar decides exactly which tokens are allowed next.",
};

/** Stage 0 · Expert — how a decoder is forced to emit structurally valid output. */
export default function Page() {
  return (
    <>
      <Header />
      <ConstrainedDecoding />
      <Footer />
    </>
  );
}
