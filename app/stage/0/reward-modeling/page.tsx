import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import RewardModeling from "../../../components/RewardModeling";

export const metadata: Metadata = {
  title: "Reward modeling — Xavier Ramirez",
  description:
    "You can't have a human grade every answer. Scroll through three live diagrams — labelling preference pairs, training a scalar reward, and ranking fresh answers — to see how a model learns to predict human judgement.",
};

/** Stage 0 · 4.4 — training a model to predict human preference as one score. */
export default function Page() {
  return (
    <>
      <Header />
      <RewardModeling />
      <Footer />
    </>
  );
}
