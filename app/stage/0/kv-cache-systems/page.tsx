import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import KvCacheSystems from "../../../components/KvCacheSystems";

export const metadata: Metadata = {
  title: "Managing the KV cache — Xavier Ramirez",
  description:
    "A serving engine manages the KV cache like an OS manages memory. Play with three live diagrams — fragmentation, PagedAttention's fixed pages, and RadixAttention's shared prefixes — to see how modern engines fit far more requests on one GPU.",
};

/** Stage 0 · Serving (Expert) — PagedAttention + RadixAttention over the KV cache. */
export default function Page() {
  return (
    <>
      <Header />
      <KvCacheSystems />
      <Footer />
    </>
  );
}
