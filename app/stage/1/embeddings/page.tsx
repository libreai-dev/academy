import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Embeddings from "../../../components/Embeddings";

export const metadata: Metadata = {
  title: "Embeddings — libreai Academy",
  description:
    "Every token becomes a vector — a point on a map where nearby means similar in meaning. Explore the map, watch it settle out of pretraining, and try king − man + woman ≈ queen.",
};

/** Stage 1 → "Embeddings": meaning as vectors, learned during pretraining. */
export default function Page() {
  return (
    <>
      <Header />
      <Embeddings />
      <Footer />
    </>
  );
}
