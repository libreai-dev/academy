import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import DistributedTraining from "../../../components/DistributedTraining";

export const metadata: Metadata = {
  title: "Distributed training — Xavier Ramirez",
  description:
    "A frontier model is too big for one GPU. Scroll through three live diagrams — the data-parallel GPU grid, tensor-vs-pipeline model splitting, and the ZeRO/FSDP memory bar — to see how a 120 GB model shards down to fit 80 GB cards.",
};

/** Stage 0 · Phase 2 — distributed training: data/tensor/pipeline parallelism + ZeRO/FSDP. */
export default function Page() {
  return (
    <>
      <Header />
      <DistributedTraining />
      <Footer />
    </>
  );
}
