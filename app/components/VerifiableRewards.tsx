"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Readout, Toggle, ControlRow, Callout, Deeper } from "./webscale-kit";
import {
  MATH_PROBLEM,
  CANDIDATES,
  verifyMath,
  type MathVerdict,
  SOLUTIONS,
  outcomeReward,
  processRewards,
  type Solution,
  TASK,
  VISIBLE_TESTS,
  HIDDEN_TESTS,
  SOLVERS,
  runVerifier,
  type Solver,
  type HackResult,
} from "../lib/verifiable-rewards";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * All colour via .style() so CSS design tokens resolve live across theme flips.
 * viewBox width is kept small (380) so label text renders ≥12px on phones.
 * ======================================================================== */

const OK = "var(--signal)";
const BAD = "var(--tok-byte)";

function fit(el: SVGSVGElement, h: number, w = 380) {
  d3.select(el).attr("viewBox", `0 0 ${w} ${h}`);
}

/** A bobbing / static down-arrow between stacked cards. */
function downArrow(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, cx: number, y: number) {
  svg.append("text").attr("x", cx).attr("y", y).attr("text-anchor", "middle")
    .style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "20px").text("↓");
}

/* --- Node 1: candidate → verifier → binary reward ----------------------- */

function drawVerify(
  el: SVGSVGElement,
  o: { raw: string; verdict: MathVerdict; reduce: boolean; labels: { cand: string; verifier: string; gold: string; got: string; reward: string; pass: string; fail: string } },
) {
  const W = 380;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const cx = W / 2;
  const color = o.verdict.matched ? OK : BAD;

  // 1) candidate card
  svg.append("text").attr("x", 30).attr("y", 16).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13.5px").text(o.labels.cand);
  svg.append("rect").attr("x", 30).attr("y", 22).attr("width", 320).attr("height", 52).attr("rx", 12)
    .style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
  svg.append("text").attr("x", cx).attr("y", 54).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "17px").text(o.raw);

  downArrow(svg, cx, 96);

  // 2) the verifier — extract, compare to gold, verdict badge
  const vy = 106;
  svg.append("rect").attr("x", 30).attr("y", vy).attr("width", 320).attr("height", 128).attr("rx", 14)
    .style("fill", "var(--bg)").style("stroke", "var(--fg)").style("stroke-width", 1.5);
  svg.append("text").attr("x", cx).attr("y", vy + 24).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "15px").style("letter-spacing", "0.1em").text(o.labels.verifier);
  const row = (label: string, val: string, ry: number, hi = false) => {
    svg.append("text").attr("x", 54).attr("y", ry).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "16px").text(label);
    svg.append("text").attr("x", 326).attr("y", ry).attr("text-anchor", "end").style("fill", hi ? "var(--fg)" : "var(--fg)").style("font-family", MONO).style("font-size", "16px").style("font-weight", hi ? 700 : 400).text(val);
  };
  row(o.labels.got, o.verdict.extracted === null ? "—" : String(o.verdict.extracted), vy + 56, true);
  row(o.labels.gold, String(o.verdict.gold), vy + 82);
  // verdict badge
  svg.append("rect").attr("x", 118).attr("y", vy + 96).attr("width", 144).attr("height", 24).attr("rx", 12)
    .style("fill", `color-mix(in srgb, ${color} 16%, transparent)`).style("stroke", color).style("stroke-width", 1.2);
  svg.append("text").attr("x", cx).attr("y", vy + 113).attr("text-anchor", "middle").style("fill", color).style("font-family", MONO).style("font-size", "14px").style("font-weight", 700).text(o.verdict.matched ? o.labels.pass : o.labels.fail);

  downArrow(svg, cx, 256);

  // 3) the binary reward
  const ry = 268;
  svg.append("rect").attr("x", 110).attr("y", ry).attr("width", 160).attr("height", 66).attr("rx", 14)
    .style("fill", `color-mix(in srgb, ${color} 14%, transparent)`).style("stroke", color).style("stroke-width", 1.5);
  svg.append("text").attr("x", 150).attr("y", ry + 47).attr("text-anchor", "middle").style("fill", color).style("font-family", DISPLAY).style("font-size", "42px").style("font-weight", 700).text(o.verdict.matched ? "1" : "0");
  svg.append("text").attr("x", 236).attr("y", ry + 41).attr("text-anchor", "middle").style("fill", color).style("font-family", MONO).style("font-size", "14px").style("letter-spacing", "0.08em").text(o.labels.reward);

  fit(el, 348);
}

