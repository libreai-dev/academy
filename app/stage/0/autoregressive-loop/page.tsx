import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import AutoregressiveLoop from "../../../components/AutoregressiveLoop";

export const metadata: Metadata = {
  title: "The autoregressive loop — Xavier Ramirez",
  description:
    "One token isn't a sentence. Play the loop that writes a whole paragraph: the model predicts a token, appends it, feeds it back, and repeats until an end-of-sequence token — the reason generation is inherently one token at a time.",
};

/** Stage 0 · Phase 0 — how one next-token prediction becomes a whole sentence. */
export default function Page() {
  return (
    <>
      <Header />
      <AutoregressiveLoop />
      <Footer />
    </>
  );
}
