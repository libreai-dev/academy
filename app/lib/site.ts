// ============================================================================
// site.ts — profile data + editorial design tokens for xavier-ramirez.com
//
// The personal site chrome (header, footer, home, writing index) is a clean,
// light-only editorial layout. These constants keep it faithful to the design
// and independent of the lesson design-token system in globals.css (which the
// interactive lessons still use, unchanged).
// ============================================================================

/** Editorial palette (light-only, matches the exported design). */
export const C = {
  bg: "#ffffff",
  ink: "#16161a",
  body: "#232327",
  strong: "#2b2b2f",
  muted: "#4a4a50",
  faint: "#6c6c67",
  ghost: "#8f8f88",
  hair: "#e8e8e4",
  hairSoft: "#efefed",
  line: "#cfcfc9",
  chip: "#e0e0dc",
  wash: "#fafaf8",
  surface: "#f7f7f5",
} as const;

export const MONO =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
/** The exported design uses the platform system font stack (not the lessons'
 *  Instrument Sans) — matching it exactly is what keeps the type identical. */
export const SANS =
  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const MAXW = 1100;
export const PAGE_PAD = "0 clamp(20px, 5vw, 56px)";

export const PROFILE = {
  name: "Xavier Ramirez",
  shortName: "Xavi Ramirez",
  domain: "xavier-ramirez.com",
  role: "AI / ML Platform Engineer",
  tagline:
    "LLM systems, retrieval, evaluation and inference — in production, in regulated domains.",
  email: "me@xavier-ramirez.com",
  phone: "+1 (786) 562-0805",
  phoneHref: "tel:+17865620805",
  github: "https://github.com/xaviramirez",
  linkedin: "https://linkedin.com/in/xaviramirezcom",
  cv: "/xavi-ramirez-cv.pdf",
  location: "Miami, FL",
  // Rendered with the bold runs preserved (see Home). Each part is [text, bold?].
  about: [
    ["I build and operate LLM and ML systems in production. ", false],
    ["Thirteen years", true],
    [
      " of backend and platform engineering — Java, Spring Boot, Python, React, AWS — with the ",
      false,
    ],
    ["last four focused on applied AI in regulated insurance workflows", true],
    [".", false],
  ] as [string, boolean][],
  stack: [
    "Python · Flask · LangChain",
    "Java · Kotlin · Spring Boot",
    "RAG · evals",
    "AWS · ECS · Lambda · SQS · SNS · S3 · EC2 · Dynamo",
    "TS · JS · React",
  ],
  education:
    "B.Sc. Computer Science, Universidad de las Fuerzas Armadas (ESPE), Ecuador.",
} as const;

export interface Job {
  period: string;
  org: string;
  role: string;
  logo: string;
}

export const EXPERIENCE: Job[] = [
  {
    period: "2025 — PRESENT",
    org: "Dreamcode.io",
    role: "AI Platform Engineer",
    logo: "/img/logo-dreamcode.webp",
  },
  {
    period: "2023 — 2025",
    org: "Guidewire Software",
    role: "Senior Software Engineer, Submission Intake",
    logo: "/img/logo-guidewire.webp",
  },
  {
    period: "2021 — 2022",
    org: "Walmart",
    role: "Senior Software Engineer",
    logo: "/img/logo-walmart.webp",
  },
  {
    period: "2018 — 2021",
    org: "ScienceLogic",
    role: "Senior Software Engineer",
    logo: "/img/logo-sciencelogic.webp",
  },
  {
    period: "2010 — 2018",
    org: "LatAm Autos, Devsu, Espaciolink",
    role: "Software Engineer → Software Architect",
    logo: "/img/logo-earlier.webp",
  },
];

export interface Work {
  title: string;
  status: string;
  body: string;
  tags: string;
}

export const SELECTED_WORK: Work[] = [
  {
    title: "Retrieval architectures for insurance documents",
    status: "in progress",
    body: "A benchmark of chunking, retrieval and reranking strategies over public P&C corpora — NAIC bulletins, specimen policy forms, ACORD specifications — measuring groundedness, latency and cost per query.",
    tags: "Chunking · Reranking · Groundedness · Cost per query",
  },
  {
    title: "Role-based access control at retrieval time",
    status: "in progress",
    body: "A demonstration of why filtering restricted content after generation leaks, and why the filter belongs in the retrieval query. Includes an MCP server and an exportable audit trail.",
    tags: "RBAC · MCP server · Audit trail",
  },
];
