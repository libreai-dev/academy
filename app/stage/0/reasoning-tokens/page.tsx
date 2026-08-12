import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ReasoningTokens from "../../../components/ReasoningTokens";

export const metadata: Metadata = {
  title: "Reasoning tokens — Xavier Ramirez",
  description:
    "A reasoning model has no second brain — it writes a hidden scratchpad before its answer, bracketed by <think> tokens. Toggle reasoning on and off, spend a thinking budget, and step the token stream to see it's still the same next-token loop.",
};

/** Stage 0 · Phase 3 — the hidden think block, and why more tokens buy better answers. */
export default function Page() {
  return (
    <>
      <Header />
      <ReasoningTokens />
      <Footer />
    </>
  );
}