/* --- Node 2: outcome (ORM) vs process (PRM), same solution, side by side - */

function drawGrade(
  el: SVGSVGElement,
  o: { sol: Solution; reduce: boolean; labels: { orm: string; ormSub: string; prm: string; prmSub: string; reward: string } },
) {
  const W = 380;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const gap = 12;
  const colW = (W - 10 - 10 - gap) / 2;
  const x1 = 10;
  const x2 = 10 + colW + gap;
  const ormR = outcomeReward(o.sol);
  const prm = processRewards(o.sol);
  const steps = o.sol.steps;

  const header = (x: number, title: string, sub: string) => {
    svg.append("text").attr("x", x + 12).attr("y", 22).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "15px").style("font-weight", 700).style("letter-spacing", "0.04em").text(title);
    svg.append("text").attr("x", x + 12).attr("y", 40).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13.5px").text(sub);
  };
  header(x1, o.labels.orm, o.labels.ormSub);
  header(x2, o.labels.prm, o.labels.prmSub);

  // column frames
  const rowsTop = 54;
  const rowH = 40;
  const colH = rowsTop + steps.length * rowH + 8;
  [x1, x2].forEach((x) => {
    svg.append("rect").attr("x", x).attr("y", rowsTop - 6).attr("width", colW).attr("height", steps.length * rowH + 12).attr("rx", 12).style("fill", "none").style("stroke", "var(--hair)").style("stroke-width", 1);
  });

  const stepRow = (x: number, i: number, marker: "neutral" | "ok" | "bad") => {
    const cy = rowsTop + i * rowH + rowH / 2;
    const mColor = marker === "ok" ? OK : marker === "bad" ? BAD : "var(--muted)";
    // marker glyph
    svg.append("text").attr("x", x + 16).attr("y", cy + 6).attr("text-anchor", "middle").style("fill", mColor).style("font-family", MONO).style("font-size", "17px").style("font-weight", 700)
      .text(marker === "ok" ? "✓" : marker === "bad" ? "✕" : "·");
    // step expression
    svg.append("text").attr("x", x + 34).attr("y", cy + 6).style("fill", marker === "neutral" ? "var(--muted)" : "var(--fg)").style("font-family", MONO).style("font-size", "15px").text(steps[i].expr);
  };

  steps.forEach((s, i) => {
    const isFinal = i === steps.length - 1;
    // ORM: intermediate steps are ungraded (neutral); only the final answer is
    // judged, and its verdict is what the whole solution is paid on.
    stepRow(x1, i, isFinal ? (o.sol.finalOk ? "ok" : "bad") : "neutral");
    // PRM: every step judged on its own.
    stepRow(x2, i, s.ok ? "ok" : "bad");
  });

  // footer reward strips
  const fy = colH + 6;
  const fh = 42;
  // ORM: one payout, covers every step
  const ormColor = ormR ? OK : BAD;
  svg.append("rect").attr("x", x1).attr("y", fy).attr("width", colW).attr("height", fh).attr("rx", 12)
    .style("fill", ormR ? "var(--signal-wash)" : `color-mix(in srgb, ${BAD} 12%, transparent)`).style("stroke", ormColor).style("stroke-width", 1.3);
  svg.append("text").attr("x", x1 + colW / 2).attr("y", fy + 27).attr("text-anchor", "middle").style("fill", ormColor).style("font-family", MONO).style("font-size", "15px").style("font-weight", 700).text(`${ormR} ${o.labels.reward}`);

  // PRM: one reward per step, drawn as a row of small chips
  svg.append("rect").attr("x", x2).attr("y", fy).attr("width", colW).attr("height", fh).attr("rx", 12).style("fill", "var(--surface)").style("stroke", "var(--border)").style("stroke-width", 1);
  const chipW = 22;
  const chipGap = 6;
  const totalW = prm.length * chipW + (prm.length - 1) * chipGap;
  let cxp = x2 + (colW - totalW) / 2;
  prm.forEach((r) => {
    const c = r ? OK : BAD;
    svg.append("rect").attr("x", cxp).attr("y", fy + 10).attr("width", chipW).attr("height", 22).attr("rx", 6).style("fill", `color-mix(in srgb, ${c} 18%, transparent)`).style("stroke", c).style("stroke-width", 1.2);
    svg.append("text").attr("x", cxp + chipW / 2).attr("y", fy + 26).attr("text-anchor", "middle").style("fill", c).style("font-family", MONO).style("font-size", "14px").style("font-weight", 700).text(String(r));
    cxp += chipW + chipGap;
  });

  fit(el, fy + fh + 12);
}

