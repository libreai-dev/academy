import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import TokenDictionary from "../../../components/TokenDictionary";

export const metadata: Metadata = {
  title: "The token dictionary — Xavier Ramirez",
  description:
    "Models don't read letters or words — they read tokens from a fixed dictionary. Three live diagrams: letters vs words vs sub-words, a Byte-Pair Encoding trainer that builds the vocabulary by merging frequent pairs, and a real tokenizer turning your text into integer IDs.",
};

/** Stage 0 · 1.3 — how the token dictionary is built (BPE) and used. */
export default function Page() {
  return (
    <>
      <Header />
      <TokenDictionary />
      <Footer />
    </>
  );
}
