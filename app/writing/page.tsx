import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WritingIndex from "../components/WritingIndex";

export const metadata: Metadata = {
  title: "Writing — Xavier Ramirez",
  description:
    "Notes on how AI systems actually work, and what it takes to run them in production. Interactive explainers, from the foundations up through the pieces of a model.",
};

export default function Page() {
  return (
    <>
      <Header />
      <WritingIndex />
      <Footer />
    </>
  );
}
