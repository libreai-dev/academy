import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import QualityFiltering from "../../../components/QualityFiltering";

export const metadata: Metadata = {
  title: "Quality filtering — Xavier Ramirez",
  description:
    "Most of the crawled web is junk. Scroll through three live diagrams — how little of a page is prose, the four cheap heuristic rules that catch menus, spam and gibberish, and the funnel that collapses the raw crawl into a small, clean pile of training text.",
};

/** Stage 0 · Phase 0.3 — cheap heuristics throw out the junk before training. */
export default function Page() {
  return (
    <>
      <Header />
      <QualityFiltering />
      <Footer />
    </>
  );
}
