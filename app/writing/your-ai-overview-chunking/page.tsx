import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AiChunking from "../../components/AiChunking";

export const metadata: Metadata = {
  title: "Your own AI Overview: Chunking — Xavier Ramirez",
  description:
    "Chunking is a retrieval decision, not preprocessing. Drive a live chunk-size and overlap slider over a real underwriting note and watch the answer survive inside one chunk or get torn across a boundary — then read the real 40-line splitter that keeps every chunk filterable and citable.",
};

export default function Page() {
  return (
    <>
      <Header />
      <AiChunking />
      <Footer />
    </>
  );
}
