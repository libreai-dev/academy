/**
 * A simplified, BPE-flavoured tokenizer — close enough for a learner to *feel*
 * how real tokenization behaves without shipping a full vocabulary to the
 * browser. It keeps common words whole, splits long words into ~4-char subword
 * pieces, isolates punctuation, and breaks long digit runs into triplets (so
 * `1234567` visibly becomes `123 / 45 / 67`, the lesson's key demonstration).
 *
 * This is deliberately client-side and deterministic: the same input always
 * produces the same chips, which keeps the interactive honest and testable.
 */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  const re = /(\s+|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|\d+|[^\sA-Za-zÁÉÍÓÚÜÑáéíóúüñ\d]+)/g;
  const parts = text.match(re) || [];

  for (const p of parts) {
    // Whitespace: collapse single spaces (they ride along with words), but keep
    // runs so indentation/newlines still cost tokens.
    if (/^\s+$/.test(p)) {
      if (p.length > 1) out.push(p);
      continue;
    }
    // Digits split into place-value-breaking triplets.
    if (/^\d+$/.test(p)) {
      for (let i = 0; i < p.length; i += 3) out.push(p.slice(i, i + 3));
      continue;
    }
    // Letters: short words survive whole; long words decompose into subwords.
    if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/.test(p)) {
      if (p.length <= 6) {
        out.push(p);
        continue;
      }
      let i = 0;
      while (i < p.length) {
        const n = i === 0 ? 4 : 3;
        out.push(p.slice(i, i + n));
        i += n;
      }
      continue;
    }
    // Punctuation / symbols / emoji: one token per character.
    for (const ch of Array.from(p)) out.push(ch);
  }

  return out;
}

/** Assumed input price used by the cost readout: $3 per million input tokens. */
export const INPUT_PRICE_PER_MTOK = 3;

export function estimateCost(tokenCount: number): number {
  return (tokenCount / 1_000_000) * INPUT_PRICE_PER_MTOK;
}
