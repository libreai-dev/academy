import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SupervisedFineTuning from "../../../components/SupervisedFineTuning";

export const metadata: Metadata = {
  title: "Supervised fine-tuning — Xavier Ramirez",
  description:
    "How a base model becomes an assistant: train it on instruction→answer pairs and grade it only on the answer. Scroll through three live diagrams — the training example, the loss mask, and base-vs-SFT outputs — to see why masking the prompt makes the model reply instead of ramble.",
};

/** Stage 0 · 4.3 — Supervised fine-tuning: instruction→response pairs, loss on the response only. */
export default function Page() {
  return (
    <>
      <Header />
      <SupervisedFineTuning />
      <Footer />
    </>
  );
}
