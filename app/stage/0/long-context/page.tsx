import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import LongContext from "../../../components/LongContext";

export const metadata: Metadata = {
  title: "Long context — Xavier Ramirez",
  description:
    "A model trained on 4k tokens can read 128k without retraining. Scroll through three live diagrams — the RoPE dial that breaks past its training length, the frequency rescale that fixes it, and how linear, NTK-aware and YaRN each spread the stretch.",
};

/** Stage 0 · 1.4 — extending a RoPE model's context by rescaling frequencies. */
export default function Page() {
  return (
    <>
      <Header />
      <LongContext />
      <Footer />
    </>
  );
}
