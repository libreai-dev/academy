import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import PrefillVsDecode from "../../../components/PrefillVsDecode";

export const metadata: Metadata = {
  title: "Prefill vs decode — Xavier Ramirez",
  description:
    "Serving a model has two phases: prefill reads the whole prompt in one fast parallel pass, then decode writes the answer one token at a time. Scroll three live diagrams to see why long answers take a while.",
};

/** Stage 0 · Serving — the two phases of generating an answer. */
export default function Page() {
  return (
    <>
      <Header />
      <PrefillVsDecode />
      <Footer />
    </>
  );
}
