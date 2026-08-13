import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AiOverviews from "../../components/AiOverviews";

export const metadata: Metadata = {
  title: "How Google's AI Overview works — Xavier Ramirez",
  description:
    "A glass-box explainer of AI Overviews: query fan-out, live retrieval, and grounded answers where every sentence traces to a source. With an interactive demo.",
};

export default function Page() {
  return (
    <>
      <Header />
      <AiOverviews />
      <Footer />
    </>
  );
}
