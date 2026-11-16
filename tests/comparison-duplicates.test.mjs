// The explicit comparison-duplicate redirect list (audit F6(a)):
// src/lib/comparison-duplicates.ts, generated from checked-in evidence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as dupes from "../src/lib/comparison-duplicates.ts";

const { COMPARISON_DUPLICATE_REDIRECTS, comparisonDuplicateTarget, isComparisonDuplicatePath } = dupes;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "ops/seo-repairs-2026-11/comparison-duplicates");
const entries = Object.entries(COMPARISON_DUPLICATE_REDIRECTS);

test("the checked-in list is what the generator makes from the checked-in inputs", () => {
  const out = execFileSync(process.execPath, [join(DIR, "generate.mjs"), "--check"], { encoding: "utf8" });
  assert.match(out, /up to date: 78 confirmed, 0 rejected/);
});

test("78 pairs, exactly the evidence pairs, each bare URL -> its state-suffixed twin", () => {
  const evidence = JSON.parse(readFileSync(join(DIR, "evidence-2026-11-14-exact-dups.json"), "utf8"));
  assert.equal(entries.length, 78);
  assert.deepEqual(
    new Map(entries),
    new Map(evidence.map(([a, b]) => [a, b])),
  );
  for (const [from, to] of entries) {
    assert.match(from, /^\/p\/(giggster|peerspace)-vs-pool-rental-near-me-in-[a-z0-9-]+$/);
    assert.match(to, /-[a-z]{2}$/);
    assert.equal(to.slice(0, -3), from, `${from} -> ${to}`);
  }
});

test("one hop: no target is itself redirected by the list", () => {
  for (const [, to] of entries) assert.equal(isComparisonDuplicatePath(to), false, to);
});

test("none of the 13 comparison URLs a content row already redirects is in the list", () => {
  const redirected = [
    "giggster-vs-pool-rental-near-me-in-carlsbad",
    "giggster-vs-pool-rental-near-me-in-round-rock",
    "giggster-vs-pool-rental-near-me-in-tampa-fl",
    "peerspace-vs-pool-rental-near-me-in-escondido-ca",
    "peerspace-vs-pool-rental-near-me-in-hayward-ca",
    "peerspace-vs-pool-rental-near-me-in-memphis",
    "peerspace-vs-pool-rental-near-me-in-mesa-az",
    "peerspace-vs-pool-rental-near-me-in-murrieta",
    "peerspace-vs-pool-rental-near-me-in-phoenix-md",
    "peerspace-vs-pool-rental-near-me-in-raleigh-nc",
    "peerspace-vs-pool-rental-near-me-in-richmond",
    "peerspace-vs-pool-rental-near-me-in-roseville-ca",
    "peerspace-vs-pool-rental-near-me-in-tulsa",
  ];
  for (const slug of redirected) {
    assert.equal(isComparisonDuplicatePath(`/p/${slug}`), false, slug);
    assert.ok(!entries.some(([, to]) => to === `/p/${slug}`), slug);
  }
});

test("exact path match only: no general strip/append-state rule", () => {
  assert.equal(
    comparisonDuplicateTarget("/p/giggster-vs-pool-rental-near-me-in-boston"),
    "/p/giggster-vs-pool-rental-near-me-in-boston-ma",
  );
  for (const p of [
    "/p/giggster-vs-pool-rental-near-me-in-boston-ma",
    "/p/giggster-vs-pool-rental-near-me-in-boston/",
    "/p/giggster-vs-pool-rental-near-me-in-Boston",
    "/p/giggster-vs-pool-rental-near-me-in-boston?x=1",
    "/p/giggster-vs-pool-rental-near-me-in-los-angeles", // hub tier: text differs from -ca
    "/p/giggster-vs-pool-rental-near-me-in-new-york",
    "/p/peerspace-vs-pool-rental-near-me-in-akron",
    "/p/giggster-vs-pool-rental-near-me",
    "/p/toString",
    "/p/__proto__",
  ]) {
    assert.equal(comparisonDuplicateTarget(p), null, p);
  }
});

// Integration trial 2026-11-16, defect 2: a comparison head() must never emit
// a canonical whose path is a 301 source on the list.
test("comparisonCanonicalPath: a listed bare URL names its twin, every other path itself", () => {
  assert.equal(typeof dupes.comparisonCanonicalPath, "function", "comparisonCanonicalPath is exported");
  for (const [from, to] of entries) {
    assert.equal(dupes.comparisonCanonicalPath(from), to, from);
    assert.equal(dupes.comparisonCanonicalPath(to), to, to);
    assert.equal(isComparisonDuplicatePath(dupes.comparisonCanonicalPath(from)), false, from);
  }
  for (const p of [
    "/p/peerspace-vs-pool-rental-near-me-in-akron",
    "/p/giggster-vs-pool-rental-near-me-in-los-angeles",
    "/p/giggster-vs-pool-rental-near-me",
  ]) {
    assert.equal(dupes.comparisonCanonicalPath(p), p, p);
  }
});

// Defect 3: /p/<bare>/ reaches the twin in ONE 301 (src/start.ts), and no
// other URL's trailing-slash handling changes.
test("comparisonDuplicateSlashRedirect: only a listed bare URL plus trailing slash(es)", () => {
  assert.equal(typeof dupes.comparisonDuplicateSlashRedirect, "function", "comparisonDuplicateSlashRedirect is exported");
  for (const [from, to] of entries) {
    assert.equal(dupes.comparisonDuplicateSlashRedirect(`${from}/`), to, `${from}/`);
    assert.equal(dupes.comparisonDuplicateSlashRedirect(`${from}//`), to, `${from}//`);
    // Without a slash the route's own beforeLoad 301 answers it.
    assert.equal(dupes.comparisonDuplicateSlashRedirect(from), null, from);
    // The twin keeps the router's 307 strip.
    assert.equal(dupes.comparisonDuplicateSlashRedirect(`${to}/`), null, `${to}/`);
  }
  for (const p of [
    "/",
    "//",
    "/p/",
    "/p/fixture-live-page/",
    "/p/peerspace-vs-pool-rental-near-me-in-akron/",
    "/p/giggster-vs-pool-rental-near-me-in-Boston/",
    "/p/giggster-vs-pool-rental-near-me/",
    "/p/__proto__/",
  ]) {
    assert.equal(dupes.comparisonDuplicateSlashRedirect(p), null, p);
  }
});
