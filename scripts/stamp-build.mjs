#!/usr/bin/env node
/**
 * stamp-build — record, inside the build output itself, exactly what this build
 * was made from.
 *
 * Wired as npm's `postbuild`, so it runs automatically after every
 * `npm run build`. That placement is the point: the stamp is produced by the
 * build, not by a deploy wrapper, so a deploy that skips the wrapper still
 * carries an honest stamp and still gets caught by check:production-drift.
 *
 * Writes dist/client/__build.json, which serve.mjs already serves as a static
 * file — no server change, no new route, no restart semantics to get wrong.
 * Production can therefore be asked what it is running:
 *
 *     curl https://www.poolrentalnearme.com/__build.json
 *
 * Fields:
 *   sha         git HEAD at build time
 *   tree        git tree hash at build time (changes even if HEAD does not)
 *   dirty       count of modified/untracked SOURCE files at build time
 *   dirtyFiles  up to 20 of them, so drift is diagnosable, not just detectable
 *   branch      branch name, informational
 *   assets      sha256 over the sorted fw-assets filenames — a fingerprint of
 *               the emitted bundle, so a rebuild from identical source is
 *               distinguishable from a hand-edited dist
 *   builtAt     ISO timestamp
 *
 * A build outside a git checkout is stamped sha:"unknown" rather than failing —
 * the drift check treats "unknown" as drift, which is the correct fail-closed
 * behaviour without breaking someone's local build.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.REPO_DIR || join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "dist", "client");
const OUT = join(OUT_DIR, "__build.json");

// Generated, runtime or backup paths are not "source" for dirtiness purposes.
const IGNORE = [
  /^dist\//, /^\.output\//, /^node_modules\//, /^\.vinxi\//, /^\.nitro\//, /^\.tanstack\//,
  /^dist-server-bak/, /^dist\.bak/, /\.bak($|-|\.)/, /\.v2bak/, /\.log$/, /^logs?\//,
  /^\.cache\//, /^\.deployed-sha$/, /^\.env/, /^dump\.pm2$/,
];
const ignored = (p) => IGNORE.some((r) => r.test(p));

const gitRaw = (args) =>
  execSync(`git -c safe.directory=${ROOT} -C ${ROOT} ${args}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
const git = (args) => gitRaw(args).trim();

// `git status --porcelain` puts the status code in columns 1-2 and the path at
// column 4. Trimming the whole output eats the leading space of an unstaged
// line (" M x" -> "M x") and shifts that first path by one character, so the
// status output is parsed untrimmed, line by line.
const statusPaths = () =>
  gitRaw("status --porcelain")
    .split("\n")
    .filter((l) => l.length > 3)
    .map((l) => l.slice(3).replace(/^"|"$/g, "").trimEnd());

let sha = "unknown", tree = "unknown", branch = "unknown";
let dirtyFiles = [];
try {
  sha = git("rev-parse HEAD");
  tree = git("rev-parse HEAD^{tree}");
  branch = git("rev-parse --abbrev-ref HEAD");
  dirtyFiles = statusPaths().filter((p) => !ignored(p));
} catch {
  console.warn("stamp-build: not a git checkout — stamping sha:unknown (drift check will fail closed)");
}

// Fingerprint the emitted bundle by its content-hashed filenames.
let assets = "none";
const assetDir = join(OUT_DIR, "fw-assets");
if (existsSync(assetDir)) {
  const names = readdirSync(assetDir).sort();
  assets = createHash("sha256").update(names.join("\n")).digest("hex");
}

const info = {
  sha,
  tree,
  branch,
  dirty: dirtyFiles.length,
  dirtyFiles: dirtyFiles.slice(0, 20),
  assets,
  builtAt: new Date().toISOString(),
};

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(info, null, 2) + "\n");
console.log(
  `stamp-build: ${OUT} -> sha ${sha.slice(0, 8)} tree ${tree.slice(0, 8)} dirty ${info.dirty} assets ${assets.slice(0, 8)}`,
);
if (info.dirty) {
  console.warn(`stamp-build: WARNING built from ${info.dirty} uncommitted source change(s):`);
  for (const p of info.dirtyFiles) console.warn(`  ${p}`);
}
