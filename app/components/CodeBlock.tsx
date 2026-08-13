"use client";

// CodeBlock — syntax-highlighted code on the site's instrument (readout)
// surface. highlight.js does the tokenizing (core + only the languages the
// posts use, so the bundle stays small); the theme lives in globals.css
// (`.oo-code .hljs-*`) and is tuned for the dark readout palette. A copy
// button and an optional filename/label sit in the header.

import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import yaml from "highlight.js/lib/languages/yaml";
import { useMemo, useState } from "react";
import { MONO } from "../lib/site";

hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("typescript", typescript);

const LANG_LABEL: Record<string, string> = {
  python: "Python",
  bash: "bash",
  json: "JSON",
  yaml: "YAML",
  typescript: "TypeScript",
  text: "text",
};

export default function CodeBlock({
  code,
  lang = "text",
  filename,
}: {
  code: string;
  /** One of: python | bash | json | yaml | typescript | text */
  lang?: string;
  /** Optional label shown top-left (a path, or falls back to the language). */
  filename?: string;
}) {
  const source = code.replace(/\n+$/, "");
  const html = useMemo(() => {
    if (lang === "text" || !hljs.getLanguage(lang)) return null;
    try {
      return hljs.highlight(source, { language: lang }).value;
    } catch {
      return null;
    }
  }, [source, lang]);

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div
      className="oo-code"
      style={{
        margin: "22px 0 0",
        borderRadius: 12,
        border: "1px solid var(--readout-border)",
        background: "var(--readout-bg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "9px 14px",
          borderBottom: "1px solid var(--readout-border)",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.04em",
            color: "var(--readout-muted)",
          }}
        >
          {filename ?? LANG_LABEL[lang] ?? lang}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: copied ? "var(--readout-signal)" : "var(--readout-muted)",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre
        tabIndex={0}
        style={{
          margin: 0,
          padding: "16px",
          overflowX: "auto",
          fontFamily: MONO,
          fontSize: 13,
          lineHeight: 1.65,
          color: "var(--readout-fg)",
        }}
      >
        {html ? (
          <code
            className={`hljs language-${lang}`}
            style={{ background: "transparent", padding: 0, fontFamily: "inherit" }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <code
            className={`hljs language-${lang}`}
            style={{ background: "transparent", padding: 0, fontFamily: "inherit" }}
          >
            {source}
          </code>
        )}
      </pre>
    </div>
  );
}