/* --- Node 3: solver → visible tests → hidden tests → verdict ------------- */

function drawHack(
  el: SVGSVGElement,
  o: {
    solver: Solver;
    guard: boolean;
    result: HackResult;
    reduce: boolean;
    labels: { solver: string; visible: string; hidden: string; hiddenOff: string; reward: string; gamed: string; caught: string; solved: string };
  },
) {
  const W = 380;
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const cx = W / 2;

  // 1) the solver source
  svg.append("text").attr("x", 12).attr("y", 16).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13.5px").text(`${o.labels.solver} · ${TASK}`);
  const codeTop = 24;
  const lineH = 19;
  const codeH = o.solver.code.length * lineH + 18;
  svg.append("rect").attr("x", 10).attr("y", codeTop).attr("width", 360).attr("height", codeH).attr("rx", 12).style("fill", "var(--readout-bg)").style("stroke", "var(--readout-border)").style("stroke-width", 1);
  o.solver.code.forEach((ln, i) => {
    svg.append("text").attr("x", 24).attr("y", codeTop + 26 + i * lineH).style("fill", o.solver.hack ? "#f2c9c9" : "var(--readout-fg)").style("font-family", MONO).style("font-size", "15px").style("white-space", "pre").text(ln);
  });

  let y = codeTop + codeH;
  downArrow(svg, cx, y + 20);
  y += 34;

  // 2) a test panel (title + rows with pass/fail marks)
  const testPanel = (title: string, tests: string[], active: boolean, allPass: boolean, dim: boolean, offNote?: string) => {
    const rows = tests.length;
    const panelH = 30 + rows * 22 + 8;
    const stroke = dim ? "var(--border)" : allPass ? OK : BAD;
    const grp = svg.append("g").style("opacity", dim ? 0.5 : 1);
    grp.append("rect").attr("x", 10).attr("y", y).attr("width", 360).attr("height", panelH).attr("rx", 12).style("fill", "var(--surface)").style("stroke", stroke).style("stroke-width", 1.3);
    grp.append("text").attr("x", 24).attr("y", y + 22).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "14.5px").style("font-weight", 700).text(title);
    if (offNote) {
      grp.append("text").attr("x", 346).attr("y", y + 22).attr("text-anchor", "end").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "13.5px").text(offNote);
    }
    tests.forEach((tst, i) => {
      const ry = y + 44 + i * 22;
      const pass = allPass; // in this lesson each set passes or fails as a whole for the shown solver
      const mark = dim ? "·" : pass ? "✓" : "✕";
      const mColor = dim ? "var(--muted)" : pass ? OK : BAD;
      grp.append("text").attr("x", 26).attr("y", ry).attr("text-anchor", "middle").style("fill", mColor).style("font-family", MONO).style("font-size", "15px").style("font-weight", 700).text(mark);
      grp.append("text").attr("x", 42).attr("y", ry).style("fill", dim ? "var(--muted)" : "var(--fg)").style("font-family", MONO).style("font-size", "15px").text(tst);
    });
    y += panelH;
  };

  testPanel(o.labels.visible, VISIBLE_TESTS, true, o.result.passVisible, false);
  downArrow(svg, cx, y + 20);
  y += 34;
  testPanel(o.labels.hidden, HIDDEN_TESTS, o.guard, o.result.passHidden, !o.guard, o.guard ? undefined : o.labels.hiddenOff);

  downArrow(svg, cx, y + 20);
  y += 34;

  // 3) verdict
  const v = o.result.verdict;
  const vColor = v === "solved" ? OK : v === "gamed" ? "var(--tok-sub)" : BAD;
  const vText = v === "solved" ? o.labels.solved : v === "gamed" ? o.labels.gamed : o.labels.caught;
  svg.append("rect").attr("x", 10).attr("y", y).attr("width", 360).attr("height", 60).attr("rx", 14)
    .style("fill", `color-mix(in srgb, ${vColor} 14%, transparent)`).style("stroke", vColor).style("stroke-width", 1.5);
  svg.append("text").attr("x", 40).attr("y", y + 40).attr("text-anchor", "middle").style("fill", vColor).style("font-family", DISPLAY).style("font-size", "30px").style("font-weight", 700).text(String(o.result.reward));
  svg.append("text").attr("x", 66).attr("y", y + 26).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "12.5px").style("letter-spacing", "0.08em").text(o.labels.reward);
  svg.append("text").attr("x", 66).attr("y", y + 45).style("fill", vColor).style("font-family", MONO).style("font-size", "14.5px").style("font-weight", 700).text(vText);
  y += 60;

  fit(el, y + 12);
}

