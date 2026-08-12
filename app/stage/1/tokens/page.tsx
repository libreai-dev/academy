import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Tokens from "../../../components/Tokens";

export const metadata: Metadata = {
  title: "Tokens — Xavier Ramirez",
  description:
    "A model never sees your words, it sees tokens. A live tokenizer lesson on cost, context limits, and why models miscount letters.",
};

/** Stage 1 → "Tokens": the sample interactive lesson. */
export default function Page() {
  return (
    <>
      <Header />
      <Tokens />
      <Footer />
    </>
  );
}
