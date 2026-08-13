"use client";

// AccessViz — THE LEAK DEMO. A small fixed document store, a role selector
// (Adjuster / Underwriter / Broker) and a "Filter at retrieval: ON / OFF"
// toggle. With the filter ON, only documents whose tenant AND role match the
// caller reach the model. With it OFF, the model retrieves *everything* and is
// merely asked to hide the restricted parts — so an underwriting risk memo
// (a role leak) and another insurer's claim (a cross-tenant leak) ride straight
// into the answer. Defaults to Broker + OFF so the leak lands first.
//
// One empty <svg> is the d3 mount; the flow (docs → retrieve gate → model) is
// drawn per state. A single semantic red is used ONLY for the leak UI.

import * as d3 from "d3";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { C, MONO, SANS } from "../lib/site";

// The one caller tenant for this demo. Everything else is a different tenant.
const TENANT = "acme-insurance";

// A single semantic red, used ONLY to mark a leak (never for anything else).
const LEAK = "#b42318";

type Role = "adjuster" | "underwriter" | "broker";
const ROLES: { id: Role; label: string }[] = [
  { id: "adjuster", label: "Adjuster" },
  { id: "underwriter", label: "Underwriter" },
  { id: "broker", label: "Broker" },
];

type Doc = {
  id: string;
  label: string;
  kind: string;
  tenant: string;
  roles: Role[];
  tenantLabel: string;
};

// Fixed store — the same four documents the rest of the series uses.
const STORE: Doc[] = [
  { id: "POL-55012", label: "POL-55012", kind: "policy", tenant: TENANT, roles: ["adjuster", "underwriter", "broker"], tenantLabel: "acme" },
  { id: "88431", label: "Claim 88431", kind: "claim", tenant: TENANT, roles: ["adjuster", "underwriter"], tenantLabel: "acme" },
  { id: "memo", label: "Risk memo", kind: "underwriting", tenant: TENANT, roles: ["underwriter"], tenantLabel: "acme" },
  { id: "71120", label: "Claim 71120", kind: "claim", tenant: "fjord-mutual", roles: ["adjuster", "underwriter"], tenantLabel: "fjord" },
];

// Why a doc is not allowed for this caller — "tenant" beats "role" (checked first).
function blockReason(doc: Doc, role: Role): "tenant" | "role" | null {
  if (doc.tenant !== TENANT) return "tenant";
  if (!doc.roles.includes(role)) return "role";
  return null;
}

const GAP = 12;

