import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import DataPipelineDeep from "../../../components/DataPipelineDeep";

export const metadata: Metadata = {
  title: "Inside the data pipeline — Xavier Ramirez",
  description:
    "Part 2 of the data pipeline: twelve live, interactive deep-dives under the same four stations — the robots.txt gate, retrain-vs-retrieve, prompt injection, connected-code cleanup, licence quarantine, PDF vision extraction, exact/fuzzy/semantic dedup with the LSH S-curve, domain temperature, the epoch cliff, and the synthetic 3-gate audit.",
};

/** Stage 0 · The Data Pipeline · Part 2 — each station, opened up. */
export default function Page() {
  return (
    <>
      <Header />
      <DataPipelineDeep />
      <Footer />
    </>
  );
}
