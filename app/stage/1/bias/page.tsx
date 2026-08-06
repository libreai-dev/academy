import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Bias from "../../../components/Bias";

export const metadata: Metadata = {
  title: "Bias — libreai Academy",
  description:
    "A model mirrors its corpus's skews — bias is the data's statistics learned faithfully. See who's in the data vs. the world, and why every cleaning choice is a value choice.",
};

/** Stage 1 → "Bias": the data has a point of view. */
export default function Page() {
  return (
    <>
      <Header />
      <Bias />
      <Footer />
    </>
  );
}
