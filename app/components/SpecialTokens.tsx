"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useAcademy } from "../providers";
import { MONO, DISPLAY, Cap, rich, useReducedMotion } from "./lesson-kit";
import { SceneShell, Toggle, ControlRow } from "./webscale-kit";
import {
  ROLE_FILL,
  type ChatMsg,
  type Role,
  DEFAULT_SYSTEM,
  DEFAULT_USER,
  DEFAULT_ASSISTANT,
  type TemplateId,
  TEMPLATES,
  renderTemplate,
  countControl,
  INSPECT_TOKENS,
  type InspectToken,
  reservedId,
  asPlainPieces,
} from "../lib/special-tokens";

/* ======================================================================== *
 * Diagram draw functions — one <svg> mount each, pure d3 (no JSX shapes).
 * Colour only via .style() so design tokens + theme flips resolve live.
 * viewBox width is kept small (420) so label text renders >=12px on phones.
 * ======================================================================== */

const W = 420; //        viewBox width kept small so labels stay >=12px on phones
const F = 19; //         body font (viewBox units) → ~13.5px on a 300px phone card
const SUB = 17; //       sub-line font (ids) → ~12.1px on a 300px phone card
const LF = 18; //        panel label / count font → ~12.9px
const CHAR = F * 0.6; //  monospace glyph advance estimate

/* --- Node 1: the conversation array (stacked role cards) ---------------- */

function drawList(el: SVGSVGElement, o: { msgs: ChatMsg[]; selected: Role; reduce: boolean }) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const cardX = 10;
  const cardW = W - 20;
  const cardH = 84;
  const gap = 16;
  const top = 8;
  const H = top + o.msgs.length * cardH + (o.msgs.length - 1) * gap + 14;
  svg.attr("viewBox", `0 0 ${W} ${H}`);

  o.msgs.forEach((m, i) => {
    const y = top + i * (cardH + gap);
    const sel = m.role === o.selected;
    const color = ROLE_FILL[m.role];

    const card = svg.append("g");
    if (!o.reduce) card.style("opacity", 0).transition().duration(220).delay(i * 60).style("opacity", 1);

    card.append("rect").attr("x", cardX).attr("y", y).attr("width", cardW).attr("height", cardH).attr("rx", 14)
      .style("fill", sel ? "var(--signal-wash)" : "var(--bg)")
      .style("stroke", sel ? "var(--signal)" : "var(--border)")
      .style("stroke-width", sel ? 2.5 : 1);

    // role pill (swatch dot + role name)
    const pillH = 30;
    const pillX = cardX + 18;
    const pillY = y + 14;
    const pillW = 24 + m.role.length * CHAR + 12;
    card.append("rect").attr("x", pillX).attr("y", pillY).attr("width", pillW).attr("height", pillH).attr("rx", 8)
      .style("fill", `color-mix(in srgb, ${color} 16%, transparent)`)
      .style("stroke", `color-mix(in srgb, ${color} 48%, var(--border))`).style("stroke-width", 1.4);
    card.append("rect").attr("x", pillX + 10).attr("y", pillY + pillH / 2 - 4).attr("width", 8).attr("height", 8).attr("rx", 2).style("fill", color);
    card.append("text").attr("x", pillX + 24).attr("y", pillY + pillH / 2 + 7).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", `${F}px`).text(m.role);

    // content line (muted when blank)
    card.append("text").attr("x", cardX + 18).attr("y", y + 68).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", `${F}px`).text(m.content);
  });
}

/* --- Node 2: array → template → one rendered string --------------------- */

