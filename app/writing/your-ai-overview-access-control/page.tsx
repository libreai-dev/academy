import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AiAccessControl from "../../components/AiAccessControl";

export const metadata: Metadata = {
  title: "Your own AI Overview: Access control at retrieval — Xavier Ramirez",
  description:
    "Filter at retrieval, not after. Why hiding restricted content in the prompt leaks, and how to compile a permission filter from the caller's signed token — tenant, env and roles — so restricted data never reaches the model. With a live leak demo you can drive.",
};

export default function Page() {
  return (
    <>
      <Header />
      <AiAccessControl />
      <Footer />
    </>
  );
}
