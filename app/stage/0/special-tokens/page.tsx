import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SpecialTokens from "../../../components/SpecialTokens";

export const metadata: Metadata = {
  title: "Special tokens & chat templates — Xavier Ramirez",
  description:
    "How does a whole chat become tokens? Scroll through three live diagrams — the conversation array, the chat template that folds it into one string, and a reserved control token as a single integer ID — to see how system/user/assistant get marked for the model.",
};

/** Stage 0 · 1.1 — a chat becomes one formatted string with reserved control tokens. */
export default function Page() {
  return (
    <>
      <Header />
      <SpecialTokens />
      <Footer />
    </>
  );
}
