import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Attention from "../../../components/Attention";

export const metadata: Metadata = {
  title: "Transformers & attention — Xavier Ramirez",
  description:
    "A fixed embedding can't tell riverside “bank” from money “bank.” Attention is the fix: each token looks at the others and blends in what's relevant. Tap a word to see what it attends to, switch heads, and steer a query·key·value lookup by hand.",
};

/** Stage 1 → "Transformers & attention": tokens attend to each other; meaning
 *  is settled by context via a soft query·key·value lookup. */
export default function Page() {
  return (
    <>
      <Header />
      <Attention />
      <Footer />
    </>
  );
}
