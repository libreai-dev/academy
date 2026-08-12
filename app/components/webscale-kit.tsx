"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MONO, DISPLAY, rich } from "./lesson-kit";

/* ===========================================================================
   Shared chrome for the Web-scale ingestion lesson.

   The signature move is a *scroll-scrubbed live diagram*: each node is a tall
   section whose diagram card pins (position: sticky) and advances through N
   discrete steps as you scroll past it — and the same steps are reachable with
   the ‹ › stepper, so nothing depends on a mouse wheel (keyboard + touch + a
   reduced-motion path all work). Colour comes only from design tokens; the
   `--signal` green and the ink "readout" surface are defined in globals.css.
   =========================================================================== */

/** Scroll distance that advances one step — responsive to viewport height. */
function stepPx(): number {
  if (typeof window === "undefined") return 420;
  return Math.max(300, Math.min(520, window.innerHeight * 0.55));
}

/** Current sticky offset: sit just below the (variable-height) site header. */
function headerPin(): number {
  if (typeof document === "undefined") return 64;
  const h = document.querySelector("header");
  return (h ? h.getBoundingClientRect().height : 56) + 8;
}

/**
 * Drives one node's step. Two modes, chosen by measurement so the lesson is
 * responsive-first:
 *  - "scroll": the card fits under the header, so it pins (sticky) and scrubs
 *    through steps as you scroll — the desktop experience.
 *  - "manual": the card is taller than the viewport (phones, short windows), so
 *    pinning would push the readout below the fold. We DON'T pin; steps advance
 *    only via the ‹ › stepper. A single source of truth either way.
 * Starts in "manual" (SSR-safe, mobile-first) and upgrades after it measures.
 */
