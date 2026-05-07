#!/usr/bin/env node
/**
 * Validates that every page template:
 *   1. imports BreadcrumbsWithSchema (or has an explicit waiver), AND
 *   2. renders it (i.e. produces visible breadcrumbs + JSON-LD), AND
 *   3. the JSON-LD output of BreadcrumbsWithSchema is a valid BreadcrumbList.
 *
 * Pure static + a single render assertion — no test runner needed.
 *
 *   node scripts/check-breadcrumb-jsonld.mjs
 *
 * Exit code 0 = pass, 1 = fail.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

// Templates intentionally without breadcrumbs (none today).
const WAIVERS = new Set([]);

const TEMPLATES_DIR = "src/components/templates";
const failures = [];

// 1. Static scan: every template file must import + render BreadcrumbsWithSchema.
const files = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith(".tsx"));
for (const f of files) {
  if (WAIVERS.has(f)) continue;
  const src = readFileSync(join(TEMPLATES_DIR, f), "utf8");
  if (!/from\s+["']@\/components\/breadcrumbs-jsonld["']/.test(src)) {
    failures.push(`${f}: missing import of BreadcrumbsWithSchema`);
    continue;
  }
  if (!/<BreadcrumbsWithSchema[\s/>]/.test(src)) {
    failures.push(`${f}: imports BreadcrumbsWithSchema but never renders it`);
  }
}

// 2. Render-time assertion: the component itself emits a valid BreadcrumbList.
//    We import via tsx-friendly dynamic import so this works under Bun/Node20+.
let BreadcrumbsWithSchema;
try {
  ({ BreadcrumbsWithSchema } = await import("../src/components/breadcrumbs-jsonld.tsx"));
} catch (e) {
  console.error("Could not import BreadcrumbsWithSchema:", e.message);
  process.exit(1);
}

// Stub <Link> so renderToStaticMarkup doesn't need a router.
// (TanStack's Link reads from RouterContext; rendering bare gives a plain anchor.)
const items = [
  { name: "Home", path: "/" },
  { name: "Public pools", path: "/p/public-pools" },
  { name: "Pool rentals in Austin", path: "/p/pool-rentals-austin-tx" },
];

let html;
try {
  html = renderToStaticMarkup(React.createElement(BreadcrumbsWithSchema, { items }));
} catch (e) {
  failures.push(`BreadcrumbsWithSchema render threw: ${e.message}`);
}

if (html) {
  // Visible breadcrumbs
  if (!/aria-label="Breadcrumb"/.test(html)) {
    failures.push("Render output missing visible <nav aria-label=\"Breadcrumb\">");
  }
  for (const it of items) {
    if (!html.includes(it.name)) failures.push(`Render output missing crumb name: ${it.name}`);
  }
  // JSON-LD payload
  const m = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) {
    failures.push("Render output missing application/ld+json <script>");
  } else {
    let parsed;
    try { parsed = JSON.parse(m[1]); }
    catch (e) { failures.push(`JSON-LD is not valid JSON: ${e.message}`); }
    if (parsed) {
      if (parsed["@context"] !== "https://schema.org") failures.push("JSON-LD @context wrong");
      if (parsed["@type"] !== "BreadcrumbList") failures.push("JSON-LD @type must be BreadcrumbList");
      if (!Array.isArray(parsed.itemListElement) || parsed.itemListElement.length !== items.length) {
        failures.push("JSON-LD itemListElement length mismatch");
      } else {
        parsed.itemListElement.forEach((el, i) => {
          if (el["@type"] !== "ListItem") failures.push(`item[${i}] @type must be ListItem`);
          if (el.position !== i + 1) failures.push(`item[${i}] position must be ${i + 1}`);
          if (el.name !== items[i].name) failures.push(`item[${i}] name mismatch`);
          if (typeof el.item !== "string" || !/^https?:\/\//.test(el.item)) {
            failures.push(`item[${i}] item must be absolute URL, got: ${el.item}`);
          }
        });
      }
    }
  }

  // 3. Empty/null safety: empty items list must render nothing.
  const empty = renderToStaticMarkup(React.createElement(BreadcrumbsWithSchema, { items: [] }));
  if (empty !== "") failures.push(`Empty items should render nothing, got: ${empty}`);
}

if (failures.length) {
  console.error(`\n✗ Breadcrumb JSON-LD check failed (${failures.length} issue${failures.length > 1 ? "s" : ""}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`✓ Breadcrumb JSON-LD check passed (${files.length} templates verified, schema valid).`);
