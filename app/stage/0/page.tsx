import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Backbone from "../../components/Backbone";

export const metadata: Metadata = {
  title: "LLM Fundamentals — the backbone — Xavier Ramirez",
  description:
    "The whole journey from raw web text to a served answer, as a scrollable pipeline of nine stations. Pick a depth — Fundamentals, Medium, or Expert — and each station reveals the right lessons.",
};

/** Stage 0 hub — the 2D backbone (pipeline × depth) for the LLM Fundamentals track. */
export default function Page() {
  return (
    <>
      <Header />
      <Backbone />
      <Footer />
    </>
  );
}
