import Link from "next/link";
import { C, MONO, SANS, MAXW } from "../lib/site";
import CodeBlock from "./CodeBlock";
import EvalsViz from "./EvalsViz";

// "Your own AI Overview: Evals & guardrails" — Production series, post 06 and the
// closer. One threshold does two jobs: a runtime gate that abstains on thin
// evidence, and a CI gate that fails the build when groundedness regresses.
// Prose is inline (editorial layer); the live gate + OFF→ON screens are EvalsViz.

const CHIPS = [
  { n: "01", label: "Spine" },
  { n: "02", label: "Chunking" },
  { n: "03", label: "Retrieve & rerank" },
  { n: "04", label: "Access control" },
  { n: "05", label: "Grounding & citations" },
  { n: "06", label: "Evals & guardrails", active: true },
];

const GROUNDEDNESS_PY = `_SUPPORT_OVERLAP = 0.5  # a sentence is "supported" at ≥ this token overlap

def score_groundedness(answer_text: str, reranked: Sequence[Retrieved]) -> float:
    """Fraction of the answer's sentences its own sources actually back."""
    contexts = [_tokens(r.chunk.text) for r in reranked]
    contexts = [c for c in contexts if c]
    if not contexts:
        return 0.0  # nothing retrieved → nothing to stand on

    sentences = [s for s in _SENTENCE_SPLIT.split(answer_text.strip()) if s.strip()]
    checked = supported = 0
    for sentence in sentences:
        stoks = _tokens(sentence)
        if not stoks:
            continue                       # pure stopwords — nothing to verify
        checked += 1
        best = max(_overlap(stoks, ctx) for ctx in contexts)
        if best >= _SUPPORT_OVERLAP:
            supported += 1

    return supported / checked if checked else 0.0`;

const GATE_PY = `# 1. Screen the *context* (not the user's question) for injection payloads.
injection = any(screen_injection(r.chunk.text) for r in reranked)

# 2. Score groundedness of the model's answer against its context.
score = score_groundedness(answer.text, reranked)
answer.groundedness = score

reason = None
if injection:
    answer.abstained = True
    reason = "injection_in_context"
elif score < settings.groundedness_threshold:      # default 0.6, from config.py
    answer.abstained = True
    reason = "low_groundedness"

if answer.abstained:
    answer.text = _ABSTAIN_MESSAGE   # "I don't have enough grounded information…"
    answer.citations = []

# 3. Redact PII from whatever we are about to emit (safe message included).
answer.text = redact_pii(answer.text)`;

const SCREENS_PY = `_SSN = re.compile(r"\\b\\d{3}-\\d{2}-\\d{4}\\b")   # screened before phones

def redact_pii(text: str) -> str:
    text = _EMAIL.sub("[redacted-email]", text)
    text = _SSN.sub("[redacted-ssn]", text)      # SSN before phone: don't half-eat it
    text = _PHONE.sub("[redacted-phone]", text)
    return text

def screen_injection(text: str) -> bool:
    """True if the retrieved text looks like an instruction-override payload."""
    return any(pat.search(text) for pat in _INJECTION)`;

const AUDIT_PY = `@dataclass(slots=True)
class AuditRecord:
    timestamp: str            # ISO-8601 UTC
    user_id: str
    tenant: str
    env: str
    question: str
    retrieved_chunk_ids: list[str]   # ids only — never the passage text
    groundedness: float | None = None
    abstained: bool = False`;

const EVAL_PY = `# The intended shape — a pytest-style eval over known-good cases. The scorers and
# threshold are real today; the golden dataset + CI job land with the v6-evals tag.
def test_groundedness_gate(cases, pipeline, settings):
    scores = []
    for case in cases:                    # case = question + expected source
        answer = pipeline.invoke(case.question, role=case.role)
        if case.should_answer:
            assert not answer.abstained, f"{case.id} wrongly abstained"
            scores.append(answer.groundedness)
        else:                              # red-team case: it MUST abstain
            assert answer.abstained, f"{case.id} should have abstained"

    mean = sum(scores) / len(scores)
    assert mean >= settings.groundedness_threshold   # regression → build red`;

