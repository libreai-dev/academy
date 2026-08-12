import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import FeedForward from "../../../components/FeedForward";

export const metadata: Metadata = {
  title: "The feed-forward network — Xavier Ramirez",
  description:
    "After attention, each token runs through a small 2-layer network that expands the vector, fires a gate, and compresses it back — where most of a model's facts are stored. Play with the width and the gate across three live diagrams.",
};

/** Stage 0 · 2·B — the feed-forward network inside a transformer block. */
export default function Page() {
  return (
    <>
      <Header />
      <FeedForward />
      <Footer />
    </>
  );
}
