// State hubs (/p/pool-rentals-{state}, /p/pool-rentals, sitemap-static) link every host-city page
// they read. Guards the read: live pages only (status="published", no redirect_to), never the
// is_published column (false on ~99% of rows: filtering on it emptied every hub for 19 days),
// and a stable order so the 1,000-row pages cannot skip or repeat a slug.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/server/state-hub.functions.ts", import.meta.url), "utf8");
const fn = src.slice(
  src.indexOf("async function fetchAllHostAcqSlugs"),
  src.indexOf("interface ParsedRow"),
);
const code = fn
  .split("\n")
  .filter((l) => !l.trim().startsWith("//"))
  .join("\n");

test("state hub slug read exists", () => {
  assert.ok(code.includes('.from("content_pages")'), "fetchAllHostAcqSlugs not found");
});

test("state hubs read live pages only: status published", () => {
  assert.match(code, /\.eq\("status",\s*"published"\)/);
});

test("state hubs read live pages only: no redirect_to", () => {
  assert.match(code, /\.is\("redirect_to",\s*null\)/);
});

test("state hubs never filter on is_published", () => {
  assert.doesNotMatch(code, /is_published/);
});

test("state hub pages are read in a stable order", () => {
  assert.match(code, /\.order\("slug"/);
  assert.ok(code.indexOf(".order(") < code.indexOf(".range("), "order must come before range");
});
