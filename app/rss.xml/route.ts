import { POSTS } from "../lib/posts";
import { PROFILE } from "../lib/site";

const SITE = "https://xavier-ramirez.com";

/** Minimal RSS 2.0 feed built from the writing registry. */
export function GET() {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const items = POSTS.map((p) => {
    const url = `${SITE}${p.href}`;
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <category>${esc(p.category)}</category>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${PROFILE.name} — Writing</title>
    <link>${SITE}/writing</link>
    <description>Notes on how AI systems actually work, and what it takes to run them in production.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
