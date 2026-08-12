import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ToolCalling from "../../../components/ToolCalling";

export const metadata: Metadata = {
  title: "Tool calling — Xavier Ramirez",
  description:
    "A model can't check the weather or run your database — it only predicts text. Step through the tool-calling loop with three live diagrams: the model emits a structured call, the runtime executes it, and the result comes back as a new turn to continue from.",
};

/** Stage 0 · Phase 3 — how a model calls tools: emit, pause & execute, feed back. */
export default function Page() {
  return (
    <>
      <Header />
      <ToolCalling />
      <Footer />
    </>
  );
}