function drawString(
  el: SVGSVGElement,
  o: { msgs: ChatMsg[]; tpl: TemplateId; showIds: boolean; reduce: boolean; headerLeft: string; headerRight: string; genLabel: string },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const spec = TEMPLATES[o.tpl];
  const segs = renderTemplate(o.msgs, spec, true);

  const x0 = 12;
  const maxX = W - 12;
  const lineH = o.showIds ? 52 : 40;

  // header: "N messages → 1 string"  |  "N reserved tokens"
  svg.append("text").attr("x", x0).attr("y", 22).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", `${F}px`).text(o.headerLeft);
  svg.append("text").attr("x", maxX).attr("y", 22).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", `${F}px`).text(o.headerRight);

  let x = x0;
  let ln = 42; // top of the current line
  const measure = (s: string) => s.length * CHAR;
  const wrapIf = (w: number) => { if (x > x0 && x + w > maxX) { x = x0; ln += lineH; } };

  const drawPill = (text: string, id?: number) => {
    const w = measure(text) + 16;
    wrapIf(w);
    const pillH = o.showIds ? 46 : 30;
    const py = ln + (lineH - pillH) / 2;
    svg.append("rect").attr("x", x).attr("y", py).attr("width", w).attr("height", pillH).attr("rx", 8)
      .style("fill", "color-mix(in srgb, var(--signal) 18%, transparent)").style("stroke", "var(--signal)").style("stroke-width", 1.4);
    if (o.showIds) {
      svg.append("text").attr("x", x + w / 2).attr("y", py + 20).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", `${F}px`).text(text);
      svg.append("text").attr("x", x + w / 2).attr("y", py + 40).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", `${SUB}px`).text(id != null ? `#${id}` : "");
    } else {
      svg.append("text").attr("x", x + w / 2).attr("y", py + pillH / 2 + 7).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", `${F}px`).text(text);
    }
    x += w + 6;
  };
  const drawRun = (text: string, color: string) => {
    const w = measure(text);
    wrapIf(w);
    svg.append("text").attr("x", x).attr("y", ln + lineH / 2 + 7).style("fill", color).style("font-family", MONO).style("font-size", `${F}px`).text(text);
    x += w + 2;
  };
  const drawContent = (text: string) => {
    const words = text.split(/\s+/).filter(Boolean);
    words.forEach((word) => {
      const w = measure(word);
      wrapIf(w);
      svg.append("text").attr("x", x).attr("y", ln + lineH / 2 + 7).style("fill", "var(--fg)").style("font-family", MONO).style("font-size", `${F}px`).text(word);
      x += w + CHAR;
    });
  };

  segs.forEach((s) => {
    if (s.kind === "nl") { x = x0; ln += lineH; }
    else if (s.kind === "special") drawPill(s.text, s.id);
    else if (s.kind === "role") drawRun(s.text, "var(--tok-sub)");
    else drawContent(s.text);
  });

  // the empty assistant opener trails with a "model writes here" cue
  x = x0;
  svg.append("text").attr("x", x0).attr("y", ln + lineH / 2 + 7).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", `${F}px`).style("font-style", "italic").text(o.genLabel);

  svg.attr("viewBox", `0 0 ${W} ${ln + lineH + 12}`);
}

/* --- Node 3: one delimiter, two ways (char pieces vs one reserved id) ---- */

