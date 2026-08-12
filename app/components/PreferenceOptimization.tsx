"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow, Slider, Deeper } from "./webscale-kit";
import { DPO_STEPS, pChosenAt, pct } from "../lib/preference-optimization";
import type { DpoPairCopy } from "../lib/copy/preference-optimization";

/* ======================================================================== *
 * Node 2 diagram — two probability bars, pure d3 into one <svg> mount.
 * viewBox is deliberately narrow (600) so every label clears the 12px floor
 * even when the card renders ~290px wide on a phone.
 * ======================================================================== */

function drawBars(
  el: SVGSVGElement,
  o: {
    pChosen: number; // 0..1
    startChosen: number; // 0..1 (the reference / start position)
    chosenLabel: string;
    rejectedLabel: string;
    startLabel: string;
  },
) {
  const W = 600;
  const H = 250;
  const svg = d3.select<SVGSVGElement, unknown>(el).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();

  const x0 = 150;
  const x1 = 490;
  const width = x1 - x0;
  const barH = 64;
  const rows = [
    { y: 44, p: o.pChosen, start: o.startChosen, label: o.chosenLabel, color: "var(--signal)" },
    { y: 150, p: 1 - o.pChosen, start: 1 - o.startChosen, label: o.rejectedLabel, color: "var(--tok-byte)" },
  ];

  rows.forEach((r, i) => {
    const cy = r.y + barH / 2;
    // left label
    svg.append("text").attr("x", 10).attr("y", cy + 9).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "28px").text(r.label);
    // track
    svg.append("rect").attr("x", x0).attr("y", r.y).attr("width", width).attr("height", barH).attr("rx", 10).style("fill", "var(--surface)").style("stroke", "var(--border)");
    // fill
    svg.append("rect").attr("x", x0).attr("y", r.y).attr("width", Math.max(2, r.p * width)).attr("height", barH).attr("rx", 10).style("fill", r.color);
    // percent value
    svg.append("text").attr("x", x1 + 12).attr("y", cy + 11).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", "34px").style("font-weight", "700").text(`${pct(r.p)}%`);
    // start marker (dashed) for this bar
    const sx = x0 + r.start * width;
    svg.append("line").attr("x1", sx).attr("y1", r.y - 6).attr("x2", sx).attr("y2", r.y + barH + 6).style("stroke", "var(--muted)").style("stroke-width", 2).style("stroke-dasharray", "4 6");
    if (i === 0) {
      svg.append("text").attr("x", sx).attr("y", r.y - 12).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", "26px").text(o.startLabel);
    }
  });
}

/* ======================================================================== *
 * Node 1 — the labelled pair (text-vs-text: HTML answer panels).
 * ======================================================================== */

function AnswerPanels({
  pair,
  pick,
  onPick,
  promptLabel,
  answerWord,
  prefer,
  chosenBadge,
  rejectedBadge,
}: {
  pair: DpoPairCopy;
  pick: "a" | "b" | null;
  onPick: (k: "a" | "b") => void;
  promptLabel: string;
  answerWord: string;
  prefer: string;
  chosenBadge: string;
  rejectedBadge: string;
}) {
  const panel = (k: "a" | "b", body: string) => {
    const chosen = pick === k;
    const rejected = pick != null && pick !== k;
    const color = chosen ? "var(--signal)" : rejected ? "var(--tok-byte)" : "var(--border)";
    const badge = chosen ? chosenBadge : rejected ? rejectedBadge : prefer;
    return (
      <button
        type="button"
        onClick={() => onPick(k)}
        aria-pressed={chosen}
        className="u-hover-fg-border"
        style={{
          appearance: "none",
          cursor: "pointer",
          font: "inherit",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          border: `1px solid ${color}`,
          background: chosen ? "var(--signal-wash)" : "var(--bg)",
          borderRadius: 14,
          padding: "14px 15px",
          opacity: rejected ? 0.62 : 1,
          transition: "border-color .15s ease, background .15s ease, opacity .15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: "var(--muted)" }}>
            {answerWord} {k.toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: ".1em",
              fontWeight: 700,
              color: chosen ? "var(--signal-fg)" : rejected ? "var(--tok-byte)" : "var(--muted)",
              border: `1px solid ${chosen ? "var(--signal)" : rejected ? "var(--tok-byte)" : "var(--border)"}`,
              borderRadius: 999,
              padding: "3px 9px",
            }}
          >
            {badge}
          </span>
        </div>
        <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--fg)", whiteSpace: "pre-wrap" }}>{body}</span>
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: "var(--muted)" }}>{k === "a" ? pair.tagA : pair.tagB}</span>
      </button>
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "13px 15px", background: "var(--surface)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: "var(--muted)" }}>{promptLabel}</div>
        <div style={{ marginTop: 6, fontSize: 16, lineHeight: 1.5, color: "var(--fg)", textWrap: "pretty" }}>{pair.prompt}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
        {panel("a", pair.answerA)}
        {panel("b", pair.answerB)}
      </div>
    </div>
  );
}

/* ======================================================================== *
 * Node 3 — RLHF vs DPO pipelines (side-by-side comparison cards, HTML).
 * ======================================================================== */

