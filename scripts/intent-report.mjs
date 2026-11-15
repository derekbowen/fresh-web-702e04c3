#!/usr/bin/env node
/**
 * intent-report — before/after numbers for the host_acq_city intent split
 * (docs/seo-repairs-2026-11/intent.md). Reads an export of the production
 * rows, never the database itself, and runs the SAME modules the pages run:
 *
 *   src/lib/city-intent.ts       classification, place, <title>, H1
 *   src/lib/search-links.ts      the one /s?address= form
 *   src/lib/host-acq-variants.ts the A/B/C/D title_variant copy (unchanged)
 *   src/lib/city-slug.ts         the old place parsing (for "before")
 *
 * Usage:  node scripts/intent-report.mjs <export.json> [--json]
 *
 * The export is one read-only query (run it as-is, e.g. through the Supabase
 * SQL editor or MCP, and save the `export` value as JSON):
 *
 *   set transaction read only;
 *   select json_build_object(
 *    'exported_at', now(),
 *    'cities', (select json_agg(json_build_array(slug, name, state_code, latitude, longitude)
 *               order by slug) from cities where is_published),
 *    'listings', (select json_agg(json_build_array(city_slug, state_code, latitude, longitude)
 *               order by sharetribe_id) from synced_listings
 *               where state='published' and is_deleted=false and primary_image_url is not null
 *                 and slug is not null and sharetribe_id is not null),
 *    'listings_synced_max', (select max(updated_at) from synced_listings),
 *    'pages', (select json_agg(json_build_array(p.slug, p.title, p.seo_title, p.title_variant,
 *               p.in_sitemap,
 *               (select coalesce(json_agg(m[1]), '[]'::json)
 *                  from regexp_matches(coalesce(nullif(p.body_markdown,''), p.content, ''),
 *                                      '\]\((/s\?[^)\s]*)\)', 'g') m),
 *               nullif(btrim(p.redirect_to), '')) order by p.slug)
 *              from content_pages p
 *              where p.template_type='host_acq_city' and p.status='published')) export;
 *
 * A published row with a redirect_to never renders: lookupContentPage answers
 * it with a 301 (56 such host_acq_city rows on 2026-11-15). Every count below
 * is over the rows that RENDER ("served"), and over the served rows that are
 * in the sitemap.
 *
 * "Before" reproduces the template and head() as of b3e2ace: H1 "Rent your
 * {City} pool by the hour. 0% host fees. Keep 100%." (or the variant H1),
 * <title> = seo_title || "{title} | Pool Rental Near Me" (or the variant title),
 * cities row looked up only for become-a-…host- slugs, and the related link
 * /p/pool-pros?city={City}.
 */
import { readFileSync } from "node:fs";
import {
  classifyCityIntent,
  slugIdentity,
  placeForPage,
  cityPageCopy,
} from "../src/lib/city-intent.ts";
import { normalizeSearchHref, searchHrefForPlace, searchHrefForState } from "../src/lib/search-links.ts";
import { getVariantCopy, normalizeTitleVariant } from "../src/lib/host-acq-variants.ts";
import { cityForContentPage, parseCitySlug } from "../src/lib/city-slug.ts";
import { titlePlace, inventorySummaryOf, renterInventoryState } from "../src/lib/city-intent.ts";
import { ADVOCACY_STATES } from "../src/lib/advocacy-states.ts";
import { STATE_NAMES } from "../src/lib/states.ts";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/intent-report.mjs <export.json> [--json]");
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, "utf8"));
const pages = data.pages.map(
  ([slug, title, seo_title, title_variant, in_sitemap, links, redirect_to]) => ({
    slug,
    title,
    seo_title,
    title_variant,
    in_sitemap,
    links: links ?? [],
    redirect_to: redirect_to ?? null,
  }),
);
/** content-page-lookup.ts: a published row's redirect_to (other than itself) is a 301. */
const redirects = (p) => {
  if (!p.redirect_to) return false;
  const t = p.redirect_to.startsWith("/p/") ? p.redirect_to.slice(3) : p.redirect_to;
  return !!t && t !== p.slug;
};

