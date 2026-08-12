import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import HowModelsLearn from "../../../components/HowModelsLearn";

export const metadata: Metadata = {
  title: "How models learn — Xavier Ramirez",
  description:
    "Training is one tiny loop at absurd scale: guess the next token, measure how wrong it was (loss), nudge the weights, repeat. Play with three live diagrams — the next-token guess, gradient descent on a loss valley, and the training curve falling over trillions of tokens.",
};

/** Stage 0 · How models learn — guess → loss → nudge, repeated at scale. */
export default function Page() {
  return (
    <>
      <Header />
      <HowModelsLearn />
      <Footer />
    </>
  );
}
