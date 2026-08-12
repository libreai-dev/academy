import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Ppo from "../../../components/Ppo";

export const metadata: Metadata = {
  title: "PPO — Xavier Ramirez",
  description:
    "PPO is the online RL loop that improves a model from a reward model. Scroll through three live diagrams — the actor–critic cast, the clipped step, and the KL leash — to see how it gets better without drifting into gibberish.",
};

/** Stage 0 · Phase 4.4 — PPO: clipped policy updates on a KL leash. */
export default function Page() {
  return (
    <>
      <Header />
      <Ppo />
      <Footer />
    </>
  );
}
