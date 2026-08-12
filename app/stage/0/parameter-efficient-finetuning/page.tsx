import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ParameterEfficientFinetuning from "../../../components/ParameterEfficientFinetuning";

export const metadata: Metadata = {
  title: "Parameter-efficient fine-tuning — Xavier Ramirez",
  description:
    "LoRA freezes a giant model and trains a tiny low-rank adapter instead — so a huge model fine-tunes on a single GPU. Three live diagrams: the frozen-W-plus-adapter mechanism, the memory win, and the QLoRA and DoRA upgrades.",
};

/** Stage 0 · 4.3 — LoRA / QLoRA / DoRA: fine-tune a huge model on one GPU. */
export default function Page() {
  return (
    <>
      <Header />
      <ParameterEfficientFinetuning />
      <Footer />
    </>
  );
}
