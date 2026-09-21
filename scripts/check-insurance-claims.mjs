#!/usr/bin/env node
/**
 * check:insurance-claims — fails when prohibited or stale insurance language,
 * or an insurance policy number, appears in source or in live production HTML.
 *
 * Canonical source of truth for what PRNM may say about its own insurance is
 * poolrentalnearme-web `src/config/insurance.config.js` (+ docs/insurance/
 * APPROVED-LANGUAGE.md). That file has a publish gate: while
 * `verified === false` and `named_insured === null`, NO affirmative coverage
 * claim may be published anywhere. fresh-web has no insurance fact layer of its
 * own on purpose — it publishes nothing — and this check enforces that.
 *
 * Also enforces: never publish a policy number. Detected by shape, so the
 * number itself is not written into this repo.
 *
 * env: BASE_URL (default https://www.poolrentalnearme.com), SKIP_LIVE=1
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.BASE_URL || "https://www.poolrentalnearme.com").replace(/\/$/, "");

// Shape of a carrier policy number (e.g. AAA-00000000-00). Never the literal.
const POLICY_NUMBER = /\b[A-Z]{2,4}-\d{6,10}-\d{2}\b/;

const BANNED = [
  // affirmative coverage claims — gated, so they may not appear at all
  [/\$?2M Commercial Liability/i, "affirmative $2M claim bypasses the insurance publish gate"],
  [/\$2\s?million per occurrence/i, "affirmative limit claim bypasses the gate"],
  [/\$?4M aggregate|\$4\s?million aggregate/i, "affirmative limit claim bypasses the gate"],
  [/fully insured/i, "unsupported: 'fully insured'"],
  [/every booking is insured/i, "unsupported: 'every booking is insured'"],
  [/\$2M host protection/i, "unsupported: host protection claim"],
  [/hosts are covered/i, "unsupported: hosts are not insureds"],
  [/guest protection guarantee/i, "unsupported: no such guarantee"],
  // stale blanket denial — misleading now that a policy exists
  [/does not provide or arrange insurance/i, "stale: PRNM does carry a liability policy"],
  [/does not provide insurance/i, "stale: PRNM does carry a liability policy"],
  // carriers that are not on the policy
  [/\bHartford\b/i, "wrong carrier"],
  [/\bLloyd'?s\b/i, "wrong carrier"],
];

const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".output", ".vinxi"]);
const EXT = /\.(ts|tsx|js|jsx|mjs|json|md)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    // .bak-* files are historical snapshots, not shipped
    else if (EXT.test(name) && !/\.bak/.test(name)) out.push(p);
  }
  return out;
}

let failures = 0;
console.log("check:insurance-claims — scanning source");
for (const file of walk("src")) {
  const text = readFileSync(file, "utf8");
  if (POLICY_NUMBER.test(text)) {
    console.error(`  POLICY NUMBER in ${file}`);
    failures++;
  }
  for (const [re, why] of BANNED) {
    const m = text.match(re);
    if (m) {
      console.error(`  ${file}: ${why} — matched ${JSON.stringify(m[0])}`);
      failures++;
    }
  }
}

if (process.env.SKIP_LIVE !== "1") {
  console.log(`check:insurance-claims — scanning live pages on ${BASE}`);
  const PAGES = [
    "/", "/p/about-our-company", "/p/how-it-works", "/p/hosting",
    "/p/swimply-alternative-vs-pool-rental-near-me",
    "/p/peerspace-vs-pool-rental-near-me",
  ];
  for (const path of PAGES) {
    let body = "";
    try {
      const res = await fetch(BASE + path, { redirect: "follow" });
      body = await res.text();
    } catch (e) {
      console.error(`  could not fetch ${path}: ${String(e).slice(0, 100)}`);
      failures++;
      continue;
    }
    if (POLICY_NUMBER.test(body)) {
      console.error(`  POLICY NUMBER rendered on ${path}`);
      failures++;
    }
    for (const [re, why] of BANNED) {
      const m = body.match(re);
      if (m) {
        console.error(`  ${path}: ${why} — matched ${JSON.stringify(m[0])}`);
        failures++;
      }
    }
  }
}

if (failures > 0) {
  console.error(`\nFAILED — ${failures} prohibited insurance string(s).`);
  console.error("The gate in insurance.config.js is the only thing that may authorise coverage copy.");
  process.exit(1);
}
console.log("\nPASS — no prohibited insurance language and no policy number, in source or live HTML.");
