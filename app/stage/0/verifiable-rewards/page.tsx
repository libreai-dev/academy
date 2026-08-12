import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import VerifiableRewards from "../../../components/VerifiableRewards";

export const metadata: Metadata = {
  title: "Verifiable rewards — Xavier Ramirez",
  description:
    "For math and code you can skip the learned reward model and check the answer for real. Scroll through three live diagrams — a verifier scoring candidate answers, outcome vs process rewards, and a reward-hacking example getting caught by hidden tests.",
};

/** Stage 0 · 4.6 — RLVR: objective verifiers, process rewards, and reward hacking. */
export default function Page() {
  return (
    <>
      <Header />
      <VerifiableRewards />
      <Footer />
    </>
  );
}
