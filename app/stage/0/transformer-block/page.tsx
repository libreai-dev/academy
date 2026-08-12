import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import TransformerBlock from "../../../components/TransformerBlock";

export const metadata: Metadata = {
  title: "The transformer block — Xavier Ramirez",
  description:
    "A transformer is one small block stacked over and over. Play with three live diagrams — attention links over a token row, the parts of a block (mix, think, shortcut), and a stack of blocks predicting the next token — to see what a transformer block does.",
};

/** Stage 0 · Reference 2 — what one transformer block does, then stacking them. */
export default function Page() {
  return (
    <>
      <Header />
      <TransformerBlock />
      <Footer />
    </>
  );
}
