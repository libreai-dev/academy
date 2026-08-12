import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import DataPipeline from "../../../components/DataPipeline";

export const metadata: Metadata = {
  title: "The data pipeline · Part 1 — Xavier Ramirez",
  description:
    "From the whole internet to a training recipe. Walk the four stations that turn the open web into a small, clean, carefully-blended corpus — gather, extract, deduplicate, mix — across nine live, playable diagrams.",
};

/** Stage 0 · The Data Pipeline · Part 1 — the walkable end-to-end story. */
export default function Page() {
  return (
    <>
      <Header />
      <DataPipeline />
      <Footer />
    </>
  );
}
