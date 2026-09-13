#!/usr/bin/env node
/**
 * check:production-drift — a three-way comparison, failing closed on any gap.
 *
 *   1. EXPECTED  .deployed-sha on the box: the SHA a deploy shipped *and
 *                verified*. ops/deploy-east.sh writes it only after
 *                verify:production passes, so its presence is an attestation,
 *                not a note.
 *   2. DEPLOYED  dist/client/fw-assets/__build.json: what the build output was
 *                built from, stamped by the build itself (npm postbuild).
 *   3. ACTUAL    {BASE_URL}/fw-assets/__build.json fetched over the network, plus the
 *                live working tree (git HEAD + dirty source files).
 *
 * The earlier version of this script compared only .deployed-sha against HEAD.
 * That could not tell you whether production was *serving* the tree it read,
 * which is the failure it existed to catch.
 *
 * Every discrepancy is drift, and so is every missing piece: no .deployed-sha,
 * no local stamp, an unreachable endpoint, an unknown SHA, a dirty tree. There
 * is no "unknown, assume fine" path.
 *
 * env: REPO_DIR   (default /home/ubuntu/fresh-web)
 *      BASE_URL   (default https://www.poolrentalnearme.com)
 *      SKIP_REMOTE=1  skip leg 3's network fetch (local-only invocation)
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = process.env.REPO_DIR || "/home/ubuntu/fresh-web";
const BASE = (process.env.BASE_URL || "https://www.poolrentalnearme.com").replace(/\/$/, "");
const SHA_FILE = process.env.DEPLOYED_SHA_FILE || join(REPO, ".deployed-sha");
const LOCAL_STAMP = join(REPO, "dist", "client", "fw-assets", "__build.json");
const SKIP_REMOTE = process.env.SKIP_REMOTE === "1";

const IGNORE = [
  /^dist\//, /^\.output\//, /^node_modules\//, /^\.vinxi\//, /^\.nitro\//, /^\.tanstack\//,
  /^dist-server-bak/, /^dist\.bak/, /\.bak($|-|\.)/, /\.v2bak/, /\.log$/, /^logs?\//,
  /^\.cache\//, /^\.deployed-sha$/, /^\.env/, /^dump\.pm2$/,
];
const ignored = (p) => IGNORE.some((r) => r.test(p));
const gRaw = (args) =>
  execSync(`git -c safe.directory=${REPO} -C ${REPO} ${args}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
const g = (args) => gRaw(args).trim();

// Porcelain lines are "XY PATH". Trimming the whole output eats the leading
// space of an unstaged line and shifts the first path by one character, so
// status is read untrimmed.
const statusLines = () => gRaw("status --porcelain").split("\n").filter((l) => l.length > 3);

const problems = [];
const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
};

// ---- leg 1: EXPECTED -------------------------------------------------------
let expected = null;
if (!existsSync(SHA_FILE)) {
  problems.push(
    `no verified deploy record at ${SHA_FILE} — nothing has deployed through ` +
    `ops/deploy-east.sh, so no SHA has been attested as verified`,
  );
} else {
  expected = readJson(SHA_FILE);
  if (!expected) {
    problems.push(`${SHA_FILE} is not valid JSON — rewrite it by deploying through ops/deploy-east.sh`);
  } else if (expected.verify !== "pass") {
    problems.push(`the recorded deploy ${String(expected.sha).slice(0, 8)} has verify="${expected.verify}", not "pass"`);
  }
}

// ---- leg 2: DEPLOYED (local build stamp) ----------------------------------
const local = readJson(LOCAL_STAMP);
if (!local) {
  problems.push(`no build stamp at ${LOCAL_STAMP} — this dist/ was built before stamp-build, or by a raw "vite build"`);
} else if (!/^[0-9a-f]{40}$/.test(local.sha || "")) {
  problems.push(`build stamp reports sha "${local.sha}" — built outside a git checkout`);
} else if (local.dirty > 0) {
  problems.push(`the running build was made from ${local.dirty} uncommitted source change(s): ${(local.dirtyFiles || []).slice(0, 5).join(", ")}`);
}

// ---- leg 3: ACTUAL (live endpoint + working tree) -------------------------
let head = null, dirty = [], untracked = [];
try {
  head = g("rev-parse HEAD");
  for (const line of statusLines()) {
    const code = line.slice(0, 2);
    const p = line.slice(3).replace(/^"|"$/g, "").trimEnd();
    if (ignored(p)) continue;
    (code.includes("?") ? untracked : dirty).push(p);
  }
} catch {
  problems.push(`cannot read git HEAD at ${REPO}`);
}
if (dirty.length) problems.push(`${dirty.length} tracked source file(s) modified on the production host: ${dirty.slice(0, 5).join(", ")}`);
if (untracked.length) problems.push(`${untracked.length} untracked source file(s) on the production host: ${untracked.slice(0, 5).join(", ")}`);

let live = null;
if (!SKIP_REMOTE) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), Number(process.env.TIMEOUT_MS || 20000));
    const r = await fetch(`${BASE}/fw-assets/__build.json?cb=${Date.now()}`, { signal: ctl.signal, redirect: "follow", cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } });
    clearTimeout(t);
    if (r.status !== 200) problems.push(`${BASE}/fw-assets/__build.json returned ${r.status} — production cannot state its SHA`);
    else live = await r.json().catch(() => null);
    if (!SKIP_REMOTE && r.status === 200 && !live) problems.push(`${BASE}/fw-assets/__build.json is not valid JSON`);
  } catch (e) {
    problems.push(`${BASE}/fw-assets/__build.json unreachable: ${String(e).slice(0, 100)}`);
  }
}

// ---- cross-comparisons ----------------------------------------------------
const sha = (o) => (o && o.sha) || null;
if (expected && local && sha(expected) && sha(local) && sha(expected) !== sha(local)) {
  problems.push(`verified deploy ${sha(expected).slice(0, 8)} != built output ${sha(local).slice(0, 8)} — dist/ was rebuilt outside a verified deploy`);
}
if (expected && head && sha(expected) && sha(expected) !== head) {
  problems.push(`verified deploy ${sha(expected).slice(0, 8)} != current HEAD ${head.slice(0, 8)} — the tree moved since the last verified deploy`);
}
if (live && local && sha(live) && sha(local) && sha(live) !== sha(local)) {
  problems.push(`production serves ${sha(live).slice(0, 8)} but this box built ${sha(local).slice(0, 8)} — a different build is live`);
}
if (live && local && live.assets && local.assets && live.assets !== local.assets) {
  problems.push(`asset fingerprint differs (live ${String(live.assets).slice(0, 8)} vs local ${String(local.assets).slice(0, 8)}) — dist/ changed without a rebuild`);
}

// ---- report ---------------------------------------------------------------
console.log(`check:production-drift — repo ${REPO}, base ${BASE}`);
console.log(`  1 EXPECTED (verified deploy) : ${expected ? `${String(expected.sha).slice(0, 12)}  verify=${expected.verify}  at ${expected.deployedAt}` : "(none recorded)"}`);
console.log(`  2 DEPLOYED (build stamp)     : ${local ? `${String(local.sha).slice(0, 12)}  dirty=${local.dirty}  built ${local.builtAt}` : "(none)"}`);
console.log(`  3 ACTUAL   (live endpoint)   : ${live ? `${String(live.sha).slice(0, 12)}  built ${live.builtAt}` : SKIP_REMOTE ? "(skipped)" : "(unavailable)"}`);
console.log(`    ACTUAL   (working tree)    : HEAD ${head ? head.slice(0, 12) : "?"}  modified=${dirty.length}  untracked=${untracked.length}`);

if (problems.length) {
  console.error(`\nDRIFT — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(`\nFailing closed. Production state is not provably the verified state.`);
  process.exit(1);
}
console.log("\nPASS — verified SHA, built output, live production and working tree all agree.");