export function useSceneStep(steps: number) {
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"scroll" | "manual">("manual");
  const [pin, setPin] = useState(64);

  // Choose the mode from the actual card height vs. viewport.
  useEffect(() => {
    const recompute = () => {
      const card = cardRef.current;
      const p = headerPin();
      setPin(p);
      const fits = card ? card.getBoundingClientRect().height + p + 16 <= window.innerHeight : false;
      // Single-step nodes are always live (no scrub); only multi-step cards pin.
      setMode(steps > 1 && fits ? "scroll" : "manual");
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [steps]);

  // In scroll mode, derive the step from scroll position through the runway.
  useEffect(() => {
    if (mode !== "scroll") return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = runwayRef.current;
      if (!el) return;
      const y = pin - el.getBoundingClientRect().top;
      const next = Math.max(0, Math.min(steps - 1, Math.floor(y / stepPx())));
      setStep((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [mode, pin, steps]);

  const goTo = useCallback(
    (target: number, smooth: boolean) => {
      const t = Math.max(0, Math.min(steps - 1, target));
      if (mode === "manual") {
        setStep(t);
        return;
      }
      const el = runwayRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const y = top - pin + t * stepPx() + 6;
      window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
    },
    [mode, pin, steps],
  );

  return { runwayRef, cardRef, step, mode, pin, goTo };
}

/* --------------------------------------------------------------- stepper --- */

export function Stepper({
  step,
  steps,
  onGo,
  reduce,
  labelPrev,
  labelNext,
}: {
  step: number;
  steps: number;
  onGo: (n: number, smooth: boolean) => void;
  reduce: boolean;
  labelPrev: string;
  labelNext: string;
}) {
  const btn = (dir: -1 | 1, label: string, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => onGo(step + dir, !reduce)}
      className="u-hover-fg-border"
      style={{
        appearance: "none",
        cursor: disabled ? "default" : "pointer",
        font: "inherit",
        width: 44,
        height: 40,
        display: "grid",
        placeItems: "center",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--bg)",
        color: "var(--fg)",
        opacity: disabled ? 0.4 : 1,
        fontSize: 16,
      }}
    >
      {dir < 0 ? "‹" : "›"}
    </button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
      {btn(-1, labelPrev, step <= 0)}
      <span style={{ fontFamily: MONO, fontSize: 14, color: "var(--fg)", minWidth: 52, textAlign: "center" }} aria-live="polite">
        {step + 1} / {steps}
      </span>
      {btn(1, labelNext, step >= steps - 1)}
    </div>
  );
}

/* ------------------------------------------------------------ scene shell -- */

export interface SceneShellProps {
  index: number;
  total: number;
  eyebrow: string; //   "NODE 01 / 06"
  title: string;
  /** Legacy paragraphs (0.1b) — used when intro/bullets are absent. */
  concept?: string[];
  /** New scannable style (0.1a): a short intro + bullet takeaways. */
  intro?: string;
  bullets?: string[];
  cardLabel: string; //  single mono label for the interactive
  /** Legacy small label above the diagram (0.1b). Omit to de-duplicate. */
  frameLabel?: string;
  aria?: string; //       accessible name for the diagram
  /** 1 = live (no stepper); 2+ = stepped. Defaults to captions.length. */
  steps?: number;
  captions: string[];
  hint: string;
  reduce: boolean;
  labelPrev: string;
  labelNext: string;
  /** Optional content rendered above the interactive (callouts, panels). */
  aside?: React.ReactNode;
  controls: React.ReactNode;
  /** A plain-language line that explains the current control selection. */
  note?: React.ReactNode;
  readout: React.ReactNode;
  children: (step: number) => React.ReactNode;
  /** Fires when the step changes — lets a node scroll-cycle its own controls. */
  onStep?: (step: number) => void;
  /** Hide the ‹ › stepper even when multi-step (scroll/buttons drive it). */
  hideStepper?: boolean;
  id?: string;
}

export function SceneShell(props: SceneShellProps) {
  const steps = props.steps ?? props.captions.length;
  const { runwayRef, cardRef, step, mode, pin, goTo } = useSceneStep(steps);
  const scrub = mode === "scroll";
  const multi = steps > 1;
  const showStepper = multi && !props.hideStepper;
  const useBullets = props.intro != null || (props.bullets != null && props.bullets.length > 0);

  const onStep = props.onStep;
  useEffect(() => {
    onStep?.(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <section id={props.id} style={{ scrollMarginTop: pin }}>
      {/* Heading + concept (scannable bullets, or legacy paragraphs). */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", color: "var(--signal-fg)" }}>
          {props.eyebrow}
        </div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(27px, 4.4vw, 42px)", fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.05, margin: "12px 0 0", textWrap: "balance" }}>
          {props.title}
        </h2>
        {useBullets ? (
          <>
            {props.intro && (
              <p style={{ margin: "14px 0 0", fontSize: "clamp(16px, 1.9vw, 18px)", lineHeight: 1.6, color: "var(--muted)", textWrap: "pretty" }}>
                {rich(props.intro)}
              </p>
            )}
            {props.bullets && (
              <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {props.bullets.map((b, i) => {
                  // A bullet prefixed with two spaces renders as an indented sub-bullet.
                  const sub = b.startsWith("  ");
                  const text = sub ? b.slice(2) : b;
                  return (
                    <li key={i} style={{ display: "flex", gap: sub ? 9 : 11, alignItems: "flex-start", marginLeft: sub ? 22 : 0, fontSize: sub ? "clamp(14px, 1.6vw, 15.5px)" : "clamp(15px, 1.75vw, 16.5px)", lineHeight: 1.55, textWrap: "pretty" }}>
                      <span aria-hidden style={{ flex: "0 0 auto", width: sub ? 5 : 6, height: sub ? 5 : 6, borderRadius: sub ? "50%" : 2, border: sub ? "1.5px solid var(--signal)" : "none", background: sub ? "transparent" : "var(--signal)", marginTop: sub ? 8 : 9 }} />
                      <span>{rich(text)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {(props.concept ?? []).map((p, i) => (
              <p key={i} style={{ margin: 0, fontSize: "clamp(16px, 1.9vw, 18px)", lineHeight: 1.62, color: "var(--muted)", textWrap: "pretty" }}>
                {rich(p)}
              </p>
            ))}
          </div>
        )}
        {props.aside && <div style={{ marginTop: 18 }}>{props.aside}</div>}
      </div>

      <div ref={runwayRef} style={{ position: "relative", marginTop: "clamp(22px, 3vw, 34px)" }}>
        <div style={{ position: scrub ? "sticky" : "static", top: scrub ? pin : undefined, zIndex: 1 }}>
          <div ref={cardRef} style={{ maxWidth: 760, margin: "0 auto", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", background: "var(--bg)", boxShadow: "0 1px 0 var(--hair)" }}>
            {/* card header: single label (+ stepper only when multi-step) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "15px clamp(16px,2.4vw,22px)", borderBottom: "1px solid var(--hair)" }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".12em", color: "var(--muted)", lineHeight: 1.4 }}>
                {props.cardLabel}
              </span>
              {showStepper && <Stepper step={step} steps={steps} onGo={goTo} reduce={props.reduce} labelPrev={props.labelPrev} labelNext={props.labelNext} />}
            </div>

            {/* diagram (legacy frameLabel shown only when provided) */}
            <div style={{ padding: "clamp(14px,2.2vw,20px)" }} aria-label={props.aria ?? props.frameLabel ?? props.title} role="group">
              {props.frameLabel && (
                <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".12em", color: "var(--muted)", marginBottom: 10 }}>{props.frameLabel}</div>
              )}
              <div style={{ position: "relative", width: "100%" }}>{props.children(step)}</div>
            </div>

            {/* step caption (only when the stepper is shown) */}
            {showStepper && (
              <div style={{ padding: "12px clamp(16px,2.4vw,22px)", borderTop: "1px solid var(--hair)", background: "var(--surface)", fontFamily: MONO, fontSize: 13, color: "var(--fg)", lineHeight: 1.5, minHeight: 44 }} aria-live="polite">
                {props.captions[step]}
              </div>
            )}

            {/* try-it instruction, right by the controls, then controls → note → readout */}
            <div style={{ padding: "clamp(14px,2.2vw,20px)", display: "flex", flexDirection: "column", gap: 14, borderTop: showStepper ? "none" : "1px solid var(--hair)" }}>
              <p style={{ margin: 0, fontFamily: MONO, fontSize: 13, color: "var(--muted)", lineHeight: 1.55, textWrap: "pretty" }}>
                <span style={{ color: "var(--signal-fg)" }} aria-hidden>↳ </span>
                {props.hint}
              </p>
              {props.controls}
              {props.note && (
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--fg)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 13px", textWrap: "pretty" }}>
                  {props.note}
                </p>
              )}
              {props.readout}
            </div>
          </div>
        </div>
        {scrub && <div aria-hidden style={{ height: `calc(${steps} * clamp(300px, 55vh, 520px))` }} />}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- readout --- */

export interface ReadoutRow {
  k: string;
  v: string;
  hi?: boolean;
}

/** The ink "instrument" card — a terminal readout in both themes. `note` is a
 *  plain-language line under the metrics that says what the readout represents. */
export function Readout({ title, rows, note }: { title: string; rows: ReadoutRow[]; note?: string }) {
  return (
    <div
      role="status"
      style={{
        background: "var(--readout-bg)",
        border: "1px solid var(--readout-border)",
        borderRadius: 12,
        padding: "14px 16px",
        fontFamily: MONO,
        fontSize: 13,
        lineHeight: 1.7,
        color: "var(--readout-fg)",
      }}
    >
      <div style={{ color: "var(--readout-signal)", letterSpacing: ".08em", marginBottom: 4 }}>{title}</div>
      {rows.map((r) => (
        <div key={r.k} style={{ display: "flex", gap: 8 }}>
          <span style={{ color: "var(--readout-muted)", flex: "0 0 auto", minWidth: "9.5ch" }}>{r.k}</span>
          <span style={{ color: r.hi ? "var(--readout-signal)" : "var(--readout-fg)" }}>{r.v}</span>
        </div>
      ))}
      {note && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--readout-border)", color: "var(--readout-muted)", fontSize: 12, lineHeight: 1.55, letterSpacing: 0 }}>
          {note}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- callout --- */

/** A bordered explainer panel — for rich context (facts, a legal precedent). */
export function Callout({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderLeft: "3px solid var(--signal)", borderRadius: 12, padding: "14px 16px", background: "var(--surface)" }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".12em", color: "var(--signal-fg)" }}>{label}</div>
      {title && <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, letterSpacing: "-.02em", marginTop: 6 }}>{title}</div>}
      <div style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.6, color: "var(--fg)", textWrap: "pretty" }}>{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- deeper --- */

/** A collapsed "Go deeper" block for math/theory that shouldn't sit in the flow. */
export function Deeper({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "clamp(16px,2vw,20px)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ appearance: "none", border: 0, background: "transparent", font: "inherit", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, color: "var(--fg)", padding: 0 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 16.5, fontWeight: 600, letterSpacing: "-.02em" }}>{title}</span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ margin: "14px 0 0", fontSize: 15.5, lineHeight: 1.65, color: "var(--muted)", textWrap: "pretty" }}>{children}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- controls -- */

/** A pill toggle — green when active. */
export function Toggle({
  on,
  onClick,
  children,
  ariaLabel,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={ariaLabel}
      onClick={onClick}
      className="u-hover-fg-border"
      style={{
        appearance: "none",
        cursor: "pointer",
        font: "inherit",
        fontFamily: MONO,
        fontSize: 13,
        padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${on ? "var(--signal)" : "var(--border)"}`,
        background: on ? "var(--signal-wash)" : "var(--bg)",
        color: "var(--fg)",
        textAlign: "center",
        flex: "1 1 auto",
        minWidth: 0,
        transition: "border-color .15s ease, background .15s ease",
      }}
    >
      {children}
    </button>
  );
}

/** A row of toggles/segmented buttons that wraps on small screens. */
export function ControlRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>;
}

/** A labelled range slider with a live value readout. */
export function Slider({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
  id,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>
        <span>{label}</span>
        <span style={{ color: "var(--fg)" }}>{display}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        // Password managers / form-fillers inject attributes (e.g. __ncrunique)
        // onto controls before hydration; ignore that DOM diff.
        suppressHydrationWarning
        style={{ width: "100%", accentColor: "var(--signal)" }}
      />
    </div>
  );
}
