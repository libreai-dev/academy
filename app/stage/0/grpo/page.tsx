import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Grpo from "../../../components/Grpo";

export const metadata: Metadata = {
  title: "GRPO: drop the critic — Xavier Ramirez",
  description:
    "GRPO removes PPO's memory-heavy critic. Scroll three live diagrams — the PPO-vs-GRPO memory stacks, one prompt fanning into a group of answers, and each answer scored against the group mean — to see how group-relative advantage replaces a whole value network.",
};

/** Stage 0 · 4.5 — GRPO: sample a group, score against the mean, no critic. */
export default function Page() {
  return (
    <>
      <Header />
      <Grpo />
      <Footer />
    </>
  );
}
