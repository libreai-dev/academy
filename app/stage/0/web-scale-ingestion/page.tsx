import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import WebScale from "../../../components/WebScale";

export const metadata: Metadata = {
  title: "Web-scale ingestion — Xavier Ramirez",
  description:
    "Nobody downloads the internet. Scroll through six live diagrams — the authority field, the byte treemap, the WARC→.bin flow, the robots.txt gate, retrain-vs-retrieve, and prompt injection — to see how the open web becomes clean training bytes.",
};

/** Stage 0 · Phase 0.1a — how the open web becomes clean training data. */
export default function Page() {
  return (
    <>
      <Header />
      <WebScale />
      <Footer />
    </>
  );
}