// ── resolveCityRow (src/server/cities.functions.ts), over the exported rows ──
const cities = data.cities.map(([slug, name, state_code, latitude, longitude]) => ({
  slug,
  name,
  state_code,
  latitude,
  longitude,
}));
const listings = (data.listings ?? []).map(([city_slug, state_code, latitude, longitude]) => ({
  city_slug,
  state_code,
  latitude,
  longitude,
}));

// ── loadCityInventory (src/server/city-inventory.functions.ts), over the export ──
// The export has no listing slug; one pool listed twice shares city, state and
// coordinates, so that is the dedupe key here (the loader keys on slug + coordinates;
// on 2026-11-15 both keys find the same single duplicate pair, Rocky Point NY).
const cityKey = (c) =>
  c
    ? c
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || null
    : null;
const rad = (d) => (d * Math.PI) / 180;
const miles = (aLat, aLng, bLat, bLng) => {
  const h =
    Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
};
const lkey = (l) => `${l.city_slug}|${l.state_code}|${l.latitude}|${l.longitude}`;
const dedupeListings = (ls) => {
  const seen = new Set();
  return ls.filter((l) => (seen.has(lkey(l)) ? false : (seen.add(lkey(l)), true)));
};
function inventoryFor(place, centre, { dedupe = true } = {}) {
  const pool = dedupe ? dedupeListings(listings) : listings;
  const key = cityKey(place.cityName);
  const st = place.stateCode;
  const exact = key && st ? pool.filter((l) => l.city_slug === key && l.state_code === st) : [];
  const lat = centre?.latitude == null ? null : Number(centre.latitude);
  const lng = centre?.longitude == null ? null : Number(centre.longitude);
  if (exact.length >= 3 || lat == null || lng == null) {
    return { exactTotal: exact.length, nearbyTotal: 0, nearestMi: null, nearbyChecked: false };
  }
  const exactKeys = new Set(exact.map(lkey));
  const near = pool
    .filter((l) => !exactKeys.has(lkey(l)) && l.latitude != null && l.longitude != null)
    .map((l) => miles(lat, lng, l.latitude, l.longitude))
    .filter((mi) => mi <= 60)
    .sort((a, b) => a - b);
  return { exactTotal: exact.length, nearbyTotal: near.length, nearestMi: near[0] ?? null, nearbyChecked: true };
}
const stateOf = (inv) =>
  renterInventoryState(
    inventorySummaryOf({
      exact: Array(inv.exactTotal).fill(0),
      nearby: inv.nearestMi == null ? [] : [{ mi: inv.nearestMi }],
      nearbyTotal: inv.nearbyTotal,
      radiusMi: inv.nearbyTotal ? 60 : null,
      nearbyChecked: inv.nearbyChecked,
    }),
  );
const bySlug = new Map(cities.map((c) => [c.slug, c]));
const US = new Set(
  "al ak az ar ca co ct de fl ga hi id il in ia ks ky la me md ma mi mn ms mo mt ne nv nh nj nm ny nc nd oh ok or pa ri sc sd tn tx ut vt va wa wv wi wy dc".split(
    " ",
  ),
);
/** maybeSingle(): exactly one row, otherwise null (0 rows, or an error on 2+). */
const single = (rows) => (rows.length === 1 ? rows[0] : null);
function resolveCityRow(slug) {
  if (!slug) return null;
  const exact = bySlug.get(slug);
  if (exact) return exact;
  const m = /^(.+)-([a-z]{2})$/.exec(slug);
  if (!m || !US.has(m[2])) return null;
  const st = m[2].toUpperCase();
  const step2 = single(cities.filter((c) => c.slug === m[1] && c.state_code === st));
  if (step2) return step2;
  const name = m[1]
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  return single(
    cities.filter(
      (c) => c.state_code === st && (c.name ?? "").toLowerCase() === name.toLowerCase(),
    ),
  );
}

