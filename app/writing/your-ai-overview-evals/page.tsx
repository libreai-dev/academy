import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AiEvals from "../../components/AiEvals";

export const metadata: Metadata = {
  title: "Your own AI Overview: Evals & guardrails — Xavier Ramirez",
  description:
    "The groundedness gate between a demo and production. One threshold does two jobs: a runtime gate that abstains on thin evidence, and a CI gate that fails the build when groundedness regresses — plus prompt-injection screening and PII redaction. The closer of the 'Your own AI Overview' series.",
};

export default function Page() {
  return (
    <>
      <Header />
      <AiEvals />
      <Footer />
    </>
  );
}
