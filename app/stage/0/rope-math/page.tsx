import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import RopeMath from "../../../components/RopeMath";

export const metadata: Metadata = {
  title: "RoPE: position as rotation — Xavier Ramirez",
  description:
    "RoPE encodes a token's position by rotating its query and key vectors. Play with three live dials to see why only the gap between two positions survives — and why rotating beats adding a position vector.",
};

/** Stage 0 · 1.3 — RoPE (rotary position embedding), the math. */
export default function Page() {
  return (
    <>
      <Header />
      <RopeMath />
      <Footer />
    </>
  );
}
