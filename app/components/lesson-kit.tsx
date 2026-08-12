"use client";

import { useEffect, useRef, useState } from "react";
import { showPiece, type Tok, type TokenKind } from "../lib/tokenizer";

/** Shared building blocks for lesson interactives — the primitives first proven
 *  in the Tokens lesson (reduced-motion gating, count-ups, colour-coded token
 *  chips, hero flow bands, stat readouts, inline emphasis), so every lesson
 *  looks and behaves the same. Colours come only from design tokens. */

export const MONO = "var(--font-jetbrains-mono),monospace";
export const DISPLAY = "var(--font-space-grotesk),sans-serif";

/** Colour token per kind — all defined in globals.css so both themes stay on-brand. */
export const KIND_COLOR: Record<TokenKind, string> = {
  word: "var(--tok-word)",
  sub: "var(--tok-sub)",
  num: "var(--tok-num)",
  punct: "var(--tok-punct)",
  space: "var(--tok-space)",
  byte: "var(--tok-byte)",
};

export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduce;
}

/** Smoothly count a number up to its new value (instant when reduced-motion). */
export function useCountUp(value: number, reduce: boolean): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const to = value;
    const start = performance.now();
    const dur = 460;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return display;
}

/** A small monospace caption/eyebrow label. */
export function Cap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", color: "var(--muted)" }}>{children}</div>
  );
}

/**
 * Minimal inline renderer so copy.ts strings can carry emphasis without
 * hardcoding markup in components. Supports:
 *   **bold**  *italic*  `code`  [link text](https://…)  {ring}
 * where `{ring}` renders the small signal-green circle that ties body copy to a
 * green threshold/accent in an interactive.
 */
export function rich(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\{ring\}|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] != null) {
      nodes.push(
        <a key={k++} href={m[2]} target="_blank" rel="noreferrer" style={{ color: "var(--signal-fg)", textDecoration: "underline", textUnderlineOffset: 2 }}>
          {m[1]}
        </a>,
      );
    } else if (m[0] === "{ring}") {
      nodes.push(
        <span key={k++} aria-hidden style={{ display: "inline-block", width: "0.62em", height: "0.62em", borderRadius: "50%", border: "2px solid var(--signal)", verticalAlign: "middle", margin: "0 0.12em", transform: "translateY(-1px)" }} />,
      );
    } else if (m[3] != null) {
      nodes.push(
        <strong key={k++} style={{ fontWeight: 700, color: "var(--fg)" }}>
          {rich(m[3])}
        </strong>,
      );
    } else if (m[4] != null) {
      nodes.push(<em key={k++}>{rich(m[4])}</em>);
    } else {
      nodes.push(
        <code
          key={k++}
          style={{ fontFamily: MONO, fontSize: "0.9em", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 5, padding: "1px 5px" }}
        >
          {m[5]}
        </code>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** A colour-coded token chip: decoded piece on top, integer id beneath. */
export function Chip({ tok, animate, i }: { tok: Tok; animate: boolean; i: number }) {
  const color = KIND_COLOR[tok.kind];
  return (
    <span
      title={`#${tok.id} · ${tok.kind}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 3,
        alignItems: "flex-start",
        padding: "6px 8px 5px",
        borderRadius: 9,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 38%, var(--border))`,
        animation: animate ? "rise .2s ease both" : undefined,
        animationDelay: animate ? `${Math.min(i * 30, 600)}ms` : undefined,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: 2, background: color, flex: "0 0 auto" }} />
        <span style={{ fontFamily: MONO, fontSize: 14, color: "var(--fg)", whiteSpace: "pre" }}>{showPiece(tok.piece)}</span>
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>{tok.id}</span>
    </span>
  );
}

/** A labelled stat readout (big number under a mono eyebrow). */
export function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: big ? 34 : 24, fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.05, color: "var(--fg)" }}>{value}</div>
    </div>
  );
}

/** One band of a vertical hero flow (label above, content below). */
export function FlowBand({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: "var(--muted)" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

/** The bobbing down-arrow between hero flow bands. */
export function FlowArrow({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
      <span className={reduce ? undefined : "tok-bob"} style={{ fontSize: 22, color: "var(--muted)", lineHeight: 1 }}>
        ↓
      </span>
    </div>
  );
}
