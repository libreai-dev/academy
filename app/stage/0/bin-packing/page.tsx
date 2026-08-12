import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import BinPacking from "../../../components/BinPacking";

export const metadata: Metadata = {
  title: "Bin-packing for training — Xavier Ramirez",
  description:
    "How clean text becomes GPU-ready batches: pre-tokenize the corpus once, stitch documents into one stream with <eos> markers, and pack the stream into fixed-length blocks with zero padding. Three live diagrams you can drive.",
};

/** Stage 0 · 0.6 — pre-tokenize, concatenate with <eos>, pack into fixed blocks. */
export default function Page() {
  return (
    <>
      <Header />
      <BinPacking />
      <Footer />
    </>
  );
}
