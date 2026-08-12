/**
 * Copy shapes shared by the scroll-driven "articles" (web-scale ingestion,
 * multi-stage deduplication, data recipe …). Kept here so each article module
 * can import the shared node shape without depending on another article.
 */

/**
 * One node in a scroll-driven lesson (shared by 0.1a web-scale + 0.1b domains).
 * Two concept styles are supported so both lessons compile against one shape:
 *   - legacy: `concept` paragraphs + `frameLabel` (0.1b domains)
 *   - new:    `intro` + scannable `bullets` (0.1a web-scale, post-feedback)
 * Bullets/intro may carry `[links](url)` and the `{ring}` inline marker.
 */
export interface WsNodeCopy {
  eyebrow: string;
  title: string;
  concept?: string[]; //  legacy paragraphs
  intro?: string; //      new: 1–2 sentences
  bullets?: string[]; //  new: scannable takeaways
  cardLabel: string;
  frameLabel?: string; //  legacy small diagram label
  aria?: string; //        accessible diagram name (new)
  /** 1 = live (no stepper); 2+ = stepped. */
  steps?: number;
  captions: string[];
  hint: string;
  readoutTitle: string;
  rows: string[];
  /** Plain-language line under the readout: what it represents (new). */
  readoutNote?: string;
  /** Per-control explanations, index-aligned to the node's toggles (new). */
  optionNotes?: string[];
  /** Default explanation shown before any control is touched (new). */
  sliderNote?: string;
}
