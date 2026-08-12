import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Backpropagation from "../../../components/Backpropagation";

export const metadata: Metadata = {
  title: "Backpropagation — Xavier Ramirez",
  description:
    "How one wrong guess tells millions of weights which way to move. Scroll through three live diagrams — blame flowing backward through a tiny network, the gradient arrow on a loss bowl, and gradient descent rolling to the bottom.",
};

/** Stage 0 · 2.5.1 — how the model works out which way is downhill for every weight. */
export default function Page() {
  return (
    <>
      <Header />
      <Backpropagation />
      <Footer />
    </>
  );
}
