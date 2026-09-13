#!/usr/bin/env node
/**
 * check:types — `tsc --noEmit`, failing closed on anything new.
 *
 * Why this exists, concretely. On 2026-09-13 the homepage shipped with
 * `useRef` used but not imported. `npm run build` is `vite build`, which strips
 * types with esbuild and never typechecks, so the build succeeded. The page
 * threw `ReferenceError: useRef is not defined` on every render and served a
 * bare shell — header and footer, no hero, no listings — and returned HTTP 200
 * while doing it, so all nine deploy gates passed and recorded the build as
 * "verified". A typecheck would have caught it as TS2304 before the build ran.
 *
 * The repo carries a handful of pre-existing errors that are not worth blocking
 * a deploy on (TanStack Router narrows `<Link to>` to a literal union, and a few
 * pages pass a computed `/p/${string}`). Those are baselined below by
 * file+code+count. Anything else — a new file, a new error code, or MORE of a
 * baselined code in the same file — fails.
 *
 * To re-baseline deliberately: UPDATE_TYPECHECK_BASELINE=1 node scripts/check-types.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, "typecheck.baseline.json");

let raw = "";
try {
  raw = execSync("npx tsc --noEmit -p tsconfig.json", {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  raw = `${e.stdout || ""}${e.stderr || ""}`;
}

const LINE = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
const errors = [];
for (const line of raw.split("\n")) {
  const m = LINE.exec(line.trim());
  if (m) errors.push({ file: m[1], code: m[4], msg: m[5] });
}

// file+code -> count. Line numbers deliberately excluded: an unrelated edit
// above a baselined error must not turn the gate red.
const tally = (list) => {
  const out = {};
  for (const e of list) out[`${e.file}|${e.code}`] = (out[`${e.file}|${e.code}`] ?? 0) + 1;
  return out;
};
const current = tally(errors);

if (process.env.UPDATE_TYPECHECK_BASELINE === "1") {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2) + "\n");
  console.log(`baseline written: ${Object.keys(current).length} entr(ies), ${errors.length} error(s)`);
  process.exit(0);
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
const problems = [];
for (const [key, n] of Object.entries(current)) {
  const allowed = baseline[key] ?? 0;
  if (n > allowed) {
    const [file, code] = key.split("|");
    problems.push(
      `${file}: ${n} x ${code}, baseline allows ${allowed}` +
      (allowed === 0 ? " (NEW)" : " (increased)"),
    );
  }
}

console.log(`check:types — ${errors.length} error(s), ${Object.keys(baseline).length} baselined entr(ies)`);
if (problems.length) {
  console.error(`\nTYPE ERRORS — ${problems.length} beyond the baseline:`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error("\nOffending messages:");
  for (const e of errors) {
    const key = `${e.file}|${e.code}`;
    if ((current[key] ?? 0) > (baseline[key] ?? 0)) console.error(`  ${e.file}  ${e.code}  ${e.msg.slice(0, 150)}`);
  }
  console.error("\nFix them, or re-baseline on purpose with UPDATE_TYPECHECK_BASELINE=1.");
  process.exit(1);
}
console.log("PASS — no type errors beyond the recorded baseline.");
