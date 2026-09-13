#!/usr/bin/env node
/**
 * check:homepage-shape — the homepage must have a BODY, not just a 200.
 *
 * Why this exists. On 2026-09-13 a render-time ReferenceError made `/` serve a
 * bare shell: header and footer, no <h1>, no hero, no listings, ~61KB instead of
 * ~150KB. Every existing gate passed, because a page that throws during render
 * still returns HTTP 200 with a well-formed document. The smoke step fetched `/`
 * and asserted the status code; the status code was fine.
 *
 * So this asserts the things a broken render loses first, against whatever the
 * homepage is meant to be:
 *   - exactly one <h1>, non-empty
 *   - at least MIN_P_LINKS distinct /p/ links (internal link equity)
 *   - at least MIN_BYTES of HTML
 *   - the FAQPage JSON-LD still parses and is non-empty
 *   - no visible error-boundary text
 *
 * env: BASE_URL        (default https://www.poolrentalnearme.com)
 *      MIN_P_LINKS     (default 25)
 *      MIN_BYTES       (default 70000)
 *      PATHS           (default "/")
 */
const BASE = (process.env.BASE_URL || "https://www.poolrentalnearme.com").replace(/\/$/, "");
const MIN_P_LINKS = Number(process.env.MIN_P_LINKS || 25);
const MIN_BYTES = Number(process.env.MIN_BYTES || 70000);
const PATHS = (process.env.PATHS || "/").split(",");

const problems = [];
for (const path of PATHS) {
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}cb=${Date.now()}`;
  let html = "", status = 0;
  try {
    const r = await fetch(url, { headers: { "Cache-Control": "no-cache" }, redirect: "follow" });
    status = r.status;
    html = await r.text();
  } catch (e) {
    problems.push(`${path}: unreachable (${String(e).slice(0, 120)})`);
    continue;
  }

  if (status !== 200) { problems.push(`${path}: HTTP ${status}`); continue; }

  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Text = h1s.map((m) => m[1].replace(/<[^>]*>/g, "").trim()).filter(Boolean);
  const pLinks = new Set([...html.matchAll(/href="(\/p\/[^"#?]*)"/g)].map((m) => m[1]));

  console.log(`${path}  ${status}  ${html.length} bytes  h1=${h1s.length}  /p/ links=${pLinks.size}`);
  if (h1Text.length) console.log(`   h1: "${h1Text[0].slice(0, 80)}"`);

  if (h1s.length === 0) problems.push(`${path}: no <h1> — the page rendered no content`);
  if (h1s.length > 1) problems.push(`${path}: ${h1s.length} <h1> elements, expected exactly 1`);
  if (h1s.length && !h1Text.length) problems.push(`${path}: <h1> is empty`);
  if (pLinks.size < MIN_P_LINKS) problems.push(`${path}: only ${pLinks.size} distinct /p/ links, expected >= ${MIN_P_LINKS}`);
  if (html.length < MIN_BYTES) problems.push(`${path}: ${html.length} bytes, expected >= ${MIN_BYTES} — looks like a shell render`);
  if (/Something went wrong loading this section/.test(html)) problems.push(`${path}: an ErrorBoundary fallback is visible on the page`);

  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  let faqOk = false;
  for (const m of ld) {
    try {
      const j = JSON.parse(m[1]);
      const nodes = Array.isArray(j) ? j : [j];
      for (const n of nodes) {
        if (n["@type"] === "FAQPage" && Array.isArray(n.mainEntity) && n.mainEntity.length) faqOk = true;
      }
    } catch { problems.push(`${path}: a JSON-LD block does not parse`); }
  }
  if (!faqOk) problems.push(`${path}: no non-empty FAQPage JSON-LD`);
}

if (problems.length) {
  console.error(`\nHOMEPAGE SHAPE — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\nPASS — the homepage rendered real content, not just a 200.");
