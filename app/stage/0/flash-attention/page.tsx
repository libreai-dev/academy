import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import FlashAttention from "../../../components/FlashAttention";

export const metadata: Metadata = {
  title: "FlashAttention — Xavier Ramirez",
  description:
    "Attention's N×N score grid grows with the square of the sequence. Play with three live diagrams — the memory wall, tiling the grid through fast on-chip memory, and GQA/MQA key-value sharing — to see how FlashAttention gets the exact same answer without ever storing the whole grid.",
};

/** Stage 0 · 2·A — how FlashAttention avoids the N×N memory wall. */
export default function Page() {
  return (
    <>
      <Header />
      <FlashAttention />
      <Footer />
    </>
  );
}
