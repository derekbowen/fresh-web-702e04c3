#!/usr/bin/env node
/**
 * check:deployed-sha — production must be able to prove which commit it serves.
 *
 * Fetches {BASE_URL}/fw-assets/__build.json (written by scripts/stamp-build.mjs as npm's
 * postbuild) and fails closed when production cannot answer, answers with an
 * unknown SHA, or answers with a SHA built from a dirty tree.
 *
 * When EXPECTED_SHA is set, the answer must equal it. The deploy path always
 * sets it, which is what makes verification depend on the SHA rather than
 * merely observing one. CI on a pull request leaves it unset — a PR branch is
 * not what production is running, and asserting otherwise would be a check that
 * fails for the wrong reason.
 *
 * env: BASE_URL (default https://www.poolrentalnearme.com)
 *      EXPECTED_SHA (optional; full 40-char sha)
 *      ALLOW_DIRTY=1 (escape hatch for a deliberate hot-patch; recorded loudly)
 */
const BASE = (process.env.BASE_URL || "https://www.poolrentalnearme.com").replace(/\/$/, "");
const EXPECTED = (process.env.EXPECTED_SHA || "").trim();
const ALLOW_DIRTY = process.env.ALLOW_DIRTY === "1";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 20000);

const fail = (msg) => {
  console.error(`FAIL — ${msg}`);
  process.exit(1);
};

const ctl = new AbortController();
const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
let res;
try {
  res = await fetch(`${BASE}/fw-assets/__build.json`, { signal: ctl.signal, redirect: "follow" });
} catch (e) {
  fail(`${BASE}/fw-assets/__build.json is unreachable (${String(e).slice(0, 120)}). ` +
       `Production cannot prove which commit it is running.`);
} finally {
  clearTimeout(timer);
}

if (res.status !== 200) {
  fail(`${BASE}/fw-assets/__build.json returned ${res.status}. Either this build predates ` +
       `stamp-build, or the deploy did not run "npm run build".`);
}

let info;
try {
  info = await res.json();
} catch {
  fail(`${BASE}/fw-assets/__build.json is not valid JSON`);
}

console.log(`check:deployed-sha — base ${BASE}`);
console.log(`  live sha   : ${info.sha}`);
console.log(`  live tree  : ${info.tree}`);
console.log(`  branch     : ${info.branch}`);
console.log(`  built at   : ${info.builtAt}`);
console.log(`  dirty      : ${info.dirty}`);
console.log(`  assets     : ${String(info.assets).slice(0, 12)}`);

if (!info.sha || info.sha === "unknown") {
  fail(`production reports sha "${info.sha}" — it was built outside a git checkout, ` +
       `so what it is running cannot be traced to a commit.`);
}
if (!/^[0-9a-f]{40}$/.test(info.sha)) fail(`live sha is not a 40-char sha: ${info.sha}`);

if (info.dirty > 0) {
  const detail = (info.dirtyFiles || []).map((p) => `    ${p}`).join("\n");
  if (!ALLOW_DIRTY) {
    fail(`production was built from ${info.dirty} uncommitted source change(s), so its ` +
         `SHA does not describe what it is running:\n${detail}`);
  }
  console.warn(`  WARNING built dirty, allowed by ALLOW_DIRTY=1:\n${detail}`);
}

if (EXPECTED) {
  if (!/^[0-9a-f]{40}$/.test(EXPECTED)) fail(`EXPECTED_SHA is not a 40-char sha: ${EXPECTED}`);
  if (info.sha !== EXPECTED) {
    fail(`production is serving ${info.sha.slice(0, 8)} but ${EXPECTED.slice(0, 8)} was expected. ` +
         `Either the deploy did not take, or something else deployed over it.`);
  }
  console.log(`  expected   : ${EXPECTED} MATCH`);
} else {
  console.log(`  expected   : (EXPECTED_SHA unset — identity checked, equality not asserted)`);
}

console.log("PASS — production reports a clean, traceable build SHA.");