function draw(svg: SVGSVGElement, role: Role, filterOn: boolean, reduce: boolean) {
  const W = 360;
  const docTop = 54;
  const docH = 34;
  const step = docH + GAP; // 46
  const H = docTop + step * STORE.length + 8; // room below last card

  const docX = 6;
  const docW = 120;
  const docRight = docX + docW; // 126
  const gateX = 168;
  const modelX = 246;
  const modelW = 108; // 246..354

  const sel = d3.select(svg).attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img");
  sel.selectAll("*").remove();

  const t = (el: d3.Selection<d3.BaseType, unknown, null, undefined>, delay = 0) => {
    if (reduce) return el.attr("opacity", 1);
    return el.attr("opacity", 0).transition().duration(280).delay(delay).attr("opacity", 1);
  };

  // ── question band ──
  sel
    .append("text")
    .attr("x", docX)
    .attr("y", 22)
    .attr("font-family", MONO)
    .attr("font-size", 12.5)
    .attr("fill", C.faint)
    .text('Q: "Why did POL-55012’s premium rise?"');

  // ── the retrieve gate: a vertical line the docs must cross ──
  sel
    .append("line")
    .attr("x1", gateX)
    .attr("y1", docTop - 6)
    .attr("x2", gateX)
    .attr("y2", docTop + step * STORE.length - GAP + 6)
    .attr("stroke", filterOn ? "var(--signal)" : LEAK)
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", filterOn ? "none" : "4 4");

  sel
    .append("text")
    .attr("x", gateX)
    .attr("y", docTop - 12)
    .attr("text-anchor", "middle")
    .attr("font-family", MONO)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .attr("fill", filterOn ? "var(--signal-fg)" : LEAK)
    .text(filterOn ? "filter ON" : "no filter");

  // ── model box (what reaches the model) ──
  const modelH = step * STORE.length - GAP;
  sel
    .append("rect")
    .attr("x", modelX)
    .attr("y", docTop)
    .attr("width", modelW)
    .attr("height", modelH)
    .attr("rx", 9)
    .attr("fill", C.wash)
    .attr("stroke", C.line)
    .attr("stroke-width", 1);
  sel
    .append("text")
    .attr("x", modelX + 10)
    .attr("y", docTop + 18)
    .attr("font-family", MONO)
    .attr("font-size", 12)
    .attr("fill", C.faint)
    .text("reaches model");

  // what actually reaches the model, in order
  const reached = STORE.filter((d) => filterOn === false || blockReason(d, role) === null);
  let mi = 0;
  reached.forEach((d) => {
    const reason = blockReason(d, role);
    const leaked = !filterOn && reason !== null;
    const my = docTop + 40 + mi * 22;
    mi += 1;
    const row = sel.append("g");
    row
      .append("text")
      .attr("x", modelX + 10)
      .attr("y", my)
      .attr("font-family", MONO)
      .attr("font-size", 12.5)
      .attr("font-weight", leaked ? 700 : 500)
      .attr("fill", leaked ? LEAK : "var(--signal-fg)")
      .text(d.label);
    if (leaked) {
      row
        .append("text")
        .attr("x", modelX + 10)
        .attr("y", my + 13)
        .attr("font-family", MONO)
        .attr("font-size", 11)
        .attr("fill", LEAK)
        .text(reason === "tenant" ? "LEAK · tenant" : "LEAK · role");
      mi += 0.6;
    }
    t(row as unknown as d3.Selection<d3.BaseType, unknown, null, undefined>, mi * 60);
  });
  if (reached.length === 0) {
    sel
      .append("text")
      .attr("x", modelX + 10)
      .attr("y", docTop + 44)
      .attr("font-family", MONO)
      .attr("font-size", 12.5)
      .attr("fill", C.ghost)
      .text("(nothing)");
  }

  // ── the four documents + their fate ──
  STORE.forEach((d, i) => {
    const y = docTop + step * i;
    const cy = y + docH / 2;
    const reason = blockReason(d, role);
    const blockedByGate = filterOn && reason !== null; // stopped at the gate
    const leaked = !filterOn && reason !== null; // passed but shouldn't have

    const stroke = blockedByGate ? C.line : leaked ? LEAK : "var(--signal)";
    const cardFill = blockedByGate ? C.wash : C.bg;

    // connector: doc → gate (always), gate → model (only if it passes)
    const line = sel
      .append("line")
      .attr("x1", docRight)
      .attr("y1", cy)
      .attr("x2", blockedByGate ? gateX : modelX)
      .attr("y2", cy)
      .attr("stroke", blockedByGate ? C.line : leaked ? LEAK : "var(--signal)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", blockedByGate ? "3 3" : "none");
    t(line as unknown as d3.Selection<d3.BaseType, unknown, null, undefined>, i * 70);

    // blocked-at-gate marker + one-word reason
    if (blockedByGate) {
      sel
        .append("text")
        .attr("x", gateX + 6)
        .attr("y", cy - 3)
        .attr("font-family", MONO)
        .attr("font-size", 12)
        .attr("font-weight", 700)
        .attr("fill", C.ghost)
        .text("✕");
      sel
        .append("text")
        .attr("x", gateX + 16)
        .attr("y", cy + 4)
        .attr("font-family", MONO)
        .attr("font-size", 11)
        .attr("fill", C.faint)
        .text(reason === "tenant" ? "tenant" : "role");
    }

    // the card
    sel
      .append("rect")
      .attr("x", docX)
      .attr("y", y)
      .attr("width", docW)
      .attr("height", docH)
      .attr("rx", 8)
      .attr("fill", cardFill)
      .attr("stroke", stroke)
      .attr("stroke-width", 1.5);
    sel
      .append("text")
      .attr("x", docX + 10)
      .attr("y", y + 15)
      .attr("font-family", MONO)
      .attr("font-size", 12.5)
      .attr("font-weight", 600)
      .attr("fill", C.ink)
      .text(d.label);
    sel
      .append("text")
      .attr("x", docX + 10)
      .attr("y", y + 27)
      .attr("font-family", MONO)
      .attr("font-size", 11)
      .attr("fill", d.tenant === TENANT ? C.ghost : LEAK)
      .text(`${d.tenantLabel} · ${d.kind}`);
  });

  // gate outcome, inside the diagram (no terminal readout)
  const kept = reached.length;
  sel
    .append("text")
    .attr("x", gateX)
    .attr("y", docTop + step * STORE.length - GAP + 20)
    .attr("text-anchor", "middle")
    .attr("font-family", MONO)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .attr("fill", filterOn ? "var(--signal-fg)" : LEAK)
    .text(filterOn ? `kept ${kept} · dropped ${STORE.length - kept}` : `all ${STORE.length} passed`);
}

