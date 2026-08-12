import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import GpuCpu from "../../../components/GpuCpu";

export const metadata: Metadata = {
  title: "GPU or CPU? — Xavier Ramirez",
  description:
    "A neural network is a mountain of matrix multiplies — that's why AI runs on GPUs, not CPUs. Race the two machines, tour a rack of GPUs, and split a model across the fleet.",
};

/** Stage 1 → "GPU or CPU?": how the network actually runs on hardware. */
export default function Page() {
  return (
    <>
      <Header />
      <GpuCpu />
      <Footer />
    </>
  );
}
