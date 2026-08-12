import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import PreferenceOptimization from "../../../components/PreferenceOptimization";

export const metadata: Metadata = {
  title: "Direct preference optimization — Xavier Ramirez",
  description:
    "DPO skips the separate reward model and the RL loop. It takes the same chosen-vs-rejected pairs and nudges the model directly to prefer the chosen answer over the rejected one — pick a pair, watch the probabilities shift, and compare it against the RLHF path.",
};

/** Stage 0 · 4.5 — Direct Preference Optimization: same preference pairs as
 *  RLHF, but one direct update instead of a reward model plus an RL loop. */
export default function Page() {
  return (
    <>
      <Header />
      <PreferenceOptimization />
      <Footer />
    </>
  );
}
