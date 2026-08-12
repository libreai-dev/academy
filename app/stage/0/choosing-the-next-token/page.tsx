import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ChoosingNextToken from "../../../components/ChoosingNextToken";

export const metadata: Metadata = {
  title: "Choosing the next token — Xavier Ramirez",
  description:
    "A transformer's last step turns one hidden state into a single next token. Scroll through three live diagrams — the unembedding that scores every token, the softmax that turns scores into probabilities, and greedy-vs-sampling — to see how one word is chosen.",
};

/** Stage 0 · Choosing the next token — logits → softmax → pick. */
export default function Page() {
  return (
    <>
      <Header />
      <ChoosingNextToken />
      <Footer />
    </>
  );
}
