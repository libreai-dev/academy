import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Quantization from "../../../components/Quantization";

export const metadata: Metadata = {
  title: "Quantization — Xavier Ramirez",
  description:
    "Store each weight in 4, 3 or 2 bits instead of 16 and a model shrinks from a data-centre GPU to a laptop. Scroll through three live diagrams — weights snapped onto levels, naive vs calibrated rounding (GPTQ / AWQ / GGUF), and the size-speed-quality trade-off.",
};

/** Stage 0 · Expert — how fewer bits per weight shrink a model with little quality loss. */
export default function Page() {
  return (
    <>
      <Header />
      <Quantization />
      <Footer />
    </>
  );
}
