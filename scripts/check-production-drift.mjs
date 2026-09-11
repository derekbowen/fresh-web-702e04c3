#!/usr/bin/env node
/**
 * check:production-drift — is the running production tree the Git state we think
 * we deployed?
 *
 * Compares, on the production host:
 *   - the recorded deployed SHA        (.deployed-sha, written by the deploy)
 *   - current Git HEAD
 *   - tracked working-tree modifications
 *   - untracked files under source paths
 *
 * Ignores build output, logs, cache, runtime state and in-place .bak files.
 *
 * Runs locally on the production host (it shells out to git). Exit 1 on drift.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const REPO = process.env.REPO_DIR || "/home/ubuntu/fresh-web";
const SHA_FILE = process.env.DEPLOYED_SHA_FILE || `${REPO}/.deployed-sha`;
const g = (args) =>
  execSync(`git -c safe.directory=${REPO} -C ${REPO} ${args}`, { encoding: "utf8" }).trim();

// Paths whose contents are generated or runtime state, not source.
const IGNORE = [
  /^dist\//, /^\.output\//, /^node_modules\//, /^\.vinxi\//, /^\.nitro\//, /^\.tanstack\//,
  /^dist-server-bak/, /\.bak($|-)/, /\.v2bak/, /\.log$/, /^logs?\//, /^\.cache\//,
  /^\.deployed-sha$/, /^\.env/,
];
const ignored = (p) => IGNORE.some((r) => r.test(p));

const problems = [];
let head, deployed = null;
try { head = g("rev-parse HEAD"); }
catch (e) { console.error(`FAIL — cannot read git HEAD at ${REPO}`); process.exit(1); }

if (existsSync(SHA_FILE)) deployed = readFileSync(SHA_FILE, "utf8").trim();

if (!deployed) {
  problems.push(`no deployed SHA recorded at ${SHA_FILE} — deploys are not stamping what they shipped`);
} else if (deployed !== head) {
  problems.push(`deployed SHA ${deployed.slice(0, 8)} != current HEAD ${head.slice(0, 8)}`);
}

const status = g("status --porcelain").split("\n").filter(Boolean);
const dirty = [], untracked = [];
for (const line of status) {
  const code = line.slice(0, 2), p = line.slice(3).replace(/^"|"$/g, "");
  if (ignored(p)) continue;
  (code.includes("?") ? untracked : dirty).push(p);
}
if (dirty.length) problems.push(`${dirty.length} tracked source file(s) modified on the production host`);
if (untracked.length) problems.push(`${untracked.length} untracked source file(s) on the production host`);

console.log(`repo            : ${REPO}`);
console.log(`HEAD            : ${head}`);
console.log(`deployed SHA    : ${deployed || "(none recorded)"}`);
console.log(`modified source : ${dirty.length}`);
console.log(`untracked source: ${untracked.length}`);

if (problems.length) {
  console.error("\nFAIL — production drift detected");
  for (const p of problems) console.error(`  - ${p}`);
  for (const p of [...dirty, ...untracked].slice(0, 40)) console.error(`      ${p}`);
  if (dirty.length + untracked.length > 40) console.error(`      ... and ${dirty.length + untracked.length - 40} more`);
  process.exit(1);
}
console.log("\nPASS — production matches deployed Git state");
