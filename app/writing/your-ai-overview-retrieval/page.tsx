import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AiRetrieval from "../../components/AiRetrieval";

export const metadata: Metadata = {
  title: "Your own AI Overview: Retrieve & rerank — Xavier Ramirez",
  description:
    "Two-stage retrieval over your own private data: a wide, cheap vector net finds candidates, then a reranker reads the question and each chunk together and reorders them — so the passage that actually answers you lands in the small context budget the model reads. Clone it and run it.",
};

export default function Page() {
  return (
    <>
      <Header />
      <AiRetrieval />
      <Footer />
    </>
  );
}
