import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import MultiTurnFormatting from "../../../components/MultiTurnFormatting";

export const metadata: Metadata = {
  title: "Multi-turn & formatting — Xavier Ramirez",
  description:
    "A model has no memory. Scroll through three live diagrams — a growing stack of role blocks, a tool result folding back in, and a pre-filled <think> scratchpad — to see how long chats, tool calls, and reasoning all reuse one format.",
};

/** Stage 0 · 1.2 — how conversations, tools, and reasoning fold into role blocks. */
export default function Page() {
  return (
    <>
      <Header />
      <MultiTurnFormatting />
      <Footer />
    </>
  );
}
