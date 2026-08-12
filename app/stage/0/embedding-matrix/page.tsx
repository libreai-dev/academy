import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import EmbeddingMatrix from "../../../components/EmbeddingMatrix";

export const metadata: Metadata = {
  title: "The embedding matrix — Xavier Ramirez",
  description:
    "A token ID is just a number. Play with three live diagrams — the matrix lookup that turns an ID into a vector, the 2D meaning map where similar words become neighbours, and the before/after-training reveal — to see how a model's first layer is one big learned table.",
};

/** Stage 1 · 1.3 — a token ID indexes one learned row of the embedding matrix. */
export default function Page() {
  return (
    <>
      <Header />
      <EmbeddingMatrix />
      <Footer />
    </>
  );
}
