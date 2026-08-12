import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Neural from "../../../components/Neural";

export const metadata: Metadata = {
  title: "Neural networks — Xavier Ramirez",
  description:
    "A neural network is a function you fit to data — stacked multiply-and-adds with a nonlinearity. Wire up a real tiny network by hand and watch the decision boundary bend.",
};

/** Stage 1 → "Neural networks": the forward-pass architecture, by hand. */
export default function Page() {
  return (
    <>
      <Header />
      <Neural />
      <Footer />
    </>
  );
}
