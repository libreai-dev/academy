import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import LifeOfLLM from "../../../components/LifeOfLLM";

export const metadata: Metadata = {
  title: "The life of an LLM — Xavier Ramirez",
  description:
    "The six steps that turn raw text into a model you can talk to: gather data, clean & tokenize, pretrain, fine-tune & align, evaluate, and host. A clickable pipeline.",
};

/** Stage 1 → "The life of an LLM": the first interactive lesson. */
export default function Page() {
  return (
    <>
      <Header />
      <LifeOfLLM />
      <Footer />
    </>
  );
}
