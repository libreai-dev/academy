import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import PositionalEncoding from "../../../components/PositionalEncoding";

export const metadata: Metadata = {
  title: "Positional encoding — Xavier Ramirez",
  description:
    "Attention reads every token at once, so on its own it can't tell word order apart — \"dog bites man\" and \"man bites dog\" look identical. Scroll three live diagrams to see why, and how adding a position signal to each token vector puts order back.",
};

/** Stage 0 · 1.3 — why attention ignores order, and how positional encoding fixes it. */
export default function Page() {
  return (
    <>
      <Header />
      <PositionalEncoding />
      <Footer />
    </>
  );
}
