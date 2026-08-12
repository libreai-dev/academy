import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import BaseVsAssistant from "../../../components/BaseVsAssistant";

export const metadata: Metadata = {
  title: "From base model to assistant — Xavier Ramirez",
  description:
    "A freshly pretrained base model only continues text. Play with three live diagrams — the same prompt answered two ways, the instruction → response pairs that teach it, and what fine-tuning actually changes — to see how a base model becomes a helpful assistant.",
};

/** Stage 0 · 4.3 — how instruction tuning turns a base model into an assistant. */
export default function Page() {
  return (
    <>
      <Header />
      <BaseVsAssistant />
      <Footer />
    </>
  );
}
