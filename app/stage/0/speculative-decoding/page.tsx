import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SpeculativeDecoding from "../../../components/SpeculativeDecoding";

export const metadata: Metadata = {
  title: "Speculative decoding — Xavier Ramirez",
  description:
    "A small draft model guesses several next tokens; the big model verifies them all in one pass and accepts the correct prefix. Play with draft length and accept rate to watch the speed-up — with the same output as the big model alone.",
};

/** Stage 0 · Expert — speculative decoding: draft & verify for faster generation. */
export default function Page() {
  return (
    <>
      <Header />
      <SpeculativeDecoding />
      <Footer />
    </>
  );
}
