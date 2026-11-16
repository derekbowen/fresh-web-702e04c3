#!/usr/bin/env node
/**
 * Generates src/lib/comparison-duplicates.ts — the explicit list of
 * comparison city URLs that 301 to their state-suffixed twin (audit F6(a)).
 *
 * Inputs (all in this directory, all checked in):
 *   evidence-2026-11-14-exact-dups.json  78 [bare, suffixed] URL pairs whose
 *                                        main text had the same sha1 in the
 *                                        2026-11-14 audit crawl
 *   refetch-<date>.json                  both URLs of each pair fetched again
 *                                        from production (refetch_pairs.py);
 *                                        every such file is read, and a pair
 *                                        must pass in EACH of them
 *                                        (2026-11-15 and 2026-11-16)
 *   cities-2026-11-15.psv                the production `cities` rows behind
 *                                        both slugs of every pair (read-only)
 *
 * A pair is confirmed only when ALL of these hold; anything else is left alone
 * and reported:
 *   - the suffixed URL is the bare URL plus "-" and a two-letter state code;
 *   - in every re-fetch both answer 200, no Location, each canonical to
 *     itself, and their main text has the same sha1 (and the same H1);
 *   - both cities rows exist and are published, with the same name, state and
 *     state_code, the suffix equals that state_code, and their coordinates
 *     are within MAX_KM of each other (the two rows carry different centroids
 *     for one city, e.g. a downtown point and a ZIP centroid).
 *
 * Usage:
 *   node ops/seo-repairs-2026-11/comparison-duplicates/generate.mjs          write
 *   node ops/seo-repairs-2026-11/comparison-duplicates/generate.mjs --check  exit 1 if stale
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../..");
const OUT = join(ROOT, "src/lib/comparison-duplicates.ts");
const DECISIONS = join(HERE, "decisions.json");
const SITE = "https://www.poolrentalnearme.com";
const MAX_KM = 40;

const evidence = JSON.parse(readFileSync(join(HERE, "evidence-2026-11-14-exact-dups.json"), "utf8"));
const refetches = readdirSync(HERE)
  .filter((f) => /^refetch-\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(HERE, f), "utf8")));
if (refetches.length === 0) throw new Error("no refetch-<date>.json input");
const fetchedAt = refetches.map((r) => r.fetched_at);
const cities = new Map();
for (const line of readFileSync(join(HERE, "cities-2026-11-15.psv"), "utf8").split("\n")) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [slug, name, state, state_code, lat, lng, pub] = line.split("|");
  cities.set(slug, { slug, name, state, state_code, lat: Number(lat), lng: Number(lng), published: pub === "t" });
}
/** One Map(path -> fetch record) per re-fetch, oldest first. */
const fetchedRuns = refetches.map((refetch) => {
  const fetched = new Map();
  for (const p of refetch.pairs) {
    fetched.set(p.bare.path, p.bare);
    fetched.set(p.suffixed.path, p.suffixed);
  }
  return { at: refetch.fetched_at, fetched };
});

