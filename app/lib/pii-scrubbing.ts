/**
 * Pure logic + data for the "PII scrubbing" lesson (Stage 0 · Phase 0.1).
 * No React, no d3 — the two detector families, the document's span-count math,
 * and the category→family map live here so the diagrams stay thin and the
 * counting is testable. All *prose* lives in app/lib/copy/pii-scrubbing.ts;
 * this module holds only logic and stable keys.
 *
 * The one idea: before training, personal data (emails, phones, IDs, names) and
 * copyrighted / sealed text are automatically detected and stripped. Two tools
 * do the detecting — a *pattern* for rigid shapes, a *model* for prose — and
 * redaction then masks each span with a typed placeholder.
 */

/** How a category is caught. Structured PII → a pattern; unstructured → a model. */
export type Family = "pattern" | "model";

/** The six teaching categories (fixed order — copy label arrays line up). */
export const PII_CATEGORIES = ["email", "phone", "ssn", "card", "name", "address"] as const;
export type PiiCategory = (typeof PII_CATEGORIES)[number];

/** Which family catches each category. Email/phone/SSN/card have a fixed shape a
 *  regular expression matches; a name or address is just prose and needs NER. */
export const CATEGORY_FAMILY: Record<PiiCategory, Family> = {
  email: "pattern",
  phone: "pattern",
  ssn: "pattern",
  card: "pattern",
  name: "model",
  address: "model",
};

/** The five detectors the learner toggles in node 2 (name/place share one NER). */
export const DETECTORS = ["email", "phone", "ssn", "card", "name"] as const;
export type Detector = (typeof DETECTORS)[number];

/** One annotated segment of the sample document; `det` set ⇒ it is a PII span. */
export interface DocSpan {
  det?: Detector;
}

export interface SpanTally {
  total: number;
  caught: number;
  leaked: number;
}

/**
 * Count PII spans in the document given which detectors are switched on.
 * A span is *caught* when its detector is active, *leaked* when it is off.
 * Works on any line-of-segments shape (the copy module's PiiLine[] fits).
 */
export function countSpans(lines: DocSpan[][], active: Record<Detector, boolean>): SpanTally {
  let total = 0;
  let caught = 0;
  let leaked = 0;
  for (const line of lines) {
    for (const seg of line) {
      if (!seg.det) continue;
      total += 1;
      if (active[seg.det]) caught += 1;
      else leaked += 1;
    }
  }
  return { total, caught, leaked };
}
