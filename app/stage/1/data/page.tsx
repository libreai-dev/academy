import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Data from "../../../components/Data";

export const metadata: Metadata = {
  title: "Data — Xavier Ramirez",
  description:
    "A model's knowledge is just the text it was fed. Clean a real dataset stage by stage, watch most of it get thrown away, and see the token tape a model trains on.",
};

/** Stage 1 → "Data": gathering the web into a clean token tape. */
export default function Page() {
  return (
    <>
      <Header />
      <Data />
      <Footer />
    </>
  );
}