function km(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const confirmed = [];
const rejected = [];
for (const [bare, suffixed] of evidence) {
  const why = [];
  const m = suffixed.match(/^(\/p\/(giggster|peerspace)-vs-pool-rental-near-me-in-)([a-z0-9-]+)-([a-z]{2})$/);
  const bareCity = m && bare === `${m[1]}${m[3]}` ? m[3] : null;
  if (!bareCity) why.push("suffixed URL is not the bare URL plus a two-letter state");
  let fb = null;
  for (const { at, fetched } of fetchedRuns) {
    fb = fetched.get(bare);
    const fs = fetched.get(suffixed);
    if (!fb || !fs) {
      why.push(`${at}: not re-fetched`);
      continue;
    }
    for (const [r, path] of [[fb, bare], [fs, suffixed]]) {
      if (r.status !== 200 || r.location) why.push(`${at}: ${path} answered ${r.status}${r.location ? ` -> ${r.location}` : ""}`);
      if (r.canonical !== `${SITE}${path}`) why.push(`${at}: ${path} canonical ${r.canonical}`);
    }
    if (!fb.text_sha1 || fb.text_sha1 !== fs.text_sha1) why.push(`${at}: main text differs`);
    if (fb.h1 !== fs.h1) why.push(`${at}: H1 differs`);
  }
  let distance = null;
  if (bareCity) {
    const a = cities.get(bareCity);
    const b = cities.get(`${bareCity}-${m[4]}`);
    if (!a || !b) why.push("a cities row is missing");
    else {
      if (!a.published || !b.published) why.push("a cities row is unpublished");
      if (a.name !== b.name || a.state !== b.state || a.state_code !== b.state_code)
        why.push(`cities rows differ: ${a.name}, ${a.state_code} vs ${b.name}, ${b.state_code}`);
      if (b.state_code.toLowerCase() !== m[4]) why.push("suffix is not the row's state_code");
      distance = Math.round(km(a, b) * 10) / 10;
      if (!(distance <= MAX_KM)) why.push(`coordinates ${distance} km apart`);
    }
  }
  const rec = { from: bare, to: suffixed, km: distance, words: fb?.words ?? null };
  if (why.length) rejected.push({ ...rec, why });
  else confirmed.push(rec);
}
confirmed.sort((a, b) => a.from.localeCompare(b.from));

const body = `/**
 * GENERATED by ops/seo-repairs-2026-11/comparison-duplicates/generate.mjs —
 * do not edit by hand; change the inputs there and re-run it.
 *
 * Comparison city pages that 301 to their state-suffixed twin (audit F6(a)).
 * Each entry is one URL pair whose main text was byte-identical in the
 * 2026-11-14 audit crawl AND again in every re-fetch from production
 * (${fetchedAt.join(", ")}), whose two \`cities\` rows have the same name, state and
 * state code (coordinates within ${MAX_KM} km), and whose state-suffixed URL is
 * kept as the canonical page. An explicit list, not a "strip/append the
 * state" rule: no other comparison URL is redirected by it.
 *
 * Pure (no imports) so node --test can import it.
 */

/** ${confirmed.length} bare-city URL -> state-suffixed URL. */
export const COMPARISON_DUPLICATE_REDIRECTS: Readonly<Record<string, string>> = Object.freeze({
${confirmed.map((c) => `  ${JSON.stringify(c.from)}: ${JSON.stringify(c.to)},`).join("\n")}
});

/** The state-suffixed URL a confirmed duplicate 301s to, or null. Exact path match only. */
export function comparisonDuplicateTarget(path: string): string | null {
  return Object.prototype.hasOwnProperty.call(COMPARISON_DUPLICATE_REDIRECTS, path)
    ? COMPARISON_DUPLICATE_REDIRECTS[path]!
    : null;
}

export function isComparisonDuplicatePath(path: string): boolean {
  return comparisonDuplicateTarget(path) !== null;
}
`;
const decisions = JSON.stringify(
  { generated_from: { refetch_fetched_at: fetchedAt, max_km: MAX_KM }, confirmed, rejected },
  null,
  1,
) + "\n";

if (process.argv.includes("--check")) {
  const stale = [];
  if (readFileSync(OUT, "utf8") !== body) stale.push(OUT);
  if (readFileSync(DECISIONS, "utf8") !== decisions) stale.push(DECISIONS);
  if (stale.length) {
    console.error(`stale, re-run the generator: ${stale.join(", ")}`);
    process.exit(1);
  }
  console.log(`up to date: ${confirmed.length} confirmed, ${rejected.length} rejected`);
} else {
  writeFileSync(OUT, body);
  writeFileSync(DECISIONS, decisions);
  const kms = confirmed.map((c) => c.km);
  console.log(`${confirmed.length} confirmed, ${rejected.length} rejected; max distance ${Math.max(...kms)} km`);
  for (const r of rejected) console.log(`  rejected ${r.from}: ${r.why.join("; ")}`);
}