// Human-readable outcome sentence for the current state.
function outcome(role: Role, filterOn: boolean): { text: string; leak: boolean } {
  const roleLabel = ROLES.find((r) => r.id === role)!.label;
  if (filterOn) {
    const kept = STORE.filter((d) => blockReason(d, role) === null).map((d) => d.label);
    return {
      leak: false,
      text: `Filter on — the ${roleLabel.toLowerCase()} query returns only ${kept.join(", ")}. Everything this role may not read is dropped before the model sees it.`,
    };
  }
  const roleLeaks = STORE.filter((d) => blockReason(d, role) === "role").length;
  const tenantLeaks = STORE.filter((d) => blockReason(d, role) === "tenant").length;
  const parts: string[] = [];
  if (roleLeaks) parts.push(`${roleLeaks} restricted by role`);
  if (tenantLeaks) parts.push(`${tenantLeaks} from another insurer`);
  if (parts.length === 0) {
    return {
      leak: false,
      text: `Filter off — all four documents reach the model. This ${roleLabel.toLowerCase()} happens to be allowed to read every one, so nothing leaks this time. Switch to Broker to see it break.`,
    };
  }
  return {
    leak: true,
    text: `Filter off — all four documents reach the model, including ${parts.join(" and ")}. “Please hide it” is a request, not a boundary: the model already read them.`,
  };
}

const OPTION_NOTE: Record<Role, string> = {
  adjuster: "Adjusters see policies and claims for their own tenant — not underwriting memos.",
  underwriter: "Underwriters also see the risk memo; still nothing from another tenant.",
  broker: "Brokers see policies only — no claims, no memos.",
};

export default function AccessViz() {
  const ref = useRef<SVGSVGElement>(null);
  const [role, setRole] = useState<Role>("broker"); // leak-prone default
  const [filterOn, setFilterOn] = useState(false); // OFF first, so the leak lands
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (ref.current) draw(ref.current, role, filterOn, !!reduce);
  }, [role, filterOn, reduce]);

  const out = outcome(role, filterOn);

  return (
    <div
      style={{
        fontFamily: SANS,
        color: C.ink,
        border: `1px solid ${C.hair}`,
        borderRadius: 14,
        background: C.bg,
        padding: "clamp(16px, 3vw, 24px)",
        margin: "24px 0 0",
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
        the leak demo
      </div>

      {/* controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(14px, 3vw, 28px)", marginTop: 14 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.ghost, marginBottom: 6 }}>Caller role (tenant: acme)</div>
          <div role="group" aria-label="Caller role" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                aria-pressed={role === r.id}
                style={segBtn(role === r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.ghost, marginBottom: 6 }}>Filter at retrieval</div>
          <div role="group" aria-label="Filter at retrieval" style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setFilterOn(true)} aria-pressed={filterOn} style={segBtn(filterOn)}>
              ON
            </button>
            <button
              type="button"
              onClick={() => setFilterOn(false)}
              aria-pressed={!filterOn}
              style={segBtn(!filterOn, !filterOn)}
            >
              OFF
            </button>
          </div>
        </div>
      </div>

      <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.6, color: C.faint, maxWidth: "42em" }}>
        ↳ You&rsquo;re the Acme <strong>broker</strong>. Leave the filter <strong>off</strong> and read what reaches the
        model &mdash; then switch it <strong>on</strong>.
      </p>

      {/* diagram */}
      <svg
        ref={ref}
        aria-label={`Retrieval flow for role ${role}, filter ${filterOn ? "on" : "off"}. ${out.text}`}
        style={{ width: "100%", height: "auto", marginTop: 16, display: "block" }}
      />

      {/* legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 6, fontFamily: MONO, fontSize: 11, color: C.faint }}>
        <Key color="var(--signal)" label="allowed — reaches model" />
        <Key color={C.line} label="blocked at the gate" />
        <Key color={LEAK} label="leaked — should not be here" />
      </div>

      {/* per-control note */}
      <p style={{ margin: "14px 0 0", fontSize: 14.5, lineHeight: 1.6, color: C.body, maxWidth: "44em", textWrap: "pretty" }}>
        {OPTION_NOTE[role]}
      </p>

      {/* outcome */}
      <div
        style={{
          margin: "12px 0 0",
          padding: "12px 14px",
          borderLeft: `2px solid ${out.leak ? LEAK : "var(--signal)"}`,
          background: out.leak ? "rgba(180, 35, 24, 0.06)" : "var(--signal-wash)",
          borderRadius: "0 10px 10px 0",
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1.6, color: out.leak ? LEAK : C.body, textWrap: "pretty" }}>
          {out.text}
        </span>
      </div>
    </div>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 18, height: 3, borderRadius: 2, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

function segBtn(active: boolean, danger = false): CSSProperties {
  const on = active;
  return {
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: on ? 700 : 500,
    letterSpacing: "0.02em",
    border: `1.5px solid ${on ? (danger ? LEAK : "var(--signal-fg)") : C.line}`,
    background: on ? (danger ? "rgba(180, 35, 24, 0.08)" : "var(--signal-wash)") : C.bg,
    color: on ? (danger ? LEAK : "var(--signal-fg)") : C.body,
    padding: "7px 14px",
    borderRadius: 9,
    cursor: "pointer",
  };
}