// ── before (b3e2ace) ─────────────────────────────────────────────────────────
function before(p) {
  const citySlug = cityForContentPage("host_acq_city", p.slug);
  const row = citySlug ? resolveCityRow(citySlug) : null;
  const fb = parseCitySlug(citySlug ?? p.slug);
  const raw = row?.name || fb.city || "your city";
  const st = (row?.state_code || fb.stateCode || "").toUpperCase();
  const cityName =
    st && raw.toUpperCase().endsWith(" " + st)
      ? raw.slice(0, raw.length - st.length - 1).trimEnd()
      : raw;
  const variant = normalizeTitleVariant(p.title_variant);
  // head() parsed the city from cityForContentPage only and did not strip.
  const headParsed = citySlug ? parseCitySlug(citySlug) : null;
  const headCity = row?.name || headParsed?.city || "your city";
  const headSt = (row?.state_code || headParsed?.stateCode || "").toUpperCase();
  const h1 = variant
    ? getVariantCopy(variant, cityName, st).h1
    : `Rent your ${cityName} pool by the hour. 0% host fees. Keep 100%.`;
  const title = variant
    ? getVariantCopy(variant, headCity, headSt).title
    : p.seo_title || `${p.title || p.slug} | Pool Rental Near Me`;
  const links = [...p.links, `/p/pool-pros?city=${encodeURIComponent(cityName)}`];
  return { h1, title, links };
}

// ── after (this change) ──────────────────────────────────────────────────────
// The renter primary CTA links the map search for the city whenever the page
// has pools in or near it, or could not check nearby (no coordinates).
function after(p) {
  const id = slugIdentity(p);
  const row = resolveCityRow(id.lookupSlug);
  const place = placeForPage(p, row);
  const copy = cityPageCopy(p, place, row);
  // p.$slug.tsx: the bare "<city>" row is the inventory centre when it is the
  // same state and has coordinates.
  const bare = id.centroidSlug ? bySlug.get(id.centroidSlug) : null;
  const centre =
    bare && place.stateCode && bare.state_code === place.stateCode && bare.latitude != null && bare.longitude != null
      ? bare
      : row;
  const inv = inventoryFor(place, centre);
  const state = stateOf(inv);
  const links = [...p.links.map(normalizeSearchHref), "/p/pool-pros"];
  if (copy.intent === "renter" && (state === "exact" || state === "nearby" || state === "unchecked"))
    links.push(searchHrefForPlace(place.cityName, place.stateCode));
  return {
    h1: copy.h1.text,
    title: copy.title,
    links,
    place,
    copy,
    row,
    centre,
    inv,
    invState: state,
    invOldCentre: inventoryFor(place, row, { dedupe: false }),
  };
}

const allRows = pages.map((p) => ({
  p,
  b: before(p),
  a: after(p),
  intent: classifyCityIntent(p.slug),
}));
const rows = allRows.filter((r) => !redirects(r.p));

