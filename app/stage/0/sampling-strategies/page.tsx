import type { Metadata } from "next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SamplingStrategies from "../../../components/SamplingStrategies";

export const metadata: Metadata = {
  title: "Sampling strategies — Xavier Ramirez",
  description:
    "You have a probability for every next token — now how do you pick? Play with three live bar charts: temperature flattens or sharpens the odds, top-k / top-p chop off the unlikely tail, and a repetition penalty stops the model looping.",
};

/** Stage 0 · Sampling strategies — the knobs that reshape the next-token
 *  distribution before a token is drawn (temperature, top-k/top-p, penalty). */
export default function Page() {
  return (
    <>
      <Header />
      <SamplingStrategies />
      <Footer />
    </>
  );
}
