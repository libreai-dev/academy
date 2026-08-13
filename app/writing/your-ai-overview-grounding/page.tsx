import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AiGrounding from "../../components/AiGrounding";

export const metadata: Metadata = {
  title: "Your own AI Overview: Grounding & citations — Xavier Ramirez",
  description:
    "The grounding node of a private-data RAG pipeline: number the retrieved passages, demand a [n] citation on every claim, parse each marker back to a real record — and abstain when the evidence is too thin. Clone it and run it, zero cloud.",
};

export default function Page() {
  return (
    <>
      <Header />
      <AiGrounding />
      <Footer />
    </>
  );
}
