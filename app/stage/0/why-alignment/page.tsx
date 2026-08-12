import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import WhyAlignment from "../../../components/WhyAlignment";

export const metadata: Metadata = {
  title: "Why alignment — Xavier Ramirez",
  description:
    "An instruction-following assistant can still be unhelpful or unsafe. Play with three live diagrams — pick the better of two answers, watch that preference become a reward score, and see repeated feedback bend the model's behaviour — to learn how alignment steers a model with human (or AI) feedback.",
};

/** Stage 0 · 4.4 — why alignment: preferences, rewards, and feedback. */
export default function Page() {
  return (
    <>
      <Header />
      <WhyAlignment />
      <Footer />
    </>
  );
}
