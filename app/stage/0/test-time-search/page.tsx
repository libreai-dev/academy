import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import TestTimeSearch from "../../../components/TestTimeSearch";

export const metadata: Metadata = {
  title: "Test-time search — Xavier Ramirez",
  description:
    "Spend more compute at inference to get better answers. Play with three live diagrams — Best-of-N sampling, tree search (MCTS), and the compute-vs-quality trade-off — to see how a frozen model gives better answers when you let it think longer.",
};

/** Stage 0 · Test-time search — Best-of-N, tree search (MCTS), and the trade-off. */
export default function Page() {
  return (
    <>
      <Header />
      <TestTimeSearch />
      <Footer />
    </>
  );
}
