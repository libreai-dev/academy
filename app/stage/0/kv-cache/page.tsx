import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import KvCache from "../../../components/KvCache";

export const metadata: Metadata = {
  title: "The KV cache — Xavier Ramirez",
  description:
    "Why generation is limited by memory, not compute. Three live diagrams: the rising staircase of wasted work without a cache, the collapse to a flat line with it, and the KV cache eating into GPU memory until it overflows.",
};

/** Stage 0 · Serving — how the key/value cache makes decode cheap, and why it
 *  turns generation into a memory-bound problem. */
export default function Page() {
  return (
    <>
      <Header />
      <KvCache />
      <Footer />
    </>
  );
}
