import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import AttentionMechanism from "../../../components/AttentionMechanism";

export const metadata: Metadata = {
  title: "How attention works — Xavier Ramirez",
  description:
    "The transformer block showed each token looks at the others; this is the machine that does it. Scroll three live diagrams — query/key/value, the softmax match, and the weighted blend wrapped by a residual and RMSNorm — to see how attention actually works.",
};

/** Stage 0 · Reference 2·A — the query/key/value attention mechanism. */
export default function Page() {
  return (
    <>
      <Header />
      <AttentionMechanism />
      <Footer />
    </>
  );
}
