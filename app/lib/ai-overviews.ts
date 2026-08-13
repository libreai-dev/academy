// ============================================================================
// ai-overviews.ts — the shared contract for the "How AI Overviews work" post
// and the companion `open-overview` repo.
//
// One response shape drives both: the deterministic demo baked into the blog
// post, and the live output of the Python backend (BYOK). Keep this in sync with
// the repo's response model so the widget renders either identically.
// ============================================================================

/** A retrieved source, shown as a card in the sources panel. */
export interface Source {
  id: string; // "s1" — referenced by Block.cites
  title: string;
  publisher: string;
  snippet: string;
  url: string;
}

/** A block of the generated answer — a bold lead line, a section heading, then
 *  bulleted claims with bold lead-ins. */
export type BlockKind = "para" | "heading" | "bullet";
export interface Block {
  kind: BlockKind;
  /** Optional bold lead-in (the start of each bullet is bolded). */
  lead?: string;
  text: string;
  /** Optional emoji shown before a heading. */
  icon?: string;
  /** Source ids supporting this block. Empty = ungrounded (no evidence). */
  cites: string[];
}

/** The full AI-Overview response — the contract the widget renders. */
export interface OverviewResult {
  query: string;
  /** Query fan-out: the sub-questions the system actually searches for. */
  subQueries: string[];
  sources: Source[];
  /** The grounded answer (retrieval on): fresh, cited, current. */
  answer: Block[];
  /** The same model with retrieval OFF: frozen at training time, so out of date. */
  ungrounded: Block[];
}

/** Fraction of answer *claims* (non-heading blocks) backed by ≥1 source (0–1). */
export function groundedness(answer: Block[]): number {
  const claims = answer.filter((b) => b.kind !== "heading");
  if (!claims.length) return 0;
  return claims.filter((b) => b.cites.length > 0).length / claims.length;
}

/** Publisher → a stable accent hue for its avatar chip (no external favicons). */
export function publisherHue(publisher: string): number {
  let h = 0;
  for (let i = 0; i < publisher.length; i++) h = (h * 31 + publisher.charCodeAt(i)) % 360;
  return h;
}

// ── Deterministic demo — a time-sensitive query ─────────────────────────────
// The whole point of an AI Overview is *freshness*: with retrieval OFF, the
// frozen model confidently answers with LAST YEAR'S facts; with retrieval ON it
// fetches today's and cites it. (Set for the post's "today" of Aug 2026, with a
// model trained through ~2024. Snippets are realistic stand-ins.)
export const DEMO: OverviewResult = {
  query: "What's the newest iPhone?",
  subQueries: [
    "newest iPhone model 2026",
    "latest iPhone release date",
    "current iPhone lineup announcement",
  ],
  sources: [
    {
      id: "s1",
      title: "Apple introduces iPhone 17",
      publisher: "Apple Newsroom",
      snippet: "Apple announced iPhone 17, iPhone 17 Air, 17 Pro and 17 Pro Max, available starting September 2025.",
      url: "https://www.apple.com/newsroom/",
    },
    {
      id: "s2",
      title: "The iPhone 17 lineup: everything Apple announced",
      publisher: "The Verge",
      snippet: "The iPhone 17 family arrives with a thinner new 'Air' model replacing the Plus, and a faster A19 chip.",
      url: "https://www.theverge.com/",
    },
    {
      id: "s3",
      title: "iPhone 17",
      publisher: "Wikipedia",
      snippet: "The iPhone 17 is the seventeenth generation of Apple's iPhone, announced September 9, 2025.",
      url: "https://en.wikipedia.org/wiki/IPhone_17",
    },
    {
      id: "s4",
      title: "iPhone 18: rumors and expected release",
      publisher: "MacRumors",
      snippet: "The iPhone 18 is expected in fall 2026; Apple has not announced it yet.",
      url: "https://www.macrumors.com/",
    },
  ],
  answer: [
    {
      kind: "para",
      lead: "The newest iPhone is the iPhone 17 lineup, announced in September 2025.",
      text: "",
      cites: ["s1", "s2"],
    },
    { kind: "heading", icon: "📱", text: "What's in the current lineup", cites: [] },
    {
      kind: "bullet",
      lead: "Four models:",
      text: "iPhone 17, iPhone 17 Air, iPhone 17 Pro and 17 Pro Max, with the new Air replacing the Plus.",
      cites: ["s2", "s3"],
    },
    {
      kind: "bullet",
      lead: "Next up:",
      text: "the iPhone 18 is expected around September 2026, but Apple hasn't announced it yet.",
      cites: ["s4"],
    },
  ],
  ungrounded: [
    {
      kind: "para",
      lead: "The newest iPhone is the iPhone 16 lineup, released in September 2024.",
      text: "",
      cites: [],
    },
    { kind: "heading", icon: "📱", text: "The current lineup", cites: [] },
    {
      kind: "bullet",
      lead: "Four models:",
      text: "iPhone 16, iPhone 16 Plus, iPhone 16 Pro and 16 Pro Max.",
      cites: [],
    },
    {
      kind: "bullet",
      lead: "Highlights:",
      text: "the A18 chip and the new Camera Control button across the range.",
      cites: [],
    },
  ],
};
