import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AiSpine from "../../components/AiSpine";

export const metadata: Metadata = {
  title: "Your own AI Overview: the spine — Xavier Ramirez",
  description:
    "Rebuild Google's AI Overview over your own private data: a write path that ingests change data from an S3 data lake and a six-node LangGraph read path that answers with citations. Clone it and run it.",
};

export default function Page() {
  return (
    <>
      <Header />
      <AiSpine />
      <Footer />
    </>
  );
}
