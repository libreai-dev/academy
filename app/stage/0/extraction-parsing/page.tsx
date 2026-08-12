import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ExtractionParsing from "../../../components/ExtractionParsing";

export const metadata: Metadata = {
  title: "Extraction & parsing — Xavier Ramirez",
  description:
    "A crawled page is mostly boilerplate. Scroll through three live diagrams — strip a page to the article, turn hard formats (PDFs, scans, tables) into clean markdown, and tag the language — to see how the web becomes clean, structured text.",
};

/** Stage 0 · Phase 0.2 — pulling clean article text out of a crawled page. */
export default function Page() {
  return (
    <>
      <Header />
      <ExtractionParsing />
      <Footer />
    </>
  );
}