function dupStats(list, key) {
  const groups = new Map();
  for (const r of list) {
    const k = key(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const dups = [...groups.entries()].filter(([, g]) => g.length > 1);
  return {
    groups: dups.length,
    pages: dups.reduce((n, [, g]) => n + g.length, 0),
    examples: dups
      .sort((x, y) => y[1].length - x[1].length || x[0].localeCompare(y[0]))
      .map(([k, g]) => ({ value: k, slugs: g.map((r) => r.p.slug) })),
  };
}

/**
 * The place a /s?address= link points at, normalised INDEPENDENTLY of
 * search-links.ts (decode, "+" as space, lower-case, full state names to codes,
 * "saint"/"st." to "st", punctuation and spacing dropped). Two links with the
 * same key are the same place; if they are different URLs, that place has more
 * than one spelling. Keying on normalizeSearchHref() itself would make that
 * count zero by construction.
 */
const NAME_TO_CODE = new Map(Object.entries(STATE_NAMES).map(([c, n]) => [n.toLowerCase(), c.toLowerCase()]));
function placeKey(href) {
  const m = /^\/s\?(.*)$/.exec(href);
  if (!m) return href;
  const params = new URLSearchParams(m[1]);
  let v = params.get("address");
  if (v == null) return href.toLowerCase();
  v = v.toLowerCase().replace(/\./g, " ").replace(/\bsaint\b/g, "st").replace(/\s+/g, " ").trim();
  const parts = v.split(",").map((x) => x.trim()).filter(Boolean);
  let st = parts.length > 1 ? parts.pop() : "";
  if (NAME_TO_CODE.has(st)) st = NAME_TO_CODE.get(st);
  let city = parts.join(" ");
  if (!parts.length && NAME_TO_CODE.has(city)) {
    city = "";
    st = NAME_TO_CODE.get(v);
  }
  if (st && city.endsWith(" " + st)) city = city.slice(0, -(st.length + 1));
  return `${city.replace(/[^a-z0-9]/g, "")}|${st}`;
}

/** Distinct link targets, and places linked under more than one spelling. */
function linkStatsOf(all) {
  const search = all.filter((h) => h.startsWith("/s?"));
  const pros = all.filter((h) => h.startsWith("/p/pool-pros"));
  const byPlace = new Map();
  for (const h of search) {
    const k = placeKey(h);
    if (!byPlace.has(k)) byPlace.set(k, new Set());
    byPlace.get(k).add(h);
  }
  const multi = [...byPlace.values()].filter((x) => x.size > 1);
  return {
    searchLinks: search.length,
    distinctSearchTargets: new Set(search).size,
    distinctSearchPlaces: byPlace.size,
    placesWithSeveralSpellings: multi.length,
    poolProsLinks: pros.length,
    distinctPoolProsTargets: new Set(pros).size,
    examples: multi.slice(0, 5).map((x) => [...x]),
  };
}
const linkStats = (list, side) => linkStatsOf(list.flatMap((r) => r[side].links));

// ── the other templates the commit moved to search-links.ts ─────────────────
// Each generates its /s link from data the export or the code holds:
//   comparison routes  /p/{giggster,peerspace}-vs-pool-rental-near-me-in-{city}:
//                      every published cities row, `${name}, ${state_code}`
//   advocacy           /p/host-advocacy-{state}: ADVOCACY_STATES names (2 links/page)
//   state hubs         /p/pool-rentals-{state}: the state name (2 links/page)
//   activity_city      0 published rows on 2026-11-15, so no links
function otherTemplateLinks() {
  const enc = (v) => `/s?address=${encodeURIComponent(v)}`;
  const comp = { before: [], after: [] };
  for (const c of cities) {
    for (let i = 0; i < 2; i++) {
      comp.before.push(enc(`${c.name}, ${c.state_code}`));
      comp.after.push(searchHrefForPlace(c.name, c.state_code));
    }
  }
  const adv = { before: [], after: [] };
  for (const st of ADVOCACY_STATES) {
    for (let i = 0; i < 2; i++) {
      adv.before.push(st.name ? enc(st.name) : "/s");
      adv.after.push(searchHrefForState(st.name));
    }
  }
  const hub = { before: [], after: [] };
  for (const name of Object.values(STATE_NAMES)) {
    for (let i = 0; i < 2; i++) {
      hub.before.push(enc(name));
      hub.after.push(searchHrefForState(name));
    }
  }
  const out = {};
  for (const [k, v] of Object.entries({ comparisons: comp, advocacy: adv, stateHubs: hub })) {
    out[k] = {
      before: linkStatsOf(v.before),
      after: linkStatsOf(v.after),
      changedLinks: v.before.filter((h, i) => h !== v.after[i]).length,
    };
  }
  // Across all templates: one place, several spellings?
  const all = {
    before: linkStatsOf([...rows.flatMap((r) => r.b.links), ...comp.before, ...adv.before, ...hub.before]),
    after: linkStatsOf([...rows.flatMap((r) => r.a.links), ...comp.after, ...adv.after, ...hub.after]),
  };
  return { ...out, allTemplates: all };
}

function report(list, label) {
  const residual = dupStats(list, (r) => r.a.h1);
  const sameplace = residual.examples.filter((g) => {
    const rs = g.slugs.map((s) => rows.find((r) => r.p.slug === s));
    return new Set(rs.map((r) => `${r.intent}|${r.a.place.label}`)).size === 1;
  });
  return {
    label,
    pages: list.length,
    host: list.filter((r) => r.intent === "host").length,
    renter: list.filter((r) => r.intent === "renter").length,
    renterTopic: list.filter((r) => r.intent === "renter" && r.a.place.isTopic).length,
    variantPages: list.filter((r) => r.a.copy.variant).length,
    renterWithCityRow: list.filter((r) => r.intent === "renter" && r.a.row).length,
    pagesWithCityRow: {
      before: list.filter(
        (r) =>
          r.intent === "host" &&
          cityForContentPage("host_acq_city", r.p.slug) &&
          resolveCityRow(cityForContentPage("host_acq_city", r.p.slug)),
      ).length,
      after: list.filter((r) => r.a.row).length,
    },
    noState: list.filter((r) => !r.a.place.stateCode).map((r) => r.p.slug),
    inventory: {
      renterExact: list.filter((r) => r.intent === "renter" && r.a.invState === "exact").length,
      renterNearbyOnly: list.filter((r) => r.intent === "renter" && r.a.invState === "nearby").length,
      renterUnchecked: list.filter((r) => r.intent === "renter" && r.a.invState === "unchecked").length,
      renterNone: list.filter((r) => r.intent === "renter" && r.a.invState === "none").length,
      renterUncheckedSlugs: list.filter((r) => r.intent === "renter" && r.a.invState === "unchecked").map((r) => r.p.slug),
      hostWithSection: list.filter(
        (r) => r.intent === "host" && (r.a.inv.exactTotal > 0 || r.a.inv.nearbyTotal > 0),
      ).length,
      hostWithout: list.filter(
        (r) => r.intent === "host" && !r.a.inv.exactTotal && !r.a.inv.nearbyTotal,
      ).length,
      centreMovedToBareRow: list.filter((r) => r.a.centre && r.a.row && r.a.centre !== r.a.row).length,
      countsChangedByCentreOrDedupe: list.filter(
        (r) =>
          r.a.inv.exactTotal !== r.a.invOldCentre.exactTotal ||
          r.a.inv.nearbyTotal !== r.a.invOldCentre.nearbyTotal,
      ).length,
    },
    variantRowsChanged: {
      title: list.filter((r) => r.a.copy.variant && r.a.title !== r.b.title).map((r) => r.p.slug),
      h1: list.filter((r) => r.a.copy.variant && r.a.h1 !== r.b.h1).map((r) => r.p.slug),
    },
    hostControlTitleReplaced: list.filter(
      (r) => r.intent === "host" && !r.a.copy.variant && r.a.title !== r.b.title,
    ).length,
    placeDiffersFromStoredTitle: list
      .filter((r) => {
        const t = titlePlace(r.p.title) ?? titlePlace(r.p.seo_title);
        return (
          t &&
          !r.a.place.isTopic &&
          t.stateCode === r.a.place.stateCode &&
          t.city.toLowerCase().replace(/[^a-z]/g, "") !== r.a.place.cityName.toLowerCase().replace(/[^a-z]/g, "")
        );
      })
      .map((r) => `${r.p.slug}: page "${r.a.place.label}" vs title "${(titlePlace(r.p.title) ?? titlePlace(r.p.seo_title)).city}"`),
    h1: { before: dupStats(list, (r) => r.b.h1), after: residual },
    title: { before: dupStats(list, (r) => r.b.title), after: dupStats(list, (r) => r.a.title) },
    sameHostRenterH1: {
      before: countHostRenterPairs(list, "b"),
      after: countHostRenterPairs(list, "a"),
    },
    residualH1SamePlaceGroups: sameplace.length,
    links: { before: linkStats(list, "b"), after: linkStats(list, "a") },
  };
}

/** Cities with both a RENTER and a HOST page: how many pairs share an H1. */
function countHostRenterPairs(list, side) {
  const key = (r) => `${r.a.place.cityName.toLowerCase()}|${r.a.place.stateCode ?? ""}`;
  const host = new Map();
  for (const r of list) if (r.intent === "host") host.set(key(r), r);
  let pairs = 0;
  let same = 0;
  for (const r of list) {
    if (r.intent !== "renter") continue;
    const h = host.get(key(r));
    if (!h) continue;
    pairs++;
    if (h[side].h1 === r[side].h1) same++;
  }
  return { pairs, sameH1: same };
}

// ── duplicate URLs for one place: the data fix this report proposes ─────────
// Two published rows about the same place with the same intent cannot carry
// different headings honestly; the fix is to 301 all but one (status
// 'redirect' + redirect_to, the mechanism lookupContentPage already honours).
// Keeper: the row whose slug is the canonical form for its intent
// (become-a-swimming-pool-host-<city>-<st> / <city>-<st>), else the one in
// the sitemap, else the first by slug.
const slugifyKey = (x) =>
  x
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
function canonicalSlug(r) {
  const pl = r.a.place;
  if (!pl.stateCode) return null;
  const key = `${slugifyKey(pl.cityName)}-${pl.stateCode.toLowerCase()}`;
  return r.intent === "host" ? `become-a-swimming-pool-host-${key}` : key;
}
function duplicatePlan() {
  const bySlugRow = new Map(rows.map((r) => [r.p.slug, r]));
  const groups = new Map();
  for (const r of rows) {
    if (!r.a.place.stateCode || r.a.place.isTopic) continue;
    const k = `${r.intent}|${r.a.place.label.toLowerCase()}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const plan = [];
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const canon = canonicalSlug(g[0]);
    const keeper =
      g.find((r) => r.p.slug === canon) ??
      [...g].sort(
        (x, y) =>
          Number(y.p.in_sitemap) - Number(x.p.in_sitemap) ||
          Number(x.p.slug.includes("--")) - Number(y.p.slug.includes("--")) ||
          x.p.slug.localeCompare(y.p.slug),
      )[0];
    for (const r of g)
      if (r !== keeper)
        plan.push({
          from: r.p.slug,
          to: keeper.p.slug,
          from_in_sitemap: r.p.in_sitemap,
          to_in_sitemap: keeper.p.in_sitemap,
          why: "same place, same intent",
        });
  }
  // Bare host slugs with no state anywhere ("become-a-swimming-pool-host-carmel"):
  // when exactly one state-suffixed sibling is published, it is the same page.
  for (const r of rows) {
    if (r.a.place.stateCode) continue;
    const sibs = rows.filter((x) => x !== r && new RegExp(`^${r.p.slug}-[a-z]{2}$`).test(x.p.slug));
    if (sibs.length === 1)
      plan.push({
        from: r.p.slug,
        to: sibs[0].p.slug,
        from_in_sitemap: r.p.in_sitemap,
        to_in_sitemap: sibs[0].p.in_sitemap,
        why: "bare slug, one state-suffixed sibling",
      });
  }
  void bySlugRow;
  return plan.sort((a, b) => a.from.localeCompare(b.from));
}
const plan = duplicatePlan();
const redirected = new Set(plan.map((x) => x.from));
const afterPlan = rows.filter((r) => !redirected.has(r.p.slug));

const out = {
  exported_at: data.exported_at,
  duplicatePlan: plan,
  afterDuplicatePlan: {
    pages: afterPlan.length,
    h1: dupStats(afterPlan, (r) => r.a.h1),
    title: dupStats(afterPlan, (r) => r.a.title),
    sitemapH1: dupStats(
      afterPlan.filter(
        (r) => r.p.in_sitemap || plan.some((x) => x.to === r.p.slug && x.from_in_sitemap),
      ),
      (r) => r.a.h1,
    ),
  },
  publishedRows: allRows.length,
  redirectingRows: allRows.length - rows.length,
  all: report(rows, "served host_acq_city rows (published, no redirect_to)"),
  otherTemplates: otherTemplateLinks(),
  sitemap: report(
    rows.filter((r) => r.p.in_sitemap),
    "served rows in the sitemap",
  ),
  samples: Object.fromEntries(
    [
      "become-a-swimming-pool-host-aberdeen-sd",
      "become-a-swimming-pool-host-springfield-mo",
      "become-a-swimming-pool-host-reston",
      "austin-tx",
      "chapel-hill",
      "fresno",
      "birthday-pool-party-austin-tx",
      "houston",
      "queens",
      "rocky-point-ny",
      "chevy-chase-md",
      "become-a-swimming-pool-host-newport-ky",
      "become-a-swimming-pool-host-liguna-niguel-ca",
    ]
      .map((s) => rows.find((r) => r.p.slug === s))
      .filter(Boolean)
      .map((r) => [
        r.p.slug,
        {
          intent: r.intent,
          inv: { ...r.a.inv, state: r.a.invState, before: r.a.invOldCentre },
          before: { h1: r.b.h1, title: r.b.title },
          after: { h1: r.a.h1, title: r.a.title },
        },
      ]),
  ),
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(out, null, 2));
} else {
  for (const k of ["all", "sitemap"]) {
    const r = out[k];
    console.log(
      `\n== ${r.label}: ${r.pages} pages (HOST ${r.host}, RENTER ${r.renter}, of which topic ${r.renterTopic}; variants ${r.variantPages})`,
    );
    console.log(
      `   cities row found: before ${r.pagesWithCityRow.before}, after ${r.pagesWithCityRow.after} (renter ${r.renterWithCityRow})`,
    );
    console.log(`   no state known after: ${r.noState.length} ${r.noState.slice(0, 8).join(", ")}`);
    const I = r.inventory;
    console.log(
      `   inventory (mirror ${data.listings_synced_max ?? "?"}): RENTER exact ${I.renterExact}, nearby-only ${I.renterNearbyOnly}, nearby-unchecked (no coordinates) ${I.renterUnchecked}, none ${I.renterNone}; HOST with section ${I.hostWithSection}, without ${I.hostWithout}`,
    );
    console.log(
      `   inventory centre moved to the bare cities row on ${I.centreMovedToBareRow} pages; counts changed (centre + dedupe) on ${I.countsChangedByCentreOrDedupe}`,
    );
    console.log(
      `   title_variant rows changed: title ${r.variantRowsChanged.title.length} ${r.variantRowsChanged.title.join(", ")}; H1 ${r.variantRowsChanged.h1.length}`,
    );
    console.log(`   HOST control rows whose <title> changed (stored title states a figure): ${r.hostControlTitleReplaced}`);
    console.log(`   page place differs from the stored title's city: ${r.placeDiffersFromStoredTitle.length}`);
    for (const x of r.placeDiffersFromStoredTitle.slice(0, 15)) console.log(`      ${x}`);
    for (const f of ["h1", "title"]) {
      console.log(
        `   duplicate ${f}: before ${r[f].before.groups} groups / ${r[f].before.pages} pages -> after ${r[f].after.groups} groups / ${r[f].after.pages} pages`,
      );
      for (const g of r[f].after.examples.slice(0, 12))
        console.log(`      ${JSON.stringify(g.value)}  ${g.slugs.join(", ")}`);
    }
    console.log(
      `   residual H1 groups that are one place under two URLs: ${r.residualH1SamePlaceGroups}`,
    );
    console.log(
      `   host/renter pairs: ${r.sameHostRenterH1.before.pairs}; identical H1 before ${r.sameHostRenterH1.before.sameH1}, after ${r.sameHostRenterH1.after.sameH1}`,
    );
    const L = r.links;
    console.log(
      `   /s? links: ${L.before.searchLinks} links, ${L.before.distinctSearchTargets} targets / ${L.before.distinctSearchPlaces} places, ${L.before.placesWithSeveralSpellings} places with >1 spelling -> ${L.after.searchLinks} links, ${L.after.distinctSearchTargets} targets / ${L.after.distinctSearchPlaces} places, ${L.after.placesWithSeveralSpellings} places with >1 spelling`,
    );
    if (L.after.examples.length) console.log(`   e.g. after: ${JSON.stringify(L.after.examples[0])}`);
    console.log(
      `   /p/pool-pros links: ${L.before.poolProsLinks} links, ${L.before.distinctPoolProsTargets} targets -> ${L.after.poolProsLinks} links, ${L.after.distinctPoolProsTargets} target(s)`,
    );
    if (L.before.examples.length)
      console.log(`   e.g. before: ${JSON.stringify(L.before.examples[0])}`);
  }
  console.log("\n== /s? links in the other templates moved to search-links.ts");
  for (const [k, v] of Object.entries(out.otherTemplates)) {
    console.log(
      `   ${k}: ${v.before.searchLinks} links, ${v.before.distinctSearchTargets} targets, ${v.before.placesWithSeveralSpellings} places >1 spelling -> ${v.after.searchLinks} links, ${v.after.distinctSearchTargets} targets, ${v.after.placesWithSeveralSpellings} places >1 spelling${v.changedLinks != null ? `; ${v.changedLinks} links changed` : ""}`,
    );
    if (v.before.examples?.length) console.log(`      e.g. before: ${JSON.stringify(v.before.examples[0])}`);
    if (v.after.examples?.length) console.log(`      e.g. after: ${JSON.stringify(v.after.examples[0])}`);
  }
  const ap = out.afterDuplicatePlan;
  console.log(
    `\n== duplicate-URL plan: ${plan.length} rows to 301 (docs SQL); after it, ${ap.pages} published rows`,
  );
  console.log(
    `   duplicate h1 after plan: ${ap.h1.groups} groups; duplicate title after plan: ${ap.title.groups} groups`,
  );
  for (const g of ap.h1.examples.concat(ap.title.examples).slice(0, 10))
    console.log(`      ${JSON.stringify(g.value)}  ${g.slugs.join(", ")}`);
  if (process.argv.includes("--sql")) {
    const q = (v) => `'${v.replace(/'/g, "''")}'`;
    const pairs = plan.map((x) => `(${q(x.from)}, ${q(x.to)})`).join(",\n  ");
    const promote = [
      ...new Set(plan.filter((x) => x.from_in_sitemap && !x.to_in_sitemap).map((x) => x.to)),
    ];
    console.log(`\n-- APPLY (needs Derek's GO): 301 ${plan.length} duplicate rows to their keeper`);
    console.log(
      `begin;\nupdate content_pages c set status = 'redirect', redirect_to = v.keeper, in_sitemap = false\nfrom (values\n  ${pairs}\n) as v(dup, keeper)\nwhere c.slug = v.dup and c.template_type = 'host_acq_city' and c.status = 'published';`,
    );
    if (promote.length)
      console.log(
        `update content_pages set in_sitemap = true where template_type = 'host_acq_city' and status = 'published' and slug in (${promote.map(q).join(", ")});`,
      );
    console.log("commit;");
    const back = plan.map((x) => `(${q(x.from)}, ${x.from_in_sitemap})`).join(",\n  ");
    console.log(
      `\n-- ROLLBACK\nbegin;\nupdate content_pages c set status = 'published', redirect_to = null, in_sitemap = v.was_in_sitemap\nfrom (values\n  ${back}\n) as v(dup, was_in_sitemap)\nwhere c.slug = v.dup and c.template_type = 'host_acq_city' and c.status = 'redirect';`,
    );
    if (promote.length)
      console.log(
        `update content_pages set in_sitemap = false where template_type = 'host_acq_city' and slug in (${promote.map(q).join(", ")});`,
      );
    console.log("commit;");
  }
  if (process.argv.includes("--sql")) {
    // Same-name cities in different states whose stored control-arm seo_title
    // has no state ("Become a swimming pool host in Belmont" for NC and VA).
    // The code keeps stored control titles (title_variant test), so the fix is
    // data: add the state to exactly these rows.
    const q = (v) => `'${v.replace(/'/g, "''")}'`;
    const fixes = ap.title.examples.flatMap((g) =>
      g.slugs.map((slug) => {
        const r = afterPlan.find((x) => x.p.slug === slug);
        return { slug, from: r.p.seo_title, to: `${r.p.seo_title}, ${r.a.place.stateCode}` };
      }),
    );
    if (fixes.length) {
      console.log(`\n-- APPLY (needs Derek's GO; changes ${fixes.length} control-arm titles): add the state to duplicate stored titles`);
      console.log("begin;");
      for (const f of fixes)
        console.log(
          `update content_pages set seo_title = ${q(f.to)} where slug = ${q(f.slug)} and template_type = 'host_acq_city' and seo_title = ${q(f.from)};`,
        );
      console.log("commit;\n-- ROLLBACK\nbegin;");
      for (const f of fixes)
        console.log(
          `update content_pages set seo_title = ${q(f.from)} where slug = ${q(f.slug)} and template_type = 'host_acq_city' and seo_title = ${q(f.to)};`,
        );
      console.log("commit;");
    }
  }
  if (process.argv.includes("--plan"))
    for (const x of plan)
      console.log(
        `   ${x.from} -> ${x.to}  (${x.why}; from in_sitemap=${x.from_in_sitemap}, keeper in_sitemap=${x.to_in_sitemap})`,
      );
  console.log("\n== samples");
  for (const [slug, s] of Object.entries(out.samples)) {
    console.log(
      `  ${slug} [${s.intent}; ${s.inv.state}: exact ${s.inv.exactTotal}, nearby ${s.inv.nearbyTotal}, nearest ${s.inv.nearestMi == null ? "-" : s.inv.nearestMi.toFixed(1)} mi (old centre, no dedupe: exact ${s.inv.before.exactTotal}, nearby ${s.inv.before.nearbyTotal}, nearest ${s.inv.before.nearestMi == null ? "-" : s.inv.before.nearestMi.toFixed(1)})]\n    before H1:    ${s.before.h1}\n    before title: ${s.before.title}\n    after H1:     ${s.after.h1}\n    after title:  ${s.after.title}`,
    );
  }
}
