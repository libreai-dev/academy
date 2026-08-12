/**
 * Stage 0 · 1.1 — Special tokens & chat templates. Pure logic/data for the
 * article (no React, no d3). One idea: a chat is turned into ONE long formatted
 * string, with reserved control tokens marking who is speaking.
 *
 * Only code-literal, protocol-level strings live here (the delimiter tokens,
 * the role names, the reserved integer IDs). Everything user-facing lives in
 * app/lib/copy/special-tokens.ts.
 */

/** The three transcript roles. */
export type Role = "system" | "user" | "assistant";

/** Colour token per role — all defined in globals.css, AA-safe in both themes. */
export const ROLE_FILL: Record<Role, string> = {
  system: "var(--tok-punct)",
  user: "var(--tok-num)",
  assistant: "var(--signal)",
};

/** One item in the conversation "array" the app hands to the model. */
export interface ChatMsg {
  role: Role;
  content: string;
}

/** A representative conversation, reused across nodes (content overridable). */
export const DEFAULT_SYSTEM = "You are a helpful assistant.";
export const DEFAULT_USER = "What is the capital of France?";
export const DEFAULT_ASSISTANT = "The capital of France is Paris.";

/* --------------------------------------------------------------- templates -- */

export type TemplateId = "chatml" | "llama3";

/**
 * A chat template: the exact reserved tokens a model family uses to wrap turns,
 * plus their single integer IDs in that family's dictionary. IDs are the real
 * ones for these families (cl100k ChatML tokens; Llama-3 header tokens).
 */
export interface TemplateSpec {
  id: TemplateId;
  /** turn opener + closer + document-end, and the header tokens for Llama. */
  open: string;
  close: string;
  /** Reserved-token → integer id. */
  ids: Record<string, number>;
  /** Whether the role sits inside header tokens (Llama) or bare after open. */
  headered: boolean;
  /** Header tokens for the headered family. */
  headStart?: string;
  headEnd?: string;
  docStart?: string;
}

export const TEMPLATES: Record<TemplateId, TemplateSpec> = {
  chatml: {
    id: "chatml",
    open: "<|im_start|>",
    close: "<|im_end|>",
    headered: false,
    ids: {
      "<|im_start|>": 100264,
      "<|im_end|>": 100265,
      "<|endoftext|>": 100257,
    },
  },
  llama3: {
    id: "llama3",
    open: "<|start_header_id|>",
    close: "<|eot_id|>",
    headered: true,
    headStart: "<|start_header_id|>",
    headEnd: "<|end_header_id|>",
    docStart: "<|begin_of_text|>",
    ids: {
      "<|begin_of_text|>": 128000,
      "<|start_header_id|>": 128006,
      "<|end_header_id|>": 128007,
      "<|eot_id|>": 128009,
    },
  },
};

/* ---------------------------------------------------- rendered-string model -- */

export type SegKind = "special" | "role" | "text" | "nl";

/** One piece of the rendered string. `special` pieces carry their reserved id. */
export interface Seg {
  kind: SegKind;
  text: string;
  id?: number;
}

/**
 * Render the conversation array into the flat sequence of pieces the model
 * actually receives. `addGenerationPrompt` appends the empty assistant opener
 * the model continues from (its own turn is still blank).
 */
export function renderTemplate(
  msgs: ChatMsg[],
  tpl: TemplateSpec,
  addGenerationPrompt = true,
): Seg[] {
  const out: Seg[] = [];
  const sp = (text: string): Seg => ({ kind: "special", text, id: tpl.ids[text] });

  if (tpl.headered && tpl.docStart) out.push(sp(tpl.docStart), { kind: "nl", text: "\n" });

  const block = (role: Role, content: string, blank = false) => {
    if (tpl.headered) {
      out.push(sp(tpl.headStart!), { kind: "role", text: role }, sp(tpl.headEnd!), { kind: "nl", text: "\n" });
      if (!blank) out.push({ kind: "text", text: content }, sp(tpl.close), { kind: "nl", text: "\n" });
    } else {
      out.push(sp(tpl.open), { kind: "role", text: role }, { kind: "nl", text: "\n" });
      if (!blank) out.push({ kind: "text", text: content }, sp(tpl.close), { kind: "nl", text: "\n" });
    }
  };

  msgs.forEach((m) => block(m.role, m.content));
  if (addGenerationPrompt) block("assistant", "", true);
  return out;
}

/** Count the reserved control tokens in a rendered sequence. */
export function countControl(segs: Seg[]): number {
  return segs.filter((s) => s.kind === "special").length;
}

/* -------------------------------------------------- node 3: one id vs chars -- */

/** The reserved control tokens a learner can inspect in node 3. */
export const INSPECT_TOKENS = ["<|im_start|>", "<|im_end|>", "<|endoftext|>"] as const;
export type InspectToken = (typeof INSPECT_TOKENS)[number];

/** Reserved id for an inspectable token (ChatML family). */
export function reservedId(token: InspectToken): number {
  return TEMPLATES.chatml.ids[token];
}

/**
 * How the SAME string would look if it were NOT reserved — ordinary text the
 * tokenizer breaks into many little pieces. We split on the literal characters
 * (a faithful lower bound: at minimum this many tokens), which is the point:
 * one reserved entry replaces a dozen scattered ones.
 */
export function asPlainPieces(token: InspectToken): string[] {
  return Array.from(token);
}