const CLONE_BASH = `git clone https://github.com/xaviramirez/own-overview
cd own-overview
git checkout v6-evals

pip install -e '.[local,evals,dev]'        # local models + ragas + pytest
PROVIDER=local python -m pytest tests/ -q   # the suite the eval cases plug into`;

const h2 = {
  margin: "56px 0 0",
  fontSize: "clamp(24px, 3vw, 32px)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: 1.15,
} as const;
const eyebrow = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--signal-fg)",
} as const;
const p = {
  margin: "14px 0 0",
  fontSize: 18,
  lineHeight: 1.7,
  color: C.body,
  maxWidth: "36em",
  textWrap: "pretty",
} as const;
const li = { margin: "10px 0 0", fontSize: 16.5, lineHeight: 1.6, color: C.body } as const;
const codeInline = { fontFamily: MONO, fontSize: "0.9em" } as const;

export default function AiEvals() {
  return (
    <main
      style={{
        maxWidth: MAXW,
        margin: "0 auto",
        padding: "0 clamp(20px, 5vw, 56px) 96px",
        fontFamily: SANS,
        color: C.ink,
      }}
    >
      <header style={{ padding: "clamp(40px, 7vh, 80px) 0 28px", borderBottom: `1px solid ${C.ink}` }}>
        <Link
          href="/writing/your-ai-overview-grounding"
          className="x-hoverink"
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}
        >
          ← Grounding &amp; citations
        </Link>
        <p style={{ margin: "22px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
          Your own AI Overview · 06
        </p>
        <h1 style={{ margin: "10px 0 0", fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 500, maxWidth: "18em" }}>
          Your own AI Overview: Evals &amp; guardrails
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: 19, lineHeight: 1.6, color: C.muted, maxWidth: "34em", textWrap: "pretty" }}>
          The groundedness gate between a demo and production.
        </p>
        <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.7, color: C.body, maxWidth: "36em", textWrap: "pretty" }}>
          A demo answers every question. A production system knows when <em>not</em> to. The
          last node in the graph scores how much of an answer its own sources actually
          support, screens the retrieved context for hijack attempts, and redacts stray
          identifiers — then abstains rather than guess. The twist: that same groundedness
          score is what an eval suite checks in CI, so a regression can&rsquo;t merge. Let&rsquo;s
          watch the gate open and close.
        </p>

        {/* pipeline chip grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "24px 0 0" }}>
          {CHIPS.map((c) => (
            <span
              key={c.n}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.03em",
                color: c.active ? "var(--signal-fg)" : C.ghost,
                border: `1px solid ${c.active ? "var(--signal-fg)" : C.chip}`,
                background: c.active ? "var(--signal-wash)" : "transparent",
                borderRadius: 999,
                padding: "5px 11px",
                fontWeight: c.active ? 600 : 400,
              }}
            >
              {c.n} · {c.label}
            </span>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.6, color: C.faint }}>
          ↳ The closer. One threshold, two jobs — a runtime gate on every answer and a CI
          gate on every release.
        </p>
      </header>

      <article style={{ margin: "8px 0 0" }}>
        {/* ── worked-example panel ── */}
        <div
          style={{
            margin: "28px 0 0",
            padding: "14px 18px",
            border: `1px solid ${C.hair}`,
            borderRadius: 12,
            background: C.surface,
            display: "flex",
            gap: 12,
            alignItems: "baseline",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--signal-fg)", whiteSpace: "nowrap" }}>
            Worked example
          </span>
          <span style={{ fontSize: 15, lineHeight: 1.6, color: C.body, maxWidth: "44em", textWrap: "pretty" }}>
            This series uses <strong>property &amp; casualty (P&amp;C) insurance</strong> as its
            running example — policies, claims and underwriting notes. The pipeline itself
            is domain-agnostic; the data just happens to be an insurer&rsquo;s.
          </span>
        </div>

        {/* ── NODE A — the gate ── */}
        <p style={{ ...eyebrow, margin: "48px 0 0" }}>The gate</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>One number decides: publish or abstain</h2>
        <p style={p}>
          Every answer gets a <strong>groundedness score</strong> — the fraction of its
          sentences that its own sources actually back — and a single threshold turns that
          score into a yes or a no.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>Groundedness is a fraction, not a vibe.</strong> Split the answer into
            sentences; a sentence counts as <em>supported</em> when enough of its content
            words appear in one retrieved passage. The score is supported ÷ checked.
          </li>
          <li style={li}>
            <strong>The threshold is the ship line.</strong>{" "}
            <code style={codeInline}>groundedness_threshold</code> defaults to <strong>0.6</strong>{" "}
            in <code style={codeInline}>config.py</code>. At or above it, the answer publishes
            cited; below it, the node abstains.
          </li>
          <li style={li}>
            <strong>Abstaining is the feature.</strong> In a regulated shop, &ldquo;I don&rsquo;t
            have enough grounded information&rdquo; beats a confident wrong answer that an
            underwriter might act on.
          </li>
          <li style={li}>
            <strong>Same score, two jobs.</strong> This exact number is what the eval suite
            measures in CI — the runtime gate and the release gate read the same dial.
          </li>
        </ul>

        <p style={{ ...p, margin: "22px 0 18px" }}>
          Drag the threshold. Watch each answer cross the line — above it publishes with
          citations, below it abstains.
        </p>
        <EvalsViz />

        <p style={{ ...p, margin: "22px 0 0" }}>
          The score itself is deliberately transparent — a lexical-overlap heuristic, no
          model call. It&rsquo;s fast, deterministic, and easy to defend in an audit; a
          production deploy swaps in an LLM-as-judge or RAGAS without changing the shape of
          the gate.
        </p>
        <CodeBlock code={GROUNDEDNESS_PY} lang="python" filename="own_overview/evals/groundedness.py" />
        <p style={{ ...p, margin: "18px 0 0" }}>
          And the runtime gate itself — screen, score, abstain-on-fail, redact — is one
          straight path:
        </p>
        <CodeBlock code={GATE_PY} lang="python" filename="own_overview/pipeline/nodes/guardrails.py" />

        {/* ── NODE B — evals in CI ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>Evals in CI</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>The same score, now gating the release</h2>
        <p style={p}>
          The gate that protects one answer at runtime also protects the whole release. Wire
          the groundedness scorer into a test suite over known-good cases, and a pull request
          that quietly makes retrieval worse turns the build red before it can merge.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>A case is a question plus the source it should stand on.</strong> e.g.
            &ldquo;Why did POL-55012&rsquo;s premium go up?&rdquo; → must cite the claim-88431
            record, must score grounded, must not abstain.
          </li>
          <li style={li}>
            <strong>The suite asserts on aggregate scores, not exact wording.</strong> Mean
            groundedness across the set must stay above the threshold; every answerable case
            must not abstain; every red-team case <em>must</em> abstain.
          </li>
          <li style={li}>
            <strong>A regression is a number going down.</strong> Change chunking, swap a
            reranker, tweak a prompt — if grounded answers stop clearing the bar, the
            assertion fails and CI blocks the merge.
          </li>
          <li style={li}>
            <strong>This is the demo-to-production line.</strong> Nobody hand-checks answers
            before each deploy; the eval does it, every commit, deterministically.
          </li>
        </ul>

        <div
          style={{
            margin: "22px 0 0",
            padding: "16px 18px",
            borderLeft: `2px solid var(--signal)`,
            background: "var(--signal-wash)",
            borderRadius: "0 10px 10px 0",
          }}
        >
          <div style={{ ...eyebrow, color: "var(--signal-fg)" }}>Honest about what ships today</div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.body, maxWidth: "44em", textWrap: "pretty" }}>
            The repo ships the scorers and the guardrails node (all real, quoted here) and
            declares <code style={codeInline}>ragas</code> under an optional{" "}
            <code style={codeInline}>evals</code> extra. The golden dataset and the CI job
            land with the <code style={codeInline}>v6-evals</code> tag — the snippet below is
            the standard, intended shape they plug into, not a file that already exists.
          </p>
        </div>
        <CodeBlock code={EVAL_PY} lang="python" filename="tests/test_evals.py" />

        {/* ── NODE C — injection & PII ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>Injection &amp; PII</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>Two cheap screens, one honest baseline</h2>
        <p style={p}>
          The company data you retrieve can carry a hijack payload, and a generated answer
          can echo a raw identifier — so screen the context and redact the output before
          anything ships. Both screens start <strong>OFF</strong> in the interactive above, so
          the attack and the leak land; switch each ON and watch the payload get caught and
          the identifiers masked.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>We screen the context, not the question.</strong> Retrieved records may
            include user-authored fields; a malicious note like &ldquo;ignore previous
            instructions…&rdquo; rides in through the <em>data</em>, so{" "}
            <code style={codeInline}>screen_injection</code> runs over the passages.
          </li>
          <li style={li}>
            <strong>A tripped screen abstains.</strong> If any retrieved passage looks like an
            instruction-override, the node doesn&rsquo;t trust an answer built on it — it drops
            the answer and returns the safe message.
          </li>
          <li style={li}>
            <strong>PII redaction is the last line.</strong> The real isolation is the
            access-control filter at retrieval. <code style={codeInline}>redact_pii</code> is a
            belt-and-suspenders mask on emails, SSN-like numbers and phones in whatever text
            actually leaves — a CCPA/GDPR requirement in insurance.
          </li>
          <li style={li}>
            <strong>Simple on purpose.</strong> These are transparent regex screens, not a
            trained classifier. They catch the common cases and are easy to audit; a
            production system layers a model on top.
          </li>
        </ul>
        <CodeBlock code={SCREENS_PY} lang="python" filename="own_overview/evals/guardrails.py" />

        {/* ── NODE D — the trail ── */}
        <p style={{ ...eyebrow, margin: "56px 0 0" }}>The trail</p>
        <h2 style={{ ...h2, margin: "8px 0 0" }}>Every verdict, written down</h2>
        <p style={p}>
          The final node records who asked what, over which tenant and environment, which
          chunks were used, the groundedness score, and whether the system answered or
          abstained — so any answer can be reconstructed after the fact.
        </p>
        <ul style={{ margin: "16px 0 0", paddingLeft: 22, maxWidth: "40em" }}>
          <li style={li}>
            <strong>One append-only line per query.</strong>{" "}
            <code style={codeInline}>audit/log.py</code> writes a JSON{" "}
            <code style={codeInline}>AuditRecord</code>; the log only ever grows (opened in
            append mode).
          </li>
          <li style={li}>
            <strong>A trail, not a second copy.</strong> It logs chunk <em>ids</em> and the
            score — never the answer text or passage contents — so the audit log isn&rsquo;t a
            leak of the sensitive data it&rsquo;s auditing.
          </li>
          <li style={li}>
            <strong>This is the governance story.</strong> &ldquo;Reconstruct any answer&rdquo;
            is what makes RAG defensible to a regulator; the shape is identical whether the
            sink is a local file or a CloudWatch / OpenSearch audit index.
          </li>
        </ul>
        <CodeBlock code={AUDIT_PY} lang="python" filename="own_overview/audit/log.py" />

        {/* ── clone this stage ── */}
        <div
          className="x-card"
          style={{ margin: "56px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
            Run it yourself · own-overview @ v6-evals
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.6, color: C.body, maxWidth: "46em", textWrap: "pretty" }}>
            The scorer in <code style={codeInline}>evals/groundedness.py</code>, the screens in{" "}
            <code style={codeInline}>evals/guardrails.py</code>, and the threshold in{" "}
            <code style={codeInline}>config.py</code> are the whole gate. Point it at your own
            cases and it becomes your release gate.
          </p>
          <CodeBlock code={CLONE_BASH} lang="bash" filename="terminal" />
          <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55, color: C.ghost, maxWidth: "46em" }}>
            Teaching-grade reference implementation, not a production insurance product. The
            groundedness default is a transparent lexical proxy with a clear upgrade path
            (LLM-judge / RAGAS); the <code style={codeInline}>v6-evals</code> tag is cut when the
            eval harness lands. MIT-licensed.
          </p>
        </div>

        {/* ── explain it back ── */}
        <h2 style={{ ...h2 }}>Explain it back</h2>
        <p style={p}>
          A pull request changes how documents are chunked. The change is subtle — answers
          still sound fluent. Why does the eval suite catch it when a human reviewer
          wouldn&rsquo;t, and what does the build do?
        </p>
        <details style={{ margin: "16px 0 0", maxWidth: "42em" }}>
          <summary style={{ fontFamily: MONO, fontSize: 13, color: "var(--signal-fg)", cursor: "pointer" }}>
            Reveal a model answer
          </summary>
          <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.7, color: C.body, textWrap: "pretty" }}>
            Chunking decides what ends up in a passage. Split a fact across two chunks and the
            sentence that states it no longer overlaps any single retrieved passage — so{" "}
            <code style={codeInline}>score_groundedness</code> drops for those cases, even
            though the wording still reads well. The eval suite scores the same known-good
            cases every commit and asserts the mean stays above the 0.6 threshold (and that
            answerable cases don&rsquo;t abstain). When the score falls below the line, the
            assertion fails and CI turns the build red, so the regression never merges. The
            reviewer sees fluent text and waves it through; the eval measures grounding and
            blocks it. That&rsquo;s the whole point of the gate — it&rsquo;s the same number that
            abstains at runtime, checked in CI.
          </p>
        </details>

        {/* ── FINAL bridge — closes the series ── */}
        <div
          className="x-card"
          style={{ margin: "48px 0 0", padding: "24px 26px", border: `1px solid ${C.hair}`, borderRadius: 14, background: C.bg }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
            That&rsquo;s the pipeline
          </div>
          <div style={{ margin: "8px 0 0", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>
            You&rsquo;ve built your own AI Overview
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.6, color: C.muted, maxWidth: "46em", textWrap: "pretty" }}>
            Six stages: a clonable spine, structure-aware chunking, retrieve-and-rerank,
            access control pushed into the query, grounded answers that cite their sources, and
            the eval-and-guardrail gate that decides whether any of it ships. The same
            retrieve → ground → cite machinery Google runs over the web — taken into a regulated
            insurer over private P&amp;C data in an S3 data lake, multi-tenant, access-controlled
            and auditable.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
            <a
              href="https://github.com/xaviramirez/own-overview"
              className="x-card"
              style={{ display: "block", flex: "1 1 260px", padding: "16px 18px", border: `1px solid ${C.hair}`, borderRadius: 12, background: C.surface, textDecoration: "none" }}
            >
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal-fg)" }}>
                → The repo
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.55, color: C.body, textWrap: "pretty" }}>
                Clone <code style={codeInline}>own-overview</code>, run it locally with zero
                cloud, and read every node.
              </p>
              <span className="x-hoverink" style={{ display: "inline-block", marginTop: 10, fontFamily: MONO, fontSize: 12, color: C.ink }}>
                github.com/xaviramirez/own-overview →
              </span>
            </a>
            <Link
              href="/writing/how-ai-overviews-work"
              className="x-card"
              style={{ display: "block", flex: "1 1 260px", padding: "16px 18px", border: `1px solid ${C.hair}`, borderRadius: 12, background: C.surface, textDecoration: "none" }}
            >
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
                → Back to the start
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.55, color: C.body, textWrap: "pretty" }}>
                New here? Start with how Google&rsquo;s AI Overview works — the black box this
                whole series opened.
              </p>
              <span className="x-hoverink" style={{ display: "inline-block", marginTop: 10, fontFamily: MONO, fontSize: 12, color: C.ink }}>
                Read the hook post →
              </span>
            </Link>
          </div>
        </div>
      </article>

      <nav style={{ marginTop: 64, paddingTop: 20, borderTop: `1px solid ${C.ink}`, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <Link href="/writing/your-ai-overview-grounding" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          ← Grounding &amp; citations
        </Link>
        <Link href="/writing" className="x-hoverink" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          All writing →
        </Link>
      </nav>
    </main>
  );
}
