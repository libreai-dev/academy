import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import PiiScrubbing from "../../../components/PiiScrubbing";

export const metadata: Metadata = {
  title: "PII scrubbing — Xavier Ramirez",
  description:
    "Before training, personal data — emails, phones, IDs, names — and copyrighted or sealed text are detected and stripped. Play with the two detector families, watch spans get masked in a live document, and see why memorization makes scrubbing the law.",
};

/** Stage 0 · Phase 0.1 — scrubbing PII and protected text from the corpus. */
export default function Page() {
  return (
    <>
      <Header />
      <PiiScrubbing />
      <Footer />
    </>
  );
}
