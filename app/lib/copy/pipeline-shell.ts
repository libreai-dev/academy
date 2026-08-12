/**
 * Shared copy shapes for the two-part **Data Pipeline** series (Stage 0).
 *
 * Both articles — "The data pipeline" (Part 1) and "Inside the data pipeline"
 * (Part 2) — are organised by the same 4-station backbone (Gather → Extract &
 * enrich → Deduplicate → The recipe). This module holds the shell shared by
 * both: the hero, the station list that drives the "you are here" map, and the
 * closing explain/bridge/nav blocks. Each article module composes its `nodes`
 * (of shape `PipelineNode`) with `PipelineShellCopy`.
 *
 * Reuses the shared per-node shape `WsNodeCopy` from ./shared so the scene
 * engine (webscale-kit) renders these nodes exactly like the source lessons.
 */

import type { WsNodeCopy } from "./shared";

/** One station in the 4-station pipeline map. `key` is the anchor id target. */
export interface StationCopy {
  key: string; //    e.g. "gather" → <section id="station-gather">
  label: string; //  short caps label, e.g. "GATHER"
  title: string; //  human title, e.g. "Gather the raw web"
  blurb: string; //  one plain line (may carry [links](url) / {ring})
}

/** Hero + closing copy shared by both Data Pipeline articles. */
export interface PipelineShellCopy {
  crumb: string; //        breadcrumb for the header rail
  eyebrow: string; //      "STAGE 0 · THE DATA PIPELINE · PART 1"
  title: string;
  lede: string;
  mapLabel: string; //     label above the hero station map, e.g. "THE PIPELINE"
  stations: StationCopy[]; // exactly 4, in pipeline order
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLabel: string;
  prevHref: string;
  nextLabel: string;
  nextHref: string;
}

/** A hidden-instruction payload for the prompt-injection node (Part 2). */
export interface PipePayload {
  key: string;
  label: string;
  hidden: string;
  clean: string;
  attacked: string;
}

/**
 * Per-node control/diagram label bundle. The source lessons keep these as flat
 * `n1slider`, `n2seg`, … fields on the lesson object; here each node carries its
 * own bundle so nodes re-homed from four different lessons never collide. All
 * fields optional; the node's wrapper reads exactly the ones it needs. The
 * `[k]` escape hatch carries the handful of node-specific extras (diagram
 * labels, axis titles) verbatim from the source copy.
 */
export interface PipeUi {
  slider?: string;
  slider2?: string;
  segments?: string[]; //  segmented control / toggle-group labels
  presets?: string[]; //   preset button labels
  toggles?: string[]; //   independent toggle labels
  domains?: string[]; //   domain/stream names
  labels?: string[]; //    misc diagram labels, index-documented per node
  notes?: string[]; //     per-option explanation lines (index-aligned)
  payloads?: PipePayload[];
  callout?: { label: string; title: string; body: string };
  deeperTitle?: string;
  deeperBody?: string;
  [k: string]: unknown; // escape hatch for node-specific extras (verbatim copy)
}

/** One node in a Data Pipeline article: a scene-engine node + its station + UI. */
export interface PipelineNode extends WsNodeCopy {
  /** Which station (StationCopy.key) this node sits under. */
  station: string;
  ui?: PipeUi;
}

/** A full Data Pipeline article: the shared shell + its ordered nodes. */
export interface PipelineLesson extends PipelineShellCopy {
  nodes: PipelineNode[];
}