/* ======================================================================== *
 * Diagram mount + node components
 * ======================================================================== */

function DiagramSvg({ draw, deps, label }: { draw: (el: SVGSVGElement) => void; deps: unknown[]; label: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const { lang } = useAcademy();
  useEffect(() => {
    if (ref.current) draw(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, lang]);
  return <svg ref={ref} role="img" aria-label={label} style={{ width: "100%", height: "auto", display: "block" }} />;
}

function useVR() {
  const { t } = useAcademy();
  return t.verifiableRewards;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const vr = useVR();
  const n = vr.nodes[0];
  const [idx, setIdx] = useState(0); // default: free text — shows extraction
  const manual = useRef(false);
  const cand = CANDIDATES[idx];
  const verdict = verifyMath(cand.raw);
  const pick = (i: number) => { setIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="vr-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={CANDIDATES.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={
        <div style={{ fontFamily: MONO, fontSize: 13.5, color: "var(--muted)" }}>
          {vr.n1problemLabel}: <span style={{ color: "var(--fg)", fontWeight: 700 }}>{MATH_PROBLEM}</span>
        </div>
      }
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>{vr.n1candidateLabel}</div>
          <ControlRow>
            {vr.n1candidates.map((lab, i) => (
              <Toggle key={i} on={idx === i} onClick={() => pick(i)}>{lab}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawVerify(el, { raw: cand.raw, verdict, reduce, labels: { cand: vr.n1candidateLabel, verifier: vr.n1verifierLabel, gold: vr.n1goldRow, got: vr.n1gotRow, reward: vr.n1rewardWord, pass: vr.n1passWord, fail: vr.n1failWord } })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const vr = useVR();
  const n = vr.nodes[1];
  const [idx, setIdx] = useState(0);
  const manual = useRef(false);
  const sol = SOLUTIONS[idx];
  const ormR = outcomeReward(sol);
  const prm = processRewards(sol);
  const prmStr = prm.join("·");
  const pick = (i: number) => { setIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="vr-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={SOLUTIONS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>{vr.n2solutionLabel}</div>
          <ControlRow>
            {vr.n2solutions.map((lab, i) => (
              <Toggle key={i} on={idx === i} onClick={() => pick(i)}>{lab}</Toggle>
            ))}
          </ControlRow>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} rows={[
          { k: n.rows[0], v: `${ormR}`, hi: ormR === 1 },
          { k: n.rows[1], v: prmStr },
          { k: n.rows[2], v: sol.finalOk ? "x = 5 ✓" : "✕" },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawGrade(el, { sol, reduce, labels: { orm: vr.n2ormTitle, ormSub: vr.n2ormSub, prm: vr.n2prmTitle, prmSub: vr.n2prmSub, reward: vr.n2rewardWord } })}
          deps={[idx, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const vr = useVR();
  const n = vr.nodes[2];
  const [idx, setIdx] = useState(0); // default: hardcode — the interesting hack
  const [guard, setGuard] = useState(false); // off by default: let the hack land
  const manual = useRef(false);
  const solver = SOLVERS[idx];
  const result = runVerifier(solver, guard);
  const pick = (i: number) => { setIdx(i); manual.current = true; };
  return (
    <SceneShell
      id="vr-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={SOLVERS.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setIdx(s); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      aside={<Callout label={vr.n3guardLabel} title={vr.n3calloutTitle}>{rich(n.bullets?.[2] ?? "")}</Callout>}
      controls={
        <>
          <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--muted)" }}>{vr.n3solverLabel}</div>
          <ControlRow>
            {vr.n3solvers.map((lab, i) => (
              <Toggle key={i} on={idx === i} onClick={() => pick(i)}>{lab}</Toggle>
            ))}
          </ControlRow>
          <Toggle on={guard} onClick={() => { setGuard((v) => !v); manual.current = true; }}>{vr.n3guardLabel}: {guard ? "ON" : "OFF"}</Toggle>
        </>
      }
      readout={
        <Readout title={n.readoutTitle} rows={[
          { k: n.rows[0], v: result.passVisible ? "pass" : "fail", hi: result.passVisible },
          { k: n.rows[1], v: guard ? (result.passHidden ? "pass" : "fail") : "—" },
          { k: n.rows[2], v: `${result.reward}`, hi: result.reward === 1 && result.verdict === "solved" },
        ]} />
      }
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawHack(el, { solver, guard, result, reduce, labels: { solver: vr.n3solverLabel, visible: vr.n3visibleTitle, hidden: vr.n3hiddenTitle, hiddenOff: vr.n3hiddenOff, reward: vr.n3rewardWord, gamed: vr.n3verdictGamed, caught: vr.n3verdictCaught, solved: vr.n3verdictSolved } })}
          deps={[idx, guard, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function VerifiableRewards() {
  const { t, lang } = useAcademy();
  const vr = t.verifiableRewards;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{vr.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {vr.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{vr.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{vr.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {vr.pipeline.map((label, i) => (
              <a key={i} href={`#vr-node-${i + 1}`} className="u-hover-fg-border"
                style={{ display: "flex", gap: 9, alignItems: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontFamily: MONO, fontSize: 13, color: "var(--fg)" }}>
                <span style={{ color: "var(--signal-fg)", flex: "0 0 auto" }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Nodes ---- */}
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(40px, 6vw, 80px)", marginTop: "clamp(40px, 6vw, 80px)" }}>
        <Node1 reduce={reduce} />
        <Node2 reduce={reduce} />
        <Node3 reduce={reduce} />
      </div>

      {/* ---- Go deeper ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0" }}>
        <Deeper title={lang === "es" ? "Más a fondo: la recompensa que se optimiza" : "Go deeper: the reward that gets optimised"}>
          {rich(
            lang === "es"
              ? "En RLVR el modelo maximiza la recompensa esperada `E[r(x)]`, donde `r` es 1 si el verificador acepta y 0 si no. Como `r` es binario y disperso, se combina con estimación de ventaja (por ejemplo GRPO, la lección anterior) para convertir muchos intentos por problema en un gradiente. El PRM cambia `r` de un escalar al final a una suma de recompensas por paso `Σ rₜ`, lo que reduce la varianza del gradiente. El riesgo de trampa es formal: el modelo optimiza `r`, no la tarea, así que cualquier hueco entre \"pasa el verificador\" y \"resuelve el problema\" se explota — y por eso las pruebas ocultas y la cobertura importan tanto como la señal misma."
              : "In RLVR the model maximises expected reward `E[r(x)]`, where `r` is 1 if the verifier accepts and 0 otherwise. Because `r` is binary and sparse, it's paired with an advantage estimator (e.g. GRPO, the previous lesson) that turns many attempts per problem into a usable gradient. A PRM changes `r` from a single scalar at the end to a sum of per-step rewards `Σ rₜ`, which lowers gradient variance. The hacking risk is formal, not incidental: the model optimises `r`, not the task, so any gap between \"passes the verifier\" and \"solves the problem\" gets exploited — which is why held-out tests and coverage matter as much as the signal itself.",
          )}
        </Deeper>
      </div>

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{vr.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{vr.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(vr.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{vr.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(vr.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/grpo" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {vr.prevLesson}</Link>
        <Link href="/stage/0/kv-cache" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{vr.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