function PipelineCol({
  label,
  sub,
  steps,
  active,
  stagesWord,
}: {
  label: string;
  sub: string;
  steps: string[];
  active: boolean;
  stagesWord: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${active ? "var(--signal)" : "var(--border)"}`,
        background: active ? "var(--signal-wash)" : "var(--bg)",
        borderRadius: 14,
        padding: "16px 15px",
        opacity: active ? 1 : 0.6,
        transition: "border-color .15s ease, background .15s ease, opacity .15s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)" }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 11.5, color: active ? "var(--signal-fg)" : "var(--muted)", marginTop: 3 }}>{sub}</div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((s, i) => {
          const first = i === 0;
          const last = i === steps.length - 1;
          const highlight = active && !first && !last; // the work the routes differ on
          return (
            <div key={i}>
              {i > 0 && (
                <div aria-hidden style={{ display: "flex", justifyContent: "center", color: "var(--muted)", fontSize: 15, lineHeight: 1, padding: "5px 0" }}>↓</div>
              )}
              <div
                style={{
                  border: `1px solid ${last && active ? "var(--signal)" : "var(--border)"}`,
                  background: highlight ? "var(--surface)" : "var(--bg)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 13.5,
                  lineHeight: 1.4,
                  color: "var(--fg)",
                  fontFamily: first || last ? MONO : undefined,
                  fontWeight: first || last ? 600 : 400,
                }}
              >
                {s}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 12, color: active ? "var(--signal-fg)" : "var(--muted)", fontWeight: 700 }}>
        {steps.length} {stagesWord}
      </div>
    </div>
  );
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

function usePO() {
  const { t } = useAcademy();
  return t.preferenceOptimization;
}

/* ---- Node 1 ------------------------------------------------------------ */

function Node1({ reduce }: { reduce: boolean }) {
  const po = usePO();
  const n = po.nodes[0];
  const pairs = po.n1pairs;
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<"a" | "b" | null>(null);
  const pair = pairs[idx] ?? pairs[0];
  const manual = useRef(false);

  const setPreset = (i: number) => {
    setIdx(i);
    setPick(null);
    manual.current = true;
  };

  const note =
    pick == null ? po.n1untouched : pick === pair.better ? pair.note : po.n1flipNote;

  return (
    <SceneShell
      id="po-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={pairs.length} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) { setIdx(s); setPick(null); } manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <ControlRow>
          {pairs.map((p, i) => (
            <Toggle key={p.key} on={idx === i} onClick={() => setPreset(i)}>{p.label}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <AnswerPanels
          pair={pair}
          pick={pick}
          onPick={(k) => setPick(k)}
          promptLabel={po.n1promptLabel}
          answerWord={po.n1answerWord}
          prefer={po.n1prefer}
          chosenBadge={po.n1chosenBadge}
          rejectedBadge={po.n1rejectedBadge}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 2 ------------------------------------------------------------ */

function Node2({ reduce }: { reduce: boolean }) {
  const po = usePO();
  const n = po.nodes[1];
  const [step, setStep] = useState(0);
  const p = pChosenAt(step);
  const startP = pChosenAt(0);
  const note = step === 0 ? po.n2startNote : step >= DPO_STEPS ? po.n2doneNote : po.n2midNote;

  return (
    <SceneShell
      id="po-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={note}
      controls={
        <Slider id="po-updates" label={po.n2slider} value={step} display={`${step} / ${DPO_STEPS}`} min={0} max={DPO_STEPS} onChange={setStep} />
      }
      aside={<Deeper title={po.n2anchorTitle}>{rich(po.n2anchorBody)}</Deeper>}
      readout={null}
    >
      {() => (
        <DiagramSvg
          label={n.aria ?? ""}
          draw={(el) => drawBars(el, { pChosen: p, startChosen: startP, chosenLabel: po.n2chosenLabel, rejectedLabel: po.n2rejectedLabel, startLabel: po.n2startLabel })}
          deps={[step, reduce]}
        />
      )}
    </SceneShell>
  );
}

/* ---- Node 3 ------------------------------------------------------------ */

function Node3({ reduce }: { reduce: boolean }) {
  const po = usePO();
  const n = po.nodes[2];
  const [mode, setMode] = useState<"rlhf" | "dpo">("rlhf");
  const manual = useRef(false);
  const pick = (m: "rlhf" | "dpo") => { setMode(m); manual.current = true; };
  const idx = mode === "rlhf" ? 0 : 1;

  return (
    <SceneShell
      id="po-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={2} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setMode(s === 0 ? "rlhf" : "dpo"); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          <Toggle on={mode === "rlhf"} onClick={() => pick("rlhf")}>{po.n3runRlhf}</Toggle>
          <Toggle on={mode === "dpo"} onClick={() => pick("dpo")}>{po.n3runDpo}</Toggle>
        </ControlRow>
      }
      readout={null}
    >
      {() => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12, alignItems: "start" }}>
          <PipelineCol label={po.n3rlhfLabel} sub={po.n3rlhfSub} steps={po.n3rlhfSteps} active={mode === "rlhf"} stagesWord={po.n3stagesWord} />
          <PipelineCol label={po.n3dpoLabel} sub={po.n3dpoSub} steps={po.n3dpoSteps} active={mode === "dpo"} stagesWord={po.n3stagesWord} />
        </div>
      )}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function PreferenceOptimization() {
  const { t, lang } = useAcademy();
  const po = t.preferenceOptimization;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{po.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {po.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{rich(po.lede)}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{po.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 8 }}>
            {po.pipeline.map((label, i) => (
              <a key={i} href={`#po-node-${i + 1}`} className="u-hover-fg-border"
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

      {/* ---- Explain it back ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(40px,6vw,80px) auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(22px, 2.8vw, 32px)", background: "var(--surface)" }}>
        <Cap>{po.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{po.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(po.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{po.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(po.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/reward-modeling" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {po.prevLesson}</Link>
        <Link href="/stage/0/kv-cache" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{po.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