function drawInspect(
  el: SVGSVGElement,
  o: { token: InspectToken; reduce: boolean; plainLabel: string; reservedLabel: string; tokensWord: string; oneToken: string },
) {
  const svg = d3.select<SVGSVGElement, unknown>(el);
  svg.selectAll("*").remove();
  const pieces = asPlainPieces(o.token);
  const id = reservedId(o.token);
  const ax = 10;
  const aw = W - 20;
  const startX = 26;
  const maxX = ax + aw - 16;
  const chipH = 34;

  // pre-layout the plain-text char chips (may wrap to a 2nd row)
  let px = startX;
  let prow = 0;
  let rows = 1;
  const pos = pieces.map((ch) => {
    const w = Math.max(28, ch.length * CHAR + 16);
    if (px > startX && px + w > maxX) { px = startX; prow += chipH + 8; rows++; }
    const p = { x: px, y: prow, w };
    px += w + 6;
    return p;
  });
  const ay = 10;
  const ah = 50 + rows * chipH + (rows - 1) * 8 + 14;

  // Panel A — as plain text
  svg.append("rect").attr("x", ax).attr("y", ay).attr("width", aw).attr("height", ah).attr("rx", 14).style("fill", "var(--surface)").style("stroke", "var(--border)");
  svg.append("text").attr("x", startX).attr("y", ay + 30).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", `${LF}px`).style("letter-spacing", ".06em").text(o.plainLabel);
  svg.append("text").attr("x", maxX).attr("y", ay + 30).attr("text-anchor", "end").style("fill", "var(--tok-byte)").style("font-family", MONO).style("font-size", `${LF}px`).text(`${pieces.length} ${o.tokensWord}`);
  const chipTop = ay + 50;
  pos.forEach((p, i) => {
    const g = svg.append("g").attr("transform", `translate(${p.x},${chipTop + p.y})`);
    if (!o.reduce) g.style("opacity", 0).transition().duration(200).delay(Math.min(i * 22, 320)).style("opacity", 1);
    g.append("rect").attr("width", p.w).attr("height", chipH).attr("rx", 8)
      .style("fill", "color-mix(in srgb, var(--tok-space) 16%, transparent)").style("stroke", "color-mix(in srgb, var(--tok-space) 44%, var(--border))").style("stroke-width", 1);
    g.append("text").attr("x", p.w / 2).attr("y", chipH / 2 + 7).attr("text-anchor", "middle").style("fill", "var(--fg)").style("font-family", MONO).style("font-size", `${F}px`).text(pieces[i]);
  });

  // Panel B — one reserved token
  const by = ay + ah + 16;
  const bh = 118;
  svg.append("rect").attr("x", ax).attr("y", by).attr("width", aw).attr("height", bh).attr("rx", 14).style("fill", "var(--surface)").style("stroke", "var(--border)");
  svg.append("text").attr("x", startX).attr("y", by + 30).style("fill", "var(--muted)").style("font-family", MONO).style("font-size", `${LF}px`).style("letter-spacing", ".06em").text(o.reservedLabel);
  svg.append("text").attr("x", maxX).attr("y", by + 30).attr("text-anchor", "end").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", `${LF}px`).text(o.oneToken);
  const rW = o.token.length * CHAR + 28;
  const rH = 56;
  const rX = startX;
  const rY = by + 46;
  const chip = svg.append("g");
  if (!o.reduce) chip.style("opacity", 0).transition().duration(240).delay(140).style("opacity", 1);
  chip.append("rect").attr("x", rX).attr("y", rY).attr("width", rW).attr("height", rH).attr("rx", 10)
    .style("fill", "color-mix(in srgb, var(--signal) 18%, transparent)").style("stroke", "var(--signal)").style("stroke-width", 1.6);
  chip.append("text").attr("x", rX + rW / 2).attr("y", rY + 23).attr("text-anchor", "middle").style("fill", "var(--signal-fg)").style("font-family", MONO).style("font-size", `${F}px`).text(o.token);
  chip.append("text").attr("x", rX + rW / 2).attr("y", rY + 45).attr("text-anchor", "middle").style("fill", "var(--muted)").style("font-family", MONO).style("font-size", `${SUB}px`).text(`#${id}`);

  svg.attr("viewBox", `0 0 ${W} ${by + bh + 10}`);
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

function useST() {
  const { t } = useAcademy();
  return t.specialTokens;
}

/* ---- Node 1: roles as data --------------------------------------------- */

function Node1({ reduce }: { reduce: boolean }) {
  const st = useST();
  const n = st.nodes[0];
  const roles: Role[] = ["system", "user", "assistant"];
  const msgs: ChatMsg[] = [
    { role: "system", content: DEFAULT_SYSTEM },
    { role: "user", content: DEFAULT_USER },
    { role: "assistant", content: DEFAULT_ASSISTANT },
  ];
  const [sel, setSel] = useState<Role>("system");
  const idx = roles.indexOf(sel);
  const manual = useRef(false);
  const pick = (r: Role) => { setSel(r); manual.current = true; };
  return (
    <SceneShell
      id="st-node-1" index={1} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setSel(roles[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {st.n1roles.map((lab, i) => (
            <Toggle key={i} on={sel === roles[i]} onClick={() => pick(roles[i])}>{lab}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawList(el, { msgs, selected: sel, reduce })} deps={[sel, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 2: the template ---------------------------------------------- */

function Node2({ reduce }: { reduce: boolean }) {
  const st = useST();
  const n = st.nodes[1];
  const tplIds: TemplateId[] = ["chatml", "llama3"];
  const [tpl, setTpl] = useState<TemplateId>("chatml");
  const [showIds, setShowIds] = useState(false);
  const [system, setSystem] = useState(DEFAULT_SYSTEM);
  const [user, setUser] = useState(DEFAULT_USER);
  const tplIdx = tplIds.indexOf(tpl);
  const msgs: ChatMsg[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  const control = countControl(renderTemplate(msgs, TEMPLATES[tpl], true));
  const headerLeft = `${msgs.length} ${st.n2msgsWord} → ${st.n2stringWord}`;
  const headerRight = `${control} ${st.n2piecesWord}`;
  return (
    <SceneShell
      id="st-node-2" index={2} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={1} captions={n.captions} hint={n.hint} reduce={reduce}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[tplIdx]}
      controls={
        <>
          <label htmlFor="st-system" style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{st.n2systemLabel}</label>
          <input id="st-system" value={system} onChange={(e) => setSystem(e.target.value)} suppressHydrationWarning className="u-textarea"
            style={{ width: "100%", fontFamily: MONO, fontSize: 13.5, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }} />
          <label htmlFor="st-user" style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--muted)" }}>{st.n2userLabel}</label>
          <input id="st-user" value={user} onChange={(e) => setUser(e.target.value)} suppressHydrationWarning className="u-textarea"
            style={{ width: "100%", fontFamily: MONO, fontSize: 13.5, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)" }} />
          <ControlRow>
            {st.n2templates.map((lab, i) => (
              <Toggle key={i} on={tpl === tplIds[i]} onClick={() => setTpl(tplIds[i])}>{lab}</Toggle>
            ))}
          </ControlRow>
          <Toggle on={showIds} onClick={() => setShowIds((v) => !v)}>{st.n2showIds}: {showIds ? "ON" : "OFF"}</Toggle>
        </>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawString(el, { msgs, tpl, showIds, reduce, headerLeft, headerRight, genLabel: st.n2genLabel })} deps={[system, user, tpl, showIds, reduce]} />}
    </SceneShell>
  );
}

/* ---- Node 3: one reserved id ------------------------------------------- */

function Node3({ reduce }: { reduce: boolean }) {
  const st = useST();
  const n = st.nodes[2];
  const tokens = INSPECT_TOKENS;
  const [tok, setTok] = useState<InspectToken>(tokens[0]);
  const idx = tokens.indexOf(tok);
  const manual = useRef(false);
  const pick = (tk: InspectToken) => { setTok(tk); manual.current = true; };
  return (
    <SceneShell
      id="st-node-3" index={3} total={3} eyebrow={n.eyebrow} title={n.title} intro={n.intro} bullets={n.bullets}
      cardLabel={n.cardLabel} aria={n.aria} steps={3} hideStepper captions={n.captions} hint={n.hint} reduce={reduce}
      onStep={(s) => { if (!manual.current) setTok(tokens[s]); manual.current = false; }}
      labelPrev="Previous step" labelNext="Next step" note={n.optionNotes?.[idx]}
      controls={
        <ControlRow>
          {tokens.map((tk) => (
            <Toggle key={tk} on={tok === tk} onClick={() => pick(tk)}>{tk}</Toggle>
          ))}
        </ControlRow>
      }
      readout={null}
    >
      {() => <DiagramSvg label={n.aria ?? ""} draw={(el) => drawInspect(el, { token: tok, reduce, plainLabel: st.n3plainLabel, reservedLabel: st.n3reservedLabel, tokensWord: st.n3tokensWord, oneToken: st.n3oneToken })} deps={[tok, reduce]} />}
    </SceneShell>
  );
}

/* ======================================================================== *
 * The lesson
 * ======================================================================== */

export default function SpecialTokens() {
  const { t, lang } = useAcademy();
  const st = t.specialTokens;
  const reduce = useReducedMotion();
  const [answerOpen, setAnswerOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(26px, 3vw, 40px) 20px 0" }}>
      {/* ---- Hero ---- */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--muted)" }}>{st.eyebrow}</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 7vw, 68px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.98, margin: "14px 0 0" }}>
          {st.title}
        </h1>
        <p style={{ margin: "18px 0 0", fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.55, color: "var(--muted)", textWrap: "pretty" }}>{st.lede}</p>

        {/* pipeline chips */}
        <div style={{ marginTop: "clamp(26px, 3vw, 36px)" }}>
          <Cap>{st.pipelineLabel}</Cap>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 8 }}>
            {st.pipeline.map((label, i) => (
              <a key={i} href={`#st-node-${i + 1}`} className="u-hover-fg-border"
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
        <Cap>{st.explainLabel}</Cap>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(19px, 2vw, 24px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25, marginTop: 12, textWrap: "balance" }}>{st.explainQ}</div>
        <button type="button" onClick={() => setAnswerOpen((v) => !v)} aria-expanded={answerOpen} className="u-hover-fg-border"
          style={{ appearance: "none", cursor: "pointer", font: "inherit", marginTop: 18, fontSize: 15, fontWeight: 600, color: "var(--fg)", background: "var(--bg)", border: "1px solid var(--border)", padding: "11px 18px", borderRadius: 11 }}>
          {answerOpen ? t.hide : t.reveal}
        </button>
        {answerOpen && <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, textWrap: "pretty", animation: reduce ? undefined : "rise .16s ease both" }}>{rich(st.explainA)}</p>}
      </div>

      {/* ---- Bridge ---- */}
      <div style={{ maxWidth: 760, margin: "16px auto 0", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px, 2.4vw, 28px)", background: "var(--band)", color: "var(--band-fg)" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--band-muted)" }}>{st.bridgeLabel}</div>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.6, color: "var(--band-fg)", textWrap: "pretty" }}>{rich(st.bridgeBody)}</p>
      </div>

      {/* ---- Nav ---- */}
      <div style={{ maxWidth: 760, margin: "clamp(26px, 3vw, 36px) auto 0", paddingTop: 24, borderTop: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingBottom: "clamp(40px, 5vw, 72px)" }}>
        <Link href="/stage/0/positional-encoding" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--muted)" }}>← {st.prevLesson}</Link>
        <Link href="/stage/0/multi-turn-formatting" className="u-hover-fg-border" style={{ fontSize: 15, fontWeight: 600, border: "1px solid var(--border)", padding: "12px 18px", borderRadius: 11, color: "var(--fg)" }}>{st.nextLesson} →</Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 40px", fontSize: 12.5, color: "var(--muted)", fontFamily: MONO }}>
        {lang === "es" ? "Idioma: Español" : "Language: English"}
      </div>
    </div>
  );
}
