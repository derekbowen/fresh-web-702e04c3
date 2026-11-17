#!/usr/bin/env node
/**
 * test:failed-reads — a failed database read must answer 503, never 404, 301
 * or a 200 with an empty sitemap.
 *
 * NEEDS A PRIOR BUILD. This drives the built server (dist/server/server.js),
 * not the source:
 *
 *   VITE_SUPABASE_URL=http://127.0.0.1:54399 VITE_SUPABASE_PUBLISHABLE_KEY=stub-anon-key \
 *   VITE_SUPABASE_PROJECT_ID=stub NODE_OPTIONS=--max-old-space-size=3072 npm run build
 *   npm run test:failed-reads
 *
 * What it does. It starts a stub of the Supabase REST API (PostgREST) on a
 * random 127.0.0.1 port, points SUPABASE_URL at it BEFORE importing the server,
 * and calls `server.fetch(new Request(...))` in-process. Nothing leaves this
 * machine: no real database, no network. The stub records every request it
 * receives and can be switched between
 *
 *   healthy           small fixture rows
 *   http-500          every request answers 500
 *   connection-reset  every connection is reset before a response
 *   hang              the request is accepted and never answered
 *
 * Why it exists: Cloudflare caches /p/* for 600 s whatever the status, so a
 * few seconds of database trouble used to become ten minutes of cached 404s
 * (and 301s to /p/become-a-host) for live pages, plus a row in content_404_log
 * for each. See src/lib/failed-read.ts.
 *
 * It also renders the host_acq_city intent fixtures (src/lib/city-intent.ts)
 * against the healthy stub — HOST with and without listed pools, RENTER with
 * exact-city pools, nearby-only pools and none — and checks headings, titles,
 * CTAs, the empty-inventory notice and that every number in the hero intro and
 * inventory section is a count, price, capacity or distance from the fixtures.
 *
 * Exit code: 0 when every check passes, 1 otherwise. FAILED_READS_DIST can
 * point at another build directory (used to show the checks fail on old code).
 */
import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// The checked-in duplicate list itself (pure .ts; Node strips the types), so
// the harness derives its expectations from the list instead of copying it.
import {
  comparisonDuplicateTarget,
  isComparisonDuplicatePath,
} from "../src/lib/comparison-duplicates.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, process.env.FAILED_READS_DIST || "dist");
const SERVER_ENTRY = resolve(DIST, "server/server.js");

/** Read timeout the app is given for this run (ms). Small so `hang` is quick. */
const READ_TIMEOUT_MS = 900;
/** A 503 must arrive within this long after a request starts in a failure mode. */
const FAILURE_BUDGET_MS = READ_TIMEOUT_MS + 4000;
/** After this long without any response the request is recorded as hung (status 0). */
const REQUEST_DEADLINE_MS = FAILURE_BUDGET_MS + 2000;

// ───────────────────────────── fixtures ─────────────────────────────────────

const NOW = "2026-10-01T00:00:00+00:00";
const TITLE = "Fixture Page Title Zebra-4417";
const BLOG_TITLE = "Fixture Blog Title Quokka-9052";
const ES_TITLE = "Fixture Pagina Titulo Vicuna-3308";

/**
 * Eligible listings for the intent fixtures: two pools in Tempe, AZ, plus the
 * first one stored a second time under another Sharetribe id (same slug and
 * coordinates, as "swim-relax-in-stylepersonal-oasis" is in production). It is
 * one pool and must be counted and shown once.
 */
const INTENT_LISTINGS = [
  {
    sharetribe_id: "00000000-0000-4000-8000-0000000000c2",
    slug: "fixture-tempe-pool-one",
    title: "Fixture Tempe Pool One",
    city: "Tempe",
    city_slug: "tempe",
    state_code: "AZ",
    price_amount: 10000,
    price_currency: "USD",
    primary_image_url: "https://img.example.invalid/tempe-one.jpg",
    capacity: 12,
    amenities: [],
    latitude: 33.43,
    longitude: -111.93,
    updated_at: NOW,
    state: "published",
    is_deleted: false,
  },
  {
    sharetribe_id: "00000000-0000-4000-8000-0000000000c3",
    slug: "fixture-tempe-pool-two",
    title: "Fixture Tempe Pool Two",
    city: "Tempe",
    city_slug: "tempe",
    state_code: "AZ",
    price_amount: 8000,
    price_currency: "USD",
    primary_image_url: "https://img.example.invalid/tempe-two.jpg",
    capacity: 8,
    amenities: [],
    latitude: 33.41,
    longitude: -111.95,
    updated_at: NOW,
    state: "published",
    is_deleted: false,
  },
  {
    sharetribe_id: "00000000-0000-4000-8000-0000000000c4",
    slug: "fixture-tempe-pool-one",
    title: "Fixture Tempe Pool One",
    city: "Tempe",
    city_slug: "tempe",
    state_code: "AZ",
    price_amount: 10000,
    price_currency: "USD",
    primary_image_url: "https://img.example.invalid/tempe-one.jpg",
    capacity: 12,
    amenities: [],
    latitude: 33.43,
    longitude: -111.93,
    updated_at: NOW,
    state: "published",
    is_deleted: false,
  },
];
/** The distinct pools among INTENT_LISTINGS (slug + coordinates). */
const DISTINCT_LISTINGS = INTENT_LISTINGS.filter(
  (l, i, all) =>
    all.findIndex((x) => x.slug === l.slug && x.latitude === l.latitude && x.longitude === l.longitude) === i,
);

const contentPage = (over) => ({
  id: "00000000-0000-4000-8000-000000000001",
  slug: null,
  url_path: null,
  source_url: "",
  template_type: "resource",
  category: "guides",
  locale: "en",
  title: null,
  seo_title: null,
  seo_description: "Fixture description.",
  hero_image_url: null,
  body_markdown: "## Fixture heading\n\nFixture body paragraph.",
  raw_html: null,
  status: "published",
  scraped_at: null,
  updated_at: NOW,
  created_at: NOW,
  content_refreshed_at: NOW,
  in_sitemap: true,
  redirect_to: null,
  legacy_slugs: [],
  priority: 0,
  hreflang_group: null,
  ...over,
});

/** Published cities beyond the first: with akron, more than PostgREST's 1,000-row cap. */
const FIXTURE_EXTRA_CITIES = 1200;

const blogPost = (id, slug) => ({
  id,
  slug,
  title: `Fixture blog ${slug}`,
  excerpt: null,
  content: "Fixture blog body.",
  cover_image_url: null,
  author: null,
  seo_title: null,
  seo_description: null,
  is_published: true,
  published_at: NOW,
  updated_at: NOW,
  topic: null,
  tldr_bullets: null,
  related_slugs: null,
});

const FIXTURES = {
  content_pages: [
    contentPage({
      id: "00000000-0000-4000-8000-000000000001",
      slug: "fixture-live-page",
      url_path: "/p/fixture-live-page",
      title: TITLE,
      legacy_slugs: ["fixture-old-slug", "fixture-old-{slug}"],
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000002",
      slug: "fixture-redirect-row",
      url_path: "/p/fixture-redirect-row",
      status: "redirect",
      redirect_to: "fixture-live-page",
      in_sitemap: false,
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000003",
      slug: "es/fixture-pagina",
      url_path: "/p/es/fixture-pagina",
      title: ES_TITLE,
      template_type: "spanish_resource",
      locale: "es",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000004",
      slug: "become-a-swimming-pool-host-akron-oh",
      url_path: "/p/become-a-swimming-pool-host-akron-oh",
      title: "Fixture host page Akron",
      template_type: "host_acq_city",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000005",
      slug: "become-a-swimming-pool-host-dayton-oh",
      url_path: "/p/become-a-swimming-pool-host-dayton-oh",
      title: "Fixture host page Dayton",
      template_type: "host_acq_city",
    }),
    // ── host_acq_city intent fixtures ────────────────────────────────────────
    // HOST with pools listed in the city (Tempe has two eligible listings).
    contentPage({
      id: "00000000-0000-4000-8000-0000000000f1",
      slug: "become-a-swimming-pool-host-tempe-az",
      url_path: "/p/become-a-swimming-pool-host-tempe-az",
      title: "Become a Pool Host in Tempe, AZ",
      seo_title: "Become a swimming pool host in Tempe | Earn $3k+/mo",
      // Stored copy with unsourced earnings figures, as on 722 HOST rows.
      seo_description:
        "Host a pool in Tempe, AZ and earn $40-$150/hour. Start your side hustle and earn up to $10,000/month.",
      og_title: "Rent out your pool in Tempe, AZ, earn $3K-$10K/month",
      template_type: "host_acq_city",
    }),
    // HOST with only nearby pools (none filed under Mesa; Tempe's are close).
    contentPage({
      id: "00000000-0000-4000-8000-0000000000f6",
      slug: "become-a-swimming-pool-host-mesa-az",
      url_path: "/p/become-a-swimming-pool-host-mesa-az",
      title: "Become a Pool Host in Mesa, AZ",
      seo_title: "Mesa, AZ: Make Money Renting Your Pool | Host Guide",
      template_type: "host_acq_city",
    }),
    // RENTER with exact-city pools — same city as the HOST page above.
    contentPage({
      id: "00000000-0000-4000-8000-0000000000f2",
      slug: "tempe-az",
      url_path: "/p/tempe-az",
      title: "Pool Rental in Tempe, AZ",
      seo_title: "Pool Rental in Tempe, AZ | Hourly Backyard Pools",
      seo_description: "Browse Tempe backyard pools with photos, hourly prices, and reviews.",
      template_type: "host_acq_city",
      body_markdown:
        "# Pool Rental in Tempe, AZ\n\nFixture host body Tempe.\n\n[Search](/s?address=Tempe%2C+AZ)",
    }),
    // RENTER with only nearby pools (Mesa has none; Tempe's are a few miles away).
    contentPage({
      id: "00000000-0000-4000-8000-0000000000f3",
      slug: "mesa-az",
      url_path: "/p/mesa-az",
      title: "Pool Rental in Mesa, AZ",
      template_type: "host_acq_city",
      body_markdown: "## Fixture host body Mesa\n\nFixture paragraph.",
    }),
    // RENTER whose city has no coordinates (no cities row): nearby is not
    // checked, so the page must not say nothing is near.
    contentPage({
      id: "00000000-0000-4000-8000-0000000000f5",
      slug: "chevy-chase-md",
      url_path: "/p/chevy-chase-md",
      title: "Pool Rental in Chevy Chase, MD",
      template_type: "host_acq_city",
      body_markdown: "## Fixture host body Chevy Chase\n\nFixture paragraph.",
    }),
    // RENTER with no pools in or near the city, on a bare slug: the state comes
    // from the title; the "chapel-hill" cities row (NC) gives the centre, and no
    // listing is within 60 miles of it.
    contentPage({
      id: "00000000-0000-4000-8000-0000000000f4",
      slug: "chapel-hill",
      url_path: "/p/chapel-hill",
      title: "Pool Rental in Chapel Hill, NC",
      template_type: "host_acq_city",
      body_markdown: "## Fixture host body Chapel Hill\n\nFixture paragraph.",
    }),
    // ── hand-off fixtures (search + host CTAs) ───────────────────────────────
    // Off the sitemaps so the per-group sitemap checks are unchanged.
    // An advocacy state page: its "Find pools" and host CTAs.
    contentPage({
      id: "00000000-0000-4000-8000-0000000000a1",
      slug: "host-advocacy-ohio",
      url_path: "/p/host-advocacy-ohio",
      title: "Fixture advocacy page Ohio",
      template_type: "host_advocacy_state",
      in_sitemap: false,
    }),
    // A pool-maintenance article: its two "List your pool" CTAs.
    contentPage({
      id: "00000000-0000-4000-8000-0000000000a2",
      slug: "fixture-pool-maintenance",
      url_path: "/p/fixture-pool-maintenance",
      title: "Fixture pool maintenance page",
      template_type: "pool_maintenance",
      in_sitemap: false,
    }),
    // A generic page with a hero image: the hero's host CTA renders only then.
    contentPage({
      id: "00000000-0000-4000-8000-0000000000a3",
      slug: "fixture-generic-hero",
      url_path: "/p/fixture-generic-hero",
      title: "Fixture generic page with hero",
      template_type: null,
      hero_image_url: "https://img.example.invalid/generic-hero.jpg",
      in_sitemap: false,
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000006",
      slug: "rent-out-your-pool-uk",
      url_path: "/p/rent-out-your-pool-uk",
      title: "Fixture UK page",
      template_type: "country_launch",
    }),
    // ── sitemap integrity fixtures: each row below is one exclusion rule ──
    // A content row and a blog post with the same slug: the dispatcher serves
    // the content row, so only the articles sitemap may list the URL.
    contentPage({
      id: "00000000-0000-4000-8000-000000000011",
      slug: "fixture-shared-slug",
      url_path: "/p/fixture-shared-slug",
      title: "Fixture shared slug page",
    }),
    // Underscore slug: the edge 301s it to the hyphenated form.
    contentPage({
      id: "00000000-0000-4000-8000-000000000012",
      slug: "fixture_underscore_slug",
      url_path: "/p/fixture_underscore_slug",
    }),
    // A content row under a noindex dedicated route.
    contentPage({ id: "00000000-0000-4000-8000-000000000013", slug: "pool-pros", url_path: "/p/pool-pros" }),
    // Canonical on another host.
    contentPage({
      id: "00000000-0000-4000-8000-000000000014",
      slug: "fixture-hosting-uk",
      url_path: "/p/fixture-hosting-uk",
      canonical_override: "https://poolrentalnearme.co.uk/p/fixture-hosting-uk",
    }),
    // A content row under a dedicated static route (sitemap-static owns it).
    contentPage({ id: "00000000-0000-4000-8000-000000000015", slug: "all-locations", url_path: "/p/all-locations" }),
    // A published row shadowed by a redirect row with the same slug.
    contentPage({
      id: "00000000-0000-4000-8000-000000000016",
      slug: "fixture-shadowed",
      url_path: "/p/fixture-shadowed",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000017",
      slug: "fixture-shadowed",
      url_path: "/p/fixture-shadowed",
      status: "redirect",
      redirect_to: "fixture-live-page",
      in_sitemap: false,
      priority: 1,
    }),
    // Untyped: an unreviewed page is in no sitemap; a reviewed academy course is.
    contentPage({
      id: "00000000-0000-4000-8000-000000000018",
      slug: "fixture-untyped-page",
      url_path: "/p/fixture-untyped-page",
      template_type: null,
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000019",
      slug: "elearning-academy-fixture-course",
      url_path: "/p/elearning-academy-fixture-course",
      template_type: null,
      title: "Fixture academy course",
      body_markdown: `## Fixture course\n\n${"Fixture course body sentence. ".repeat(40)}`,
    }),
    // Malformed slugs (a stray ")" copy and a double hyphen): they answer 200
    // but are not a page to advertise.
    contentPage({
      id: "00000000-0000-4000-8000-00000000001b",
      slug: "fixture-stray-copy)",
      url_path: "/p/fixture-stray-copy)",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-00000000001c",
      slug: "fixture--double-hyphen",
      url_path: "/p/fixture--double-hyphen",
      template_type: "host_acq_city",
    }),
    // A redirect row the dispatcher skips (url_path is not /p/<slug>): the
    // blog post with that slug is what /p/<slug> serves, so the blog sitemap
    // must list it.
    contentPage({
      id: "00000000-0000-4000-8000-00000000001d",
      slug: "fixture-blog-behind-redirect",
      url_path: "/p/old/fixture-blog-behind-redirect",
      status: "redirect",
      redirect_to: "fixture-live-page",
      in_sitemap: false,
    }),
    // ── country mapping fixtures (src/lib/country-sites.ts) ──
    // An exact-slug country page whose override target used to be robots-blocked.
    contentPage({
      id: "00000000-0000-4000-8000-000000000021",
      slug: "pool-rental-london",
      title: "Fixture London page",
      locale: "en-GB",
      canonical_override: "https://poolrentalnearme.co.uk/p/pool-rental-london",
      hreflang_group: "new-york-ny",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000022",
      slug: "pool-rental-toronto",
      title: "Fixture Toronto page",
      locale: "en-CA",
      canonical_override: "https://poolrentalnearme.ca/p/pool-rental-toronto",
      hreflang_group: "new-york-ny",
    }),
    // One article localised for the three markets: true equivalents.
    ...[
      ["uk", "en-GB", "poolrentalnearme.co.uk", "23"],
      ["canada", "en-CA", "poolrentalnearme.ca", "24"],
      ["australia", "en-AU", "poolrentalnearme.com.au", "25"],
    ].map(([suffix, locale, host, n]) =>
      contentPage({
        id: `00000000-0000-4000-8000-0000000000${n}`,
        slug: `fixture-maintenance-${suffix}`,
        title: `Fixture maintenance ${suffix}`,
        locale,
        canonical_override: `https://${host}/p/fixture-maintenance-${suffix}`,
        hreflang_group: "fixture-maintenance",
      }),
    ),
    // A country page that is not in_sitemap (as the 3 insurance pages): mapped, not listed.
    contentPage({
      id: "00000000-0000-4000-8000-000000000026",
      slug: "fixture-unlisted-canada",
      locale: "en-CA",
      in_sitemap: false,
    }),
    // The .com group-key article of the fixture-maintenance group (as
    // production's /p/pool-maintenance): every sibling is a country page, so
    // it gets no hreflang at all and stays canonical on www.
    contentPage({
      id: "00000000-0000-4000-8000-00000000002b",
      slug: "fixture-maintenance",
      title: "Fixture maintenance (US)",
      in_sitemap: false,
      hreflang_group: "fixture-maintenance",
    }),
    // A US page whose hreflang_group also holds a country page (as production's
    // "new-york-ny" does): its EN<->ES twin must still be found, and the
    // country page must not be offered as its equivalent. The country row
    // sorts first under the sibling read's ORDER BY slug ("0" < "e"), so the
    // first row returned is the country page.
    contentPage({
      id: "00000000-0000-4000-8000-000000000028",
      slug: "fixture-twin-0-uk",
      locale: "en-GB",
      in_sitemap: false,
      hreflang_group: "fixture-twin",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000029",
      slug: "fixture-twin-en",
      title: "Fixture twin page",
      in_sitemap: false,
      hreflang_group: "fixture-twin",
    }),
    contentPage({
      id: "00000000-0000-4000-8000-00000000002a",
      slug: "fixture-twin-es",
      title: "Fixture twin pagina",
      locale: "es",
      in_sitemap: false,
      hreflang_group: "fixture-twin",
    }),
    // A US page whose stored override names a ccTLD: the mapping keeps it on www.
    contentPage({
      id: "00000000-0000-4000-8000-000000000027",
      slug: "fixture-us-wrong-override",
      title: "Fixture US page with a ccTLD override",
      canonical_override: "https://poolrentalnearme.co.uk/p/fixture-us-wrong-override",
    }),
    // A US page whose override names ANOTHER page, a UK one, on the right UK
    // host: still ignored (an override never moves a page to another market).
    contentPage({
      id: "00000000-0000-4000-8000-00000000002c",
      slug: "fixture-us-cross-override",
      title: "Fixture US page pointed at a UK page",
      canonical_override: "https://poolrentalnearme.co.uk/p/fixture-maintenance-uk",
    }),
    // A US place whose bare-city slug ends in "-canada" (Little Canada, MN).
    contentPage({
      id: "00000000-0000-4000-8000-00000000002d",
      slug: "fixture-host-little-canada",
      title: "Fixture Little Canada MN page",
    }),
    // ── url_path NULL (integration trial 2026-11-16) ──
    // Production has url_path NULL on 50 of the 59 pages in the three ccTLD
    // sitemap-country.xml files. Each row below has url_path NULL on purpose
    // (contentPage's default), one per market and one US page, each through a
    // template that puts page.url_path into a breadcrumb. It must render its
    // H1 and body, and every URL naming it is built from /p/<slug>.
    contentPage({
      id: "00000000-0000-4000-8000-000000000031",
      slug: "fixture-null-path-uk",
      title: "Fixture null path UK page",
      template_type: "generic",
      locale: "en-GB",
      in_sitemap: false,
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000032",
      slug: "fixture-null-path-canada",
      title: "Fixture null path Canada page",
      template_type: "resource",
      locale: "en-CA",
      in_sitemap: false,
    }),
    contentPage({
      id: "00000000-0000-4000-8000-000000000033",
      slug: "fixture-null-path-australia",
      title: "Fixture null path Australia page",
      template_type: "event_guide",
      locale: "en-AU",
      in_sitemap: false,
    }),
    // In the articles sitemap, so the sitemap's "every listed URL" pass renders it too.
    contentPage({
      id: "00000000-0000-4000-8000-000000000034",
      slug: "fixture-null-path-us",
      title: "Fixture null path US page",
      template_type: "resource",
    }),
    // A comparison city page that a content row redirects.
    contentPage({
      id: "00000000-0000-4000-8000-00000000001a",
      slug: "giggster-vs-pool-rental-near-me-in-fixture-city-0002",
      url_path: "/p/giggster-vs-pool-rental-near-me-in-fixture-city-0002",
      template_type: null,
      redirect_to: "giggster-vs-pool-rental-near-me",
    }),
  ],
  cities: [
    {
      slug: "tempe",
      name: "Tempe",
      state: "Arizona",
      state_code: "AZ",
      description: null,
      latitude: 33.4255,
      longitude: -111.94,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
    {
      slug: "mesa",
      name: "Mesa",
      state: "Arizona",
      state_code: "AZ",
      description: null,
      latitude: 33.4152,
      longitude: -111.8315,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
    // The state-suffixed twin, off-centre like production's mesa-az (14 miles
    // from the city centre). Distances must be measured from "mesa".
    {
      slug: "mesa-az",
      name: "Mesa",
      state: "Arizona",
      state_code: "AZ",
      description: null,
      latitude: 33.2845,
      longitude: -111.6442,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
    {
      slug: "chapel-hill",
      name: "Chapel Hill",
      state: "North Carolina",
      state_code: "NC",
      description: null,
      latitude: 35.9132,
      longitude: -79.0558,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
    {
      slug: "akron",
      name: "Akron",
      state: "Ohio",
      state_code: "OH",
      description: null,
      latitude: 41.08,
      longitude: -81.51,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
    // A confirmed exact-duplicate pair (src/lib/comparison-duplicates.ts):
    // /p/<competitor>-vs-pool-rental-near-me-in-boston 301s to ...-boston-ma.
    ...[
      ["boston", 42.3601, -71.0589],
      ["boston-ma", 42.358665, -71.05634],
    ].map(([slug, latitude, longitude]) => ({
      slug,
      name: "Boston",
      state: "Massachusetts",
      state_code: "MA",
      description: null,
      latitude,
      longitude,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    })),
    // A listed duplicate whose state-suffixed row is MISSING: only the bare
    // "charlotte" row exists. /p/<competitor>-vs-pool-rental-near-me-in-charlotte
    // still 301s to ...-charlotte-nc, and the resolver serves ...-charlotte-nc
    // from the bare row, so its canonical must not be the bare URL (a 301
    // source pointing back at the page: a loop).
    {
      slug: "charlotte",
      name: "Charlotte",
      state: "North Carolina",
      state_code: "NC",
      description: null,
      latitude: 35.2271,
      longitude: -80.8431,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
    // More published cities than one PostgREST answer holds (max-rows 1,000),
    // so a sitemap that reads `cities` without paging is caught.
    ...Array.from({ length: FIXTURE_EXTRA_CITIES }, (_, i) => ({
      slug: `fixture-city-${String(i).padStart(4, "0")}`,
      name: `Fixture City ${i}`,
      state: "Ohio",
      state_code: "OH",
      description: null,
      latitude: 40,
      longitude: -82,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    })),
    // A published cities row with no coordinates: its comparison pages have
    // no box to search, so their search link must be the bare /s.
    {
      slug: "youngstown",
      name: "Youngstown",
      state: "Ohio",
      state_code: "OH",
      description: null,
      latitude: null,
      longitude: null,
      hero_image_url: null,
      is_published: true,
      updated_at: NOW,
    },
  ],
  blog_posts: [
    {
      id: "00000000-0000-4000-8000-0000000000b1",
      slug: "fixture-blog-post",
      title: BLOG_TITLE,
      excerpt: "Fixture excerpt.",
      content: "Fixture blog body.",
      cover_image_url: null,
      author: null,
      seo_title: null,
      seo_description: null,
      is_published: true,
      published_at: NOW,
      updated_at: NOW,
      topic: null,
      tldr_bullets: null,
      related_slugs: null,
    },
    // Same slug as a content row (served by the content row).
    { ...blogPost("00000000-0000-4000-8000-0000000000b2", "fixture-shared-slug") },
    // A legacy_slugs alias of fixture-live-page: /p/fixture-old-slug 301s.
    { ...blogPost("00000000-0000-4000-8000-0000000000b3", "fixture-old-slug") },
    // Shares its slug with a redirect row the dispatcher skips: served as the blog post.
    { ...blogPost("00000000-0000-4000-8000-0000000000b4", "fixture-blog-behind-redirect") },
    // A blog post whose slug maps to the UK: canonical on poolrentalnearme.co.uk,
    // listed by its sitemap-country.xml, not by the www blog sitemap.
    { ...blogPost("00000000-0000-4000-8000-0000000000b5", "fixture-blog-uk") },
  ],
  synced_listings: [
    {
      slug: "fixture-listing",
      sharetribe_id: "00000000-0000-4000-8000-0000000000c1",
      primary_image_url: null,
      title: "Fixture listing",
      updated_at: NOW,
      state: "published",
      is_deleted: false,
    },
    // The marketplace configuration listing (id from NON_PUBLIC_LISTING_IDS).
    {
      slug: "config-listing-do-not-delete",
      sharetribe_id: "6768ea36-b435-40df-b331-43be74aa882f",
      primary_image_url: null,
      title: "CONFIG LISTING - DO NOT DELETE",
      updated_at: NOW,
      state: "published",
      is_deleted: false,
    },
    ...INTENT_LISTINGS,
  ],
  service_categories: [
    {
      slug: "pool-builders",
      name: "Pool Builder",
      plural_name: "Pool Builders",
      icon: null,
      hero_image_url: null,
      intro_markdown: null,
      seo_title: null,
      seo_description: null,
      sort_order: 1,
      is_published: true,
      updated_at: NOW,
    },
  ],
  providers: [
    {
      id: "00000000-0000-4000-8000-0000000000d1",
      slug: "fixture-pool-pro",
      name: "Fixture Pool Pro",
      business_type: null,
      city: "Akron",
      city_slug: "akron",
      state_code: "OH",
      logo_url: null,
      hero_image_url: null,
      description: "Fixture provider.",
      long_description: null,
      primary_category: "pool-builders",
      secondary_categories: [],
      is_featured: false,
      is_published: true,
      rating: null,
      rating_count: null,
      updated_at: NOW,
    },
  ],
  courses: [
    {
      id: "00000000-0000-4000-8000-0000000000e1",
      slug: "fixture-course",
      title: "Fixture Course",
      subtitle: null,
      description: "Fixture course description.",
      excerpt: null,
      category: "getting-started",
      language: "en",
      tier: "free",
      is_published: true,
      is_featured: false,
      duration_minutes: 5,
      embed_url: null,
      long_form_content: null,
      published_at: NOW,
      updated_at: NOW,
    },
  ],
};

// ───────────────────────── stub Supabase REST API ───────────────────────────

/**
 * What PostgREST answers for a request the database (or PostgREST itself)
 * rejects as malformed. Not a failure mode of the stub: these are input errors
 * a real server gives on every retry, and the app must not mistake them for an
 * outage when the page does not exist.
 */
class PgRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Parse a Postgres array literal (`{a,"b c","d\\"e"}`) the way Postgres does,
 * or throw 22P02 "malformed array literal" where Postgres would: an unquoted
 * element containing `{`, `}` or `"`, an empty unquoted element, a stray
 * character after a quoted element, an unterminated quote.
 */
function parsePgArray(literal) {
  const malformed = () => new PgRequestError("22P02", `malformed array literal: "${literal}"`);
  if (!literal.startsWith("{") || !literal.endsWith("}")) throw malformed();
  const body = literal.slice(1, -1);
  if (body.trim() === "") return [];
  const out = [];
  let i = 0;
  for (;;) {
    while (body[i] === " ") i++;
    let el = "";
    if (body[i] === '"') {
      i++;
      while (i < body.length && body[i] !== '"') {
        if (body[i] === "\\") i++;
        if (i >= body.length) throw malformed();
        el += body[i++];
      }
      if (body[i] !== '"') throw malformed();
      i++;
      while (body[i] === " ") i++;
    } else {
      while (i < body.length && body[i] !== ",") {
        if (body[i] === "{" || body[i] === "}" || body[i] === '"') throw malformed();
        if (body[i] === "\\") i++;
        if (i >= body.length) throw malformed();
        el += body[i++];
      }
      el = el.trim();
      if (el === "") throw malformed();
    }
    out.push(el);
    if (i >= body.length) return out;
    if (body[i] !== ",") throw malformed();
    i++;
  }
}

/** Split a PostgREST logic tree `(a.eq.x,b.cs.{y,z})` on top-level commas, as PostgREST does. */
function splitLogicTree(expr) {
  const inner = expr.replace(/^\(|\)$/g, "");
  const parts = [];
  let depth = 0;
  let quoted = false;
  let cur = "";
  for (const c of inner) {
    if (c === '"') quoted = !quoted;
    else if (!quoted && (c === "{" || c === "(")) depth++;
    else if (!quoted && (c === "}" || c === ")")) depth--;
    if (c === "," && depth === 0 && !quoted) {
      parts.push(cur);
      cur = "";
    } else cur += c;
  }
  parts.push(cur);
  // Brackets and quotes must balance, and every alternative must be
  // `column.operator.value` (or a nested and()/or()).
  let balance = 0;
  for (const c of inner.replace(/"[^"]*"/g, "")) {
    if (c === "(" || c === "{") balance++;
    else if (c === ")" || c === "}") balance--;
    if (balance < 0) break;
  }
  const unbalanced = balance !== 0 || quoted;
  for (const part of unbalanced ? [""] : parts) {
    if (!/^(?:(?:and|or)\(|[A-Za-z_][\w]*\.(?:not\.)?[a-z]+\.)/.test(part)) {
      throw new PgRequestError(
        "PGRST100",
        `"failed to parse logic tree (${inner})" (line 1, column ${inner.indexOf(part) + 1})`,
      );
    }
  }
  return parts;
}

/** Reject, before any row is looked at, a filter PostgREST or Postgres would reject. */
function validateFilter(expr) {
  const bare = expr.startsWith("not.") ? expr.slice(4) : expr;
  if (bare.startsWith("cs.")) parsePgArray(bare.slice(3));
  if (bare.startsWith("ov.")) parsePgArray(bare.slice(3));
}

/** Evaluate one PostgREST filter (`eq.x`, `in.(a,b)`, `like.a%`, `is.null`, `cs.{a}`, `not.…`). */
function matches(value, expr) {
  if (expr.startsWith("not.")) return !matches(value, expr.slice(4));
  const dot = expr.indexOf(".");
  const op = expr.slice(0, dot);
  const arg = expr.slice(dot + 1);
  const pattern = (p, flags) =>
    new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/[%*]/g, ".*")}$`, flags);
  switch (op) {
    case "eq":
      return String(value) === arg;
    case "neq":
      return String(value) !== arg;
    case "in":
      return arg
        .replace(/^\(|\)$/g, "")
        .split(",")
        .map((s) => s.replace(/^"|"$/g, ""))
        .includes(String(value));
    case "like":
      return typeof value === "string" && pattern(arg, "").test(value);
    case "ilike":
      return typeof value === "string" && pattern(arg, "i").test(value);
    case "is":
      return arg === "null" ? value === null || value === undefined : String(value) === arg;
    case "cs":
      return Array.isArray(value) && parsePgArray(arg).every((s) => value.includes(s));
    case "ov":
      return Array.isArray(value) && parsePgArray(arg).some((s) => value.includes(s));
    default:
      return true; // an operator this stub does not model: do not filter on it
  }
}

const NON_FILTER_PARAMS = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);

/** PostgREST's `max-rows`: no answer carries more rows than this, whatever `limit` asks. */
const MAX_ROWS = 1000;

/** Validate every leaf of a logic tree (`a.eq.x,and(b.is.null,c.like.d*)`). */
function validateTree(expr) {
  for (const part of splitLogicTree(expr)) {
    const nested = part.match(/^(and|or)(\(.*\))$/s);
    if (nested) validateTree(nested[2]);
    else validateFilter(part.slice(part.indexOf(".") + 1));
  }
}

/** Does `row` satisfy the logic tree? `kind` is how the alternatives combine. */
function matchesTree(row, expr, kind) {
  const alts = splitLogicTree(expr).map((part) => {
    const nested = part.match(/^(and|or)(\(.*\))$/s);
    if (nested) return matchesTree(row, nested[2], nested[1]);
    const i = part.indexOf(".");
    const col = part.slice(0, i);
    return !(col in row) || matches(row[col], part.slice(i + 1));
  });
  return kind === "and" ? alts.every(Boolean) : alts.some(Boolean);
}

/** A sort comparator for a PostgREST `order` parameter (Postgres null placement by default). */
function orderComparator(order) {
  const keys = order.split(",").map((term) => {
    const [col, ...mods] = term.split(".");
    const desc = mods.includes("desc");
    const nullsFirst = mods.includes("nullsfirst") ? true : mods.includes("nullslast") ? false : desc;
    return { col, desc, nullsFirst };
  });
  return (a, b) => {
    for (const { col, desc, nullsFirst } of keys) {
      const x = a[col] ?? null;
      const y = b[col] ?? null;
      if (x === y) continue;
      if (x === null) return nullsFirst ? -1 : 1;
      if (y === null) return nullsFirst ? 1 : -1;
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x) < String(y) ? -1 : String(x) > String(y) ? 1 : 0;
      if (c !== 0) return desc ? -c : c;
    }
    return 0;
  };
}

function query(table, url) {
  let rows = FIXTURES[table] ?? [];
  // Malformed filters are rejected whether or not any row would be compared.
  for (const [key, expr] of url.searchParams) {
    if (NON_FILTER_PARAMS.has(key)) continue;
    if (key === "or" || key === "and") validateTree(expr);
    else validateFilter(expr);
  }
  for (const [key, expr] of url.searchParams) {
    if (NON_FILTER_PARAMS.has(key)) continue;
    if (key === "or" || key === "and") {
      rows = rows.filter((r) => matchesTree(r, expr, key));
      continue;
    }
    rows = rows.filter((r) => !(key in r) || matches(r[key], expr));
  }
  // ORDER BY as PostgREST sends it (`order=slug.asc,id.desc.nullsfirst`), so
  // fixtures come back in the order production would return them, not in
  // insertion order. Text compares by code point (C collation).
  const order = url.searchParams.get("order");
  if (order) rows = [...rows].sort(orderComparator(order));
  const total = rows.length;
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const asked = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : rows.length;
  const limit = Math.min(asked, MAX_ROWS);
  return { rows: rows.slice(offset, offset + limit), total, offset };
}

function startStub() {
  const state = { mode: "healthy", requests: [], held: new Set() };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://stub");
    const table = url.pathname.replace(/^\/rest\/v1\//, "").replace(/^rpc\//, "rpc:");
    state.requests.push({
      at: Date.now(),
      mode: state.mode,
      method: req.method,
      table,
      search: url.search,
    });
    req.resume(); // drain any body

    if (state.mode === "hang") {
      state.held.add(req.socket);
      req.socket.on("close", () => state.held.delete(req.socket));
      return; // never answered
    }
    if (state.mode === "connection-reset") {
      if (typeof req.socket.resetAndDestroy === "function") req.socket.resetAndDestroy();
      else req.socket.destroy();
      return;
    }
    if (state.mode === "http-500") {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "stub: internal server error", code: "XX000" }));
      return;
    }

    // healthy
    if (req.method === "GET" || req.method === "HEAD") {
      let found;
      try {
        found = query(table, url);
      } catch (err) {
        if (!(err instanceof PgRequestError)) throw err;
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: err.code, message: err.message, details: null, hint: null }));
        return;
      }
      const { rows, total, offset } = found;
      const range =
        rows.length === 0 ? `*/${total}` : `${offset}-${offset + rows.length - 1}/${total}`;
      const single = (req.headers.accept || "").includes("vnd.pgrst.object");
      if (single && rows.length !== 1) {
        res.writeHead(406, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "PGRST116",
            message: "JSON object requested, multiple (or no) rows returned",
            details: `The result contains ${rows.length} rows`,
            hint: null,
          }),
        );
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json", "Content-Range": range });
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(single ? rows[0] : rows));
      return;
    }
    // writes (content_404_log, redirect_log, …) and RPC calls
    res.writeHead(table.startsWith("rpc:") ? 200 : 201, { "Content-Type": "application/json" });
    res.end("[]");
  });

  return new Promise((ready) => {
    server.listen(0, "127.0.0.1", () => {
      ready({
        url: `http://127.0.0.1:${server.address().port}`,
        requests: state.requests,
        get mode() {
          return state.mode;
        },
        setMode(mode) {
          state.mode = mode;
          // Leaving `hang`: let go of everything that was being held.
          for (const socket of state.held) socket.destroy();
          state.held.clear();
        },
        close() {
          for (const socket of state.held) socket.destroy();
          server.closeAllConnections?.();
          return new Promise((done) => server.close(done));
        },
      });
    });
  });
}

// ───────────────────────────── checks ───────────────────────────────────────

const results = [];
function check(phase, name, ok, detail = "") {
  results.push({ phase, name, ok: !!ok, detail });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const countLocs = (xml) => (xml.match(/<loc>/g) || []).length;

if (!existsSync(SERVER_ENTRY)) {
  console.error(`test:failed-reads needs a build first: ${SERVER_ENTRY} does not exist.`);
  console.error("Run the build command in this file's header, then re-run.");
  process.exit(1);
}

const stub = await startStub();

// Environment for the app. Dummy values only; they never leave this process.
process.env.SUPABASE_URL = stub.url;
process.env.SUPABASE_SERVICE_ROLE_KEY = "stub-service-role-key";
process.env.SUPABASE_PUBLISHABLE_KEY = "stub-publishable-key";
process.env.SUPABASE_READ_TIMEOUT_MS = String(READ_TIMEOUT_MS);

// The app logs every failed read and every 404; keep this run's output to the table.
const quiet = process.env.FAILED_READS_VERBOSE !== "1";
const realConsole = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  log: console.log,
};
if (quiet) for (const k of Object.keys(realConsole)) console[k] = () => {};
const say = (...a) => realConsole.log(...a);

// Start cold in `hang`: the very first request must not need a warm cache.
stub.setMode("hang");
const { default: server } = await import(pathToFileURL(SERVER_ENTRY).href);

/** server.fetch with a deadline, so a request that hangs is a failed check, not a hung harness. */
async function fetchWithDeadline(request) {
  let timer;
  const deadline = new Promise((r) => {
    timer = setTimeout(() => r(null), REQUEST_DEADLINE_MS);
  });
  const answered = (async () => {
    const res = await server.fetch(request);
    return { status: res.status, headers: res.headers, body: await res.text() };
  })();
  answered.catch(() => {});
  try {
    return (
      (await Promise.race([answered, deadline])) ?? {
        status: 0,
        headers: new Headers(),
        body: "",
        hung: true,
      }
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Every 200 text/html page rendered in the current healthy phase: path -> body. */
let renderedPages = null;

async function get(path, { host = "localhost", forwardedHost } = {}) {
  const started = Date.now();
  const headers = { accept: "text/html,*/*" };
  // As production: the proxy (WEST nginx for www, EAST nginx for the ccTLDs)
  // sets X-Forwarded-Host; the app sees an internal Host.
  if (forwardedHost) headers["x-forwarded-host"] = forwardedHost;
  const res = await fetchWithDeadline(new Request(`http://${host}${path}`, { headers }));
  if (
    renderedPages &&
    res.status === 200 &&
    /text\/html/.test(res.headers.get("content-type") || "")
  ) {
    renderedPages.set(`${host}${path}`, res.body);
  }
  return { ...res, ms: Date.now() - started, path };
}

/**
 * F11 follow-up: /p and /p/ answer 404, so no rendered page may point at them,
 * neither as an <a href> (or any href attribute, e.g. a canonical) nor as a
 * URL anywhere in its JSON-LD (a BreadcrumbList "item", "url", "@id", ...).
 * Returns the offending values found in one HTML body.
 */
const decodeEntities = (v) =>
  v
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
function isBarePTarget(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  let path;
  if (/^https?:\/\//i.test(v)) {
    try {
      path = new URL(v).pathname;
    } catch {
      return false;
    }
  } else if (v.startsWith("/") && !v.startsWith("//")) {
    path = v.split(/[?#]/)[0];
  } else {
    return false;
  }
  return path === "/p" || path === "/p/";
}
function barePTargets(html) {
  const found = [];
  for (const m of html.matchAll(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const v = decodeEntities(m[1] ?? m[2] ?? "");
    if (isBarePTarget(v)) found.push(`href="${v}"`);
  }
  const walk = (node, where) => {
    if (typeof node === "string") {
      if (isBarePTarget(node)) found.push(`JSON-LD ${where} = ${node}`);
    } else if (Array.isArray(node)) {
      node.forEach((n, i) => walk(n, `${where}[${i}]`));
    } else if (node && typeof node === "object") {
      for (const [k, n] of Object.entries(node)) walk(n, where ? `${where}.${k}` : k);
    }
  };
  const ldRe = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(ldRe)) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      try {
        data = JSON.parse(decodeEntities(m[1]));
      } catch {
        found.push("unparseable JSON-LD block");
        continue;
      }
    }
    walk(data, "");
  }
  return found;
}

/**
 * Call lookupContentPage the way the browser does on a client-side navigation:
 * through the server-function RPC endpoint. The function id is read from the
 * build's server-function manifest and the payload is encoded with seroval,
 * the serializer TanStack Start itself uses.
 */
const LOOKUP_FN_ID = readFileSync(SERVER_ENTRY, "utf8").match(
  /"([0-9a-f]{64})":\s*\{\s*functionName:\s*"lookupContentPage_createServerFn_handler"/,
)?.[1];
async function rpcLookup(slug) {
  if (!LOOKUP_FN_ID)
    return {
      status: 0,
      headers: new Headers(),
      result: null,
      note: "lookupContentPage id not found in the build",
    };
  const { toJSONAsync, fromCrossJSON } = await import("seroval");
  const payload = JSON.stringify(await toJSONAsync({ data: { slug } }));
  const res = await fetchWithDeadline(
    new Request(
      `http://localhost/_serverFn/${LOOKUP_FN_ID}?payload=${encodeURIComponent(payload)}`,
      {
        headers: { "x-tsr-serverFn": "true", accept: "application/json" },
      },
    ),
  );
  const text = res.body;
  let result = null;
  try {
    // The envelope is { result, error, context }; `result` is what the route receives.
    result = fromCrossJSON(JSON.parse(text), { refs: new Map() })?.result ?? null;
  } catch {
    // not a serialized server-function result
  }
  return { status: res.status, headers: res.headers, result, note: text.slice(0, 120) };
}

const requestsSince = (mark) => stub.requests.slice(mark);
const logRequests = (mark) => requestsSince(mark).filter((r) => r.table === "content_404_log");
const logWrites = (mark) =>
  logRequests(mark).filter((r) => r.method !== "GET" && r.method !== "HEAD");

async function waitForLogWrite(mark, ms = 3000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (logWrites(mark).length > 0) return true;
    await sleep(25);
  }
  return false;
}

/** The whole contract for "this answer came from a failed read". */
function is503(r) {
  const cc = r.headers.get("cache-control") || "";
  const problems = [];
  if (r.status !== 503) problems.push(`status ${r.status}`);
  if (!r.headers.get("retry-after")) problems.push("no Retry-After");
  if (!/no-store/.test(cc)) problems.push(`Cache-Control "${cc}"`);
  if (r.headers.get("location")) problems.push(`Location ${r.headers.get("location")}`);
  if (r.ms > FAILURE_BUDGET_MS) problems.push(`took ${r.ms} ms`);
  return problems;
}
const describe = (r) =>
  r.hung
    ? `no response within ${REQUEST_DEADLINE_MS} ms`
    : `${r.status}${r.headers.get("location") ? ` -> ${r.headers.get("location")}` : ""} in ${r.ms} ms`;

/** Visible text of an HTML fragment (scripts, styles and tags removed). */
const textOf = (html) =>
  html
    .replace(/<script\b[\s\S]*?<\/script>/g, " ")
    .replace(/<style\b[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * A rendered page is a page, not chrome around an empty <main>: it has a
 * <main> with a non-empty H1 and body text beyond the H1 and the breadcrumb
 * trail, and no URL anywhere in it (markup or JSON-LD) ends in "null" or
 * "undefined" (as "https://www.poolrentalnearme.comnull" did). A render that
 * throws (url_path NULL, integration trial 2026-11-16) still answers 200 with
 * header and footer, so the status alone does not show it.
 */
function renderedPageProblems(body) {
  const main = body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  if (main == null) return ["no <main>"];
  const problems = [];
  const h1 = main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
  if (!h1 || !textOf(h1)) problems.push("no H1 text");
  const rest = textOf(main.replace(/<h1\b[\s\S]*?<\/h1>/, " ").replace(/<nav\b[\s\S]*?<\/nav>/g, " "));
  if (rest.length < 20) problems.push(`body text ${rest.length} chars`);
  const nullUrl = body.match(/poolrentalnearme\.(?:com\.au|co\.uk|com|ca)(?:null|undefined)/);
  if (nullUrl) problems.push(`URL "${nullUrl[0]}"`);
  return problems;
}

const PAGES = {
  live: "/p/fixture-live-page",
  blog: "/p/fixture-blog-post",
  spanish: "/p/es/fixture-pagina",
  comparison: "/p/peerspace-vs-pool-rental-near-me-in-akron",
  comparison2: "/p/giggster-vs-pool-rental-near-me-in-akron",
  stateHub: "/p/pool-rentals-ohio",
  stateIndex: "/p/pool-rentals",
  provider: "/p/pool-pros/fixture-pool-pro",
  category: "/p/pool-pros/c/pool-builders",
  categoryState: "/p/pool-pros/c/pool-builders/oh",
  categoryCity: "/p/pool-pros/c/pool-builders/oh/akron",
  course: "/p/course/fixture-course",
  // /p/ hubs whose failed reads used to render an empty or truncated 200.
  allLocations: "/p/all-locations",
  blogHub: "/p/blog",
  poolPros: "/p/pool-pros",
};

// Static comparison pillar pages: no database read of their own, so they are
// only rendered in the healthy phases, where the /p-target scan covers them
// (the Giggster one's BreadcrumbList once named /p/, a 404 since F11).
const STATIC_PAGES = [
  "/p/giggster-vs-pool-rental-near-me",
  "/p/peerspace-vs-pool-rental-near-me",
  "/p/swimply-alternative-vs-pool-rental-near-me",
];

// Every sitemap route that reads the database. `host` matters for the ccTLD one.
const SITEMAPS = [
  { path: "/sitemap-static.xml" },
  { path: "/sitemap-pages-comparisons.xml" },
  { path: "/sitemap-pages-blog.xml" },
  { path: "/sitemap-listings.xml" },
  // The canonical (bare) country host: the only one whose list reads the
  // database (www.<ccTLD> answers an empty urlset without a read).
  { path: "/sitemap-country.xml", host: "poolrentalnearme.co.uk" },
  { path: "/sitemap-pages-host-acquisition.xml" },
  { path: "/sitemap-pages-articles.xml" },
  { path: "/sitemap-pages-event-guides.xml" },
  { path: "/sitemap-pages-academy.xml" },
  { path: "/sitemap-pages-advocacy.xml" },
  { path: "/sitemap-pages-spanish.xml" },
  { path: "/sitemap-pages-swim-instructor.xml" },
  { path: "/sitemap-pages-money.xml" },
  { path: "/sitemap-pages-cities.xml" },
];
// Template groups the fixtures have no row for answer a legitimate empty 200.
const SITEMAPS_EMPTY_WHEN_HEALTHY = new Set([
  "/sitemap-pages-event-guides.xml",
  "/sitemap-pages-advocacy.xml",
  "/sitemap-pages-swim-instructor.xml",
  "/sitemap-pages-money.xml",
  "/sitemap-pages-cities.xml",
]);

let failureSlugSeq = 0;

async function failurePhase(mode, { cold = false } = {}) {
  const phase = cold ? `${mode} (cold start)` : mode;
  stub.setMode(mode);
  const mark = stub.requests.length;

  // A page that exists in the fixtures: must not become a 404.
  const live = await get(PAGES.live);
  check(
    phase,
    `${PAGES.live} (exists) -> 503, Retry-After, no-store, not 404/301`,
    is503(live).length === 0,
    `${describe(live)} ${is503(live).join("; ")}`,
  );
  check(
    phase,
    "503 body is small and marked noindex",
    live.status === 503 &&
      live.body.length < 4000 &&
      (/noindex/.test(live.headers.get("x-robots-tag") || "") ||
        /name="robots" content="noindex"/.test(live.body)),
    `${live.body.length} bytes`,
  );

  // An unknown become-host slug: must not become the 301 to /p/become-a-host.
  const hostSlug = `/p/become-a-swimming-pool-host-nowhere-${++failureSlugSeq}`;
  const host = await get(hostSlug);
  check(
    phase,
    `unknown become-a-swimming-pool-host-<x> -> 503, not 301`,
    is503(host).length === 0,
    `${describe(host)} ${is503(host).join("; ")}`,
  );

  // A confirmed comparison duplicate 301s from a checked-in list, before any
  // read, so it does not depend on the database at all.
  const dup = await get("/p/giggster-vs-pool-rental-near-me-in-boston");
  check(
    phase,
    "confirmed duplicate -> 301 to its -boston-ma twin without a read",
    dup.status === 301 &&
      /\/p\/giggster-vs-pool-rental-near-me-in-boston-ma$/.test(dup.headers.get("location") || ""),
    describe(dup),
  );

  // Client-side navigation reaches the same lookup through the RPC endpoint.
  // The client must be told "unavailable" (so it shows the retryable error
  // state), not "not_found" (which would render Not Found and call log404).
  const rpc = await rpcLookup("fixture-live-page");
  check(
    phase,
    'RPC lookupContentPage -> kind "unavailable" (not not_found), HTTP 503, no-store',
    rpc.result?.kind === "unavailable" &&
      rpc.status === 503 &&
      /no-store/.test(rpc.headers.get("cache-control") || ""),
    `HTTP ${rpc.status}, kind ${rpc.result?.kind}, Cache-Control "${rpc.headers.get("cache-control") || ""}" ${rpc.note}`,
  );

  // Every other /p/ route that used to turn a failed read into a 404.
  const others = await Promise.all(
    Object.entries(PAGES)
      .filter(([k]) => k !== "live")
      .map(async ([k, p]) => [k, await get(p)]),
  );
  for (const [k, r] of others) {
    check(
      phase,
      `${r.path} -> 503 (not 404/301/200)`,
      is503(r).length === 0,
      `${describe(r)} ${is503(r).join("; ")}`,
    );
  }

  // Sitemaps: 503 + no-store, never a 200 with zero <loc>.
  const maps = await Promise.all(SITEMAPS.map((s) => get(s.path, s)));
  for (const r of maps) {
    const n = countLocs(r.body);
    check(
      phase,
      `${r.path} -> 503 + no-store, no <loc>`,
      is503(r).length === 0 && n === 0,
      `${describe(r)}, ${n} <loc> ${is503(r).join("; ")}`,
    );
  }

  // Retired: 410 whatever the database does (it reads nothing).
  const dir = await get("/sitemap-directory.xml");
  check(
    phase,
    "/sitemap-directory.xml -> 410 Gone, no <loc>",
    dir.status === 410 && countLocs(dir.body) === 0,
    `${describe(dir)}, ${countLocs(dir.body)} <loc>`,
  );

  // The index is memoised in-process once built, so only a cold process must
  // answer 503; a warm one may keep serving the last complete index.
  const index = await get("/sitemap.xml");
  const n = countLocs(index.body);
  if (cold) {
    check(
      phase,
      "/sitemap.xml (nothing memoised) -> 503 + no-store",
      is503(index).length === 0 && n === 0,
      `${describe(index)}, ${n} <loc> ${is503(index).join("; ")}`,
    );
  } else {
    const served = index.status === 200 && n > 0;
    check(
      phase,
      "/sitemap.xml -> 503, or the last complete index from memory; never 200 with zero <loc>",
      served || (is503(index).length === 0 && n === 0),
      `${describe(index)}, ${n} <loc>`,
    );
  }

  // Nothing may have been logged as a 404: no read of, and no write to, content_404_log.
  await sleep(400);
  const logged = logRequests(mark);
  check(
    phase,
    "no log404: zero requests to content_404_log",
    logged.length === 0,
    `${logged.length} request(s): ${logged.map((r) => r.method).join(",")}`,
  );
  check(
    phase,
    "the stub did see the failing reads",
    requestsSince(mark).some((r) => r.table === "content_pages"),
    `${requestsSince(mark).length} request(s)`,
  );
}

async function healthyPhase(phase) {
  stub.setMode("healthy");
  renderedPages = new Map();

  const live = await get(PAGES.live);
  check(
    phase,
    `${PAGES.live} -> 200 with the fixture title`,
    live.status === 200 && live.body.includes(TITLE),
    describe(live),
  );
  check(
    phase,
    "a served page is still cacheable (no no-store)",
    !/no-store/.test(live.headers.get("cache-control") || ""),
    `Cache-Control "${live.headers.get("cache-control") || ""}"`,
  );

  const rpcFound = await rpcLookup("fixture-live-page");
  check(
    phase,
    'RPC lookupContentPage (exists) -> HTTP 200, kind "found"',
    rpcFound.status === 200 && rpcFound.result?.kind === "found",
    `HTTP ${rpcFound.status}, kind ${rpcFound.result?.kind} ${rpcFound.note}`,
  );
  const rpcMissing = await rpcLookup("fixture-never-existed");
  check(
    phase,
    'RPC lookupContentPage (unknown) -> HTTP 200, kind "not_found"',
    rpcMissing.status === 200 && rpcMissing.result?.kind === "not_found",
    `HTTP ${rpcMissing.status}, kind ${rpcMissing.result?.kind} ${rpcMissing.note}`,
  );

  const blog = await get(PAGES.blog);
  check(
    phase,
    `${PAGES.blog} (blog_posts fallback) -> 200 with its title`,
    blog.status === 200 && blog.body.includes(BLOG_TITLE),
    describe(blog),
  );

  const es = await get(PAGES.spanish);
  check(
    phase,
    `${PAGES.spanish} -> 200 with its title`,
    es.status === 200 && es.body.includes(ES_TITLE),
    describe(es),
  );

  for (const key of [
    "comparison",
    "comparison2",
    "stateHub",
    "stateIndex",
    "provider",
    "category",
    "categoryState",
    "categoryCity",
    "course",
  ]) {
    const r = await get(PAGES[key]);
    check(phase, `${r.path} -> 200`, r.status === 200, describe(r));
  }

  for (const path of STATIC_PAGES) {
    const r = await get(path);
    check(phase, `${path} (static) -> 200`, r.status === 200, describe(r));
  }

  // The hubs answer 200 with their rows, not merely 200.
  const hubs = [
    [PAGES.allLocations, ["/p/fixture-live-page", "/l/fixture-listing/"]],
    [PAGES.blogHub, [BLOG_TITLE]],
    [PAGES.poolPros, ["Fixture Pool Pro"]],
  ];
  for (const [path, needles] of hubs) {
    const r = await get(path);
    const missing = needles.filter((n) => !r.body.includes(n));
    check(
      phase,
      `${path} -> 200 listing its fixture rows`,
      r.status === 200 && missing.length === 0,
      `${describe(r)}${missing.length ? `, missing ${missing.join(", ")}` : ""}`,
    );
  }

  // A genuinely missing page keeps today's behaviour: 404 + a content_404_log write.
  let mark = stub.requests.length;
  const missingSlug = `/p/fixture-missing-${phase.replace(/\W+/g, "-")}`;
  const missing = await get(missingSlug);
  check(phase, `${missingSlug} (unknown) -> 404`, missing.status === 404, describe(missing));
  check(
    phase,
    "the stub saw the 404-log write",
    await waitForLogWrite(mark),
    `${logWrites(mark).length} write(s) to content_404_log`,
  );

  // …and the existing become-host rescue: 301 to /p/become-a-host, also logged.
  mark = stub.requests.length;
  const hostSlug = `/p/become-a-swimming-pool-host-nowhere-${phase.replace(/\W+/g, "-")}`;
  const host = await get(hostSlug);
  check(
    phase,
    "unknown become-a-swimming-pool-host-<x> -> 301 /p/become-a-host (unchanged)",
    host.status === 301 && /\/p\/become-a-host$/.test(host.headers.get("location") || ""),
    describe(host),
  );
  check(
    phase,
    "…and the stub saw its 404-log write",
    await waitForLogWrite(mark),
    `${logWrites(mark).length} write(s)`,
  );

  // F11: /p and /p/ are not pages and must not redirect (production looped:
  // nginx 301 /p -> /p/, router 307 /p/ -> /p). Known junk slugs are a plain
  // 404, not a 301 to the homepage, and are not logged.
  for (const path of ["/p", "/p/"]) {
    const r = await get(path);
    check(
      phase,
      `${path} -> 404 with no Location`,
      r.status === 404 && !r.headers.get("location"),
      describe(r),
    );
  }
  mark = stub.requests.length;
  for (const path of ["/p/null", "/p/details", "/p/mailto:someone"]) {
    const r = await get(path);
    check(
      phase,
      `${path} -> 404, not a redirect to the homepage`,
      r.status === 404 && !r.headers.get("location"),
      describe(r),
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  check(phase, "junk slugs wrote no 404-log row", logWrites(mark).length === 0, `${logWrites(mark).length} write(s)`);

  // A missing slug whose characters are array or filter syntax is still just
  // missing. Postgres rejects an unquoted `{city}` or `"` in an array literal
  // (22P02, HTTP 400) on every retry, so taking that for a failed read would
  // answer 503 forever, with no 404-log row and no become-host rescue. A page
  // request for such a path is 307'd by the router's own path normalisation
  // before any route runs (unchanged by this work), so the lookup is reached
  // the way a client-side navigation reaches it: through the RPC endpoint.
  for (const slug of ["become-a-swimming-pool-host-{city}", 'fixture-missing-"quoted"']) {
    const r = await rpcLookup(slug);
    check(
      phase,
      `RPC lookupContentPage(${JSON.stringify(slug)}) -> HTTP 200, kind "not_found" (not unavailable)`,
      r.status === 200 && r.result?.kind === "not_found",
      `HTTP ${r.status}, kind ${r.result?.kind} ${r.note}`,
    );
  }
  const braced = await rpcLookup("fixture-old-{slug}");
  check(
    phase,
    'RPC lookupContentPage("fixture-old-{slug}") (a legacy alias) -> redirect to the canonical slug',
    braced.status === 200 &&
      braced.result?.kind === "redirect" &&
      braced.result?.canonicalSlug === "fixture-live-page",
    `HTTP ${braced.status}, kind ${braced.result?.kind} ${braced.note}`,
  );
  // A backslash does reach the route: still a plain 404 with its log row.
  mark = stub.requests.length;
  const slashPath = `/p/fixture-missing-%5Cslash-${phase.replace(/\W+/g, "-")}`;
  const slash = await get(slashPath);
  check(phase, `${slashPath} (unknown) -> 404`, slash.status === 404, describe(slash));
  check(
    phase,
    "…and the stub saw its 404-log write",
    await waitForLogWrite(mark),
    `${logWrites(mark).length} write(s)`,
  );

  // Unchanged redirect handling.
  const alias = await get("/p/fixture-old-slug");
  check(
    phase,
    "legacy slug -> 301 to the canonical slug",
    alias.status === 301 && /\/p\/fixture-live-page$/.test(alias.headers.get("location") || ""),
    describe(alias),
  );
  const row = await get("/p/fixture-redirect-row");
  check(
    phase,
    "redirect row (redirect_to) -> 301",
    row.status === 301 && /\/p\/fixture-live-page$/.test(row.headers.get("location") || ""),
    describe(row),
  );
  const upper = await get("/p/Fixture-Live-Page");
  check(
    phase,
    "mixed-case slug -> 301 to lowercase",
    upper.status === 301 && /\/p\/fixture-live-page$/.test(upper.headers.get("location") || ""),
    describe(upper),
  );
  const bare = await get("/p/become-a-swimming-pool-host-akron");
  check(
    phase,
    "bare-city host slug -> 301 to the state-suffixed page",
    bare.status === 301 &&
      /\/p\/become-a-swimming-pool-host-akron-oh$/.test(bare.headers.get("location") || ""),
    describe(bare),
  );

  // Other routes still 404 on a row that really is not there.
  for (const p of [
    "/p/es/fixture-missing",
    "/p/peerspace-vs-pool-rental-near-me-in-nowhere",
    "/p/pool-rentals-atlantis",
    "/p/pool-pros/fixture-missing",
    "/p/pool-pros/c/fixture-missing",
    "/p/course/fixture-missing",
    // A category slug that breaks the providers or=(...) filter (PostgREST
    // 400 on every retry) is a missing category, not an outage.
    "/p/pool-pros/c/foo,bar",
    "/p/pool-pros/c/foo,bar/oh",
    "/p/pool-pros/c/foo,bar/oh/akron",
    "/p/pool-pros/c/foo)",
  ]) {
    const r = await get(p);
    check(phase, `${p} (unknown) -> 404`, r.status === 404, describe(r));
  }

  for (const s of SITEMAPS) {
    const r = await get(s.path, s);
    const n = countLocs(r.body);
    if (SITEMAPS_EMPTY_WHEN_HEALTHY.has(s.path)) {
      check(
        phase,
        `${s.path} -> 200 (no fixture rows for this group: empty by data, not by failure)`,
        r.status === 200 && n === 0,
        `${describe(r)}, ${n} <loc>`,
      );
    } else {
      check(
        phase,
        `${s.path} -> 200 with at least one <loc>`,
        r.status === 200 && n > 0,
        `${describe(r)}, ${n} <loc>`,
      );
    }
  }
  const index = await get("/sitemap.xml");
  check(
    phase,
    "/sitemap.xml -> 200 with at least one <loc>",
    index.status === 200 && countLocs(index.body) > 0,
    `${describe(index)}, ${countLocs(index.body)} <loc>`,
  );

  // No sitemap <loc> may name /p or /p/ either.
  const sitemapBare = [];
  for (const s of [...SITEMAPS, { path: "/sitemap.xml" }]) {
    const r = await get(s.path, s);
    for (const m of r.body.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)) {
      if (isBarePTarget(decodeEntities(m[1]))) sitemapBare.push(`${s.path}: ${m[1]}`);
    }
  }
  check(phase, "no sitemap <loc> is /p or /p/", sitemapBare.length === 0, sitemapBare.join("; "));

  // F11 follow-up: no rendered fixture page links to, or names in JSON-LD, /p or /p/.
  const pages = renderedPages;
  renderedPages = null;
  const selfTest = barePTargets(
    '<a href="/p/">x</a><script type="application/ld+json">' +
      '{"itemListElement":[{"item":"https://www.poolrentalnearme.com/p/"}]}</script>',
  );
  check(
    phase,
    "the /p-target detector flags a synthetic href and JSON-LD crumb",
    selfTest.length === 2,
    selfTest.join("; "),
  );
  const offenders = [];
  for (const [path, body] of pages) {
    const hits = barePTargets(body);
    if (hits.length) offenders.push(`${path}: ${hits.join(", ")}`);
  }
  check(
    phase,
    `no rendered page (${pages.size}) has an href or JSON-LD URL targeting /p or /p/`,
    pages.size > 0 && offenders.length === 0,
    offenders.join(" | ") || `${pages.size} page(s) scanned`,
  );

  await sitemapIntegrity(phase, index);
  await comparisonDuplicates(phase);
  await canonicalHosts(phase);
}

const locsOf = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
const localPath = (loc) => {
  const u = new URL(loc);
  return `${u.pathname}${u.search}`;
};

/**
 * Healthy mode: every child the index lists exists and is non-empty; no URL
 * is listed twice across all children; none of the fixture rows that an
 * exclusion rule is for is listed; every listed /p/ URL this app serves
 * answers 200, is not noindex and is its own canonical; comparisons pages
 * past PostgREST's 1,000-row cap are listed.
 */
async function sitemapIntegrity(phase, index) {
  const children = locsOf(index.body).map(localPath);
  const byChild = new Map();
  for (const path of children) {
    const r = await get(path);
    const urls = locsOf(r.body);
    byChild.set(path, urls);
    check(
      phase,
      `index child ${path} -> 200 and non-empty`,
      r.status === 200 && urls.length > 0,
      `${describe(r)}, ${urls.length} <loc>`,
    );
  }
  // An orphan: a database-backed child with entries that the index leaves out.
  for (const s of SITEMAPS.filter((x) => !x.host)) {
    if (children.includes(s.path)) continue;
    const r = await get(s.path);
    check(
      phase,
      `${s.path} not in the index -> it has no entries (no orphan sitemap)`,
      r.status === 200 && countLocs(r.body) === 0,
      `${describe(r)}, ${countLocs(r.body)} <loc>`,
    );
  }

  const where = new Map();
  for (const [child, urls] of byChild) {
    for (const u of urls) where.set(u, [...(where.get(u) ?? []), child]);
  }
  const dupes = [...where].filter(([, c]) => c.length > 1);
  check(
    phase,
    "no URL is listed twice across the index's children",
    dupes.length === 0,
    dupes
      .slice(0, 5)
      .map(([u, c]) => `${u} in ${c.join(" + ")}`)
      .join("; "),
  );

  const SITE = "https://www.poolrentalnearme.com";
  const forbidden = {
    "/p/fixture_underscore_slug": "redirecting (underscore) slug",
    "/p/pool-pros": "noindex route",
    "/p/fixture-hosting-uk": "canonical on another host",
    "/p/fixture-shadowed": "shadowed by a redirect row",
    "/p/fixture-old-slug": "blog post on a legacy alias (301)",
    "/p/fixture-untyped-page": "unreviewed untyped page",
    "/p/fixture-stray-copy)": "malformed slug (stray copy)",
    "/p/fixture--double-hyphen": "malformed slug (double hyphen)",
    "/p/fixture-redirect-row": "redirect row",
    "/p/giggster-vs-pool-rental-near-me-in-fixture-city-0002": "redirected comparison page",
    "/l/config-listing-do-not-delete/6768ea36-b435-40df-b331-43be74aa882f": "configuration listing",
    // Country pages: canonical on their ccTLD, listed only by its sitemap-country.xml.
    "/p/rent-out-your-pool-uk": "country_launch page (canonical on poolrentalnearme.co.uk)",
    "/p/pool-rental-london": "country page (canonical on poolrentalnearme.co.uk)",
    "/p/fixture-maintenance-uk": "country page (canonical on poolrentalnearme.co.uk)",
    "/p/fixture-maintenance-canada": "country page (canonical on poolrentalnearme.ca)",
    "/p/fixture-blog-uk": "country blog post (canonical on poolrentalnearme.co.uk)",
    // Confirmed exact duplicates: 301 to the state-suffixed twin.
    "/p/giggster-vs-pool-rental-near-me-in-boston": "exact duplicate (301 to -boston-ma)",
    "/p/peerspace-vs-pool-rental-near-me-in-boston": "exact duplicate (301 to -boston-ma)",
  };
  for (const [path, why] of Object.entries(forbidden)) {
    const listedIn = where.get(`${SITE}${path}`) ?? [];
    check(phase, `not listed: ${path} (${why})`, listedIn.length === 0, `listed in ${listedIn.join(", ")}`);
  }
  const owners = {
    "/p/fixture-shared-slug": "/sitemap-pages-articles.xml",
    "/p/all-locations": "/sitemap-static.xml",
    "/p/elearning-academy-fixture-course": "/sitemap-pages-academy.xml",
    "/p/fixture-blog-post": "/sitemap-pages-blog.xml",
    "/p/fixture-blog-behind-redirect": "/sitemap-pages-blog.xml",
    "/l/fixture-listing/00000000-0000-4000-8000-0000000000c1": "/sitemap-listings.xml",
    // Its ccTLD override is ignored (wrong host for a US page): a www page again.
    "/p/fixture-us-wrong-override": "/sitemap-pages-articles.xml",
    // Its override names a UK page: ignored, still a www page.
    "/p/fixture-us-cross-override": "/sitemap-pages-articles.xml",
    // Little Canada, MN: a US page, though its slug ends in "-canada".
    "/p/fixture-host-little-canada": "/sitemap-pages-articles.xml",
    // url_path NULL: listed at /p/<slug> like any other page.
    "/p/fixture-null-path-us": "/sitemap-pages-articles.xml",
  };
  for (const [path, owner] of Object.entries(owners)) {
    const listedIn = where.get(`${SITE}${path}`) ?? [];
    check(
      phase,
      `listed once, by its owner: ${path} in ${owner}`,
      listedIn.length === 1 && listedIn[0] === owner,
      `listed in ${listedIn.join(", ") || "nothing"}`,
    );
  }

  const comparisons = byChild.get("/sitemap-pages-comparisons.xml") ?? [];
  const cities = FIXTURES.cities.filter((c) => c.is_published).length;
  // The expected list, derived from the fixtures: the three pillars, plus two
  // city pages per published city, minus each city page a content row
  // redirects and minus each one the checked-in duplicate list 301s
  // (isComparisonDuplicatePath — every such fixture, not a hard-coded few).
  const redirectedSlugs = new Set(
    FIXTURES.content_pages.filter((r) => r.redirect_to && /-vs-pool-rental-near-me-in-/.test(r.slug)).map((r) => r.slug),
  );
  const expectedComparisons = new Set([
    `${SITE}/p/giggster-vs-pool-rental-near-me`,
    `${SITE}/p/peerspace-vs-pool-rental-near-me`,
    `${SITE}/p/swimply-alternative-vs-pool-rental-near-me`,
  ]);
  let duplicateFixturePaths = 0;
  for (const c of FIXTURES.cities.filter((x) => x.is_published)) {
    for (const prefix of ["giggster-vs-pool-rental-near-me-in-", "peerspace-vs-pool-rental-near-me-in-"]) {
      const slug = `${prefix}${c.slug}`;
      if (redirectedSlugs.has(slug)) continue;
      if (isComparisonDuplicatePath(`/p/${slug}`)) {
        duplicateFixturePaths++;
        continue;
      }
      expectedComparisons.add(`${SITE}/p/${slug}`);
    }
  }
  const comparisonListProblems = (list) => {
    const listed = new Set(list);
    const missing = [...expectedComparisons].filter((u) => !listed.has(u));
    const extra = [...listed].filter((u) => !expectedComparisons.has(u));
    const problems = [];
    if (list.length <= 1000) problems.push(`${list.length} entries (not past the 1,000-row cap)`);
    if (list.length !== listed.size) problems.push(`${list.length - listed.size} repeated`);
    if (missing.length) problems.push(`missing ${missing.length}: ${missing.slice(0, 3).join(" ")}`);
    if (extra.length) problems.push(`unexpected ${extra.length}: ${extra.slice(0, 3).join(" ")}`);
    return problems;
  };
  const comparisonProblems = comparisonListProblems(comparisons);
  check(
    phase,
    `comparisons paging: ${cities} published cities (> 1,000) -> exactly the expected ${expectedComparisons.size} entries (3 pillars + 2 per city - ${redirectedSlugs.size} redirected - ${duplicateFixturePaths} on the duplicate list)`,
    duplicateFixturePaths >= 4 && comparisonProblems.length === 0,
    `${comparisons.length} entries for ${cities} cities; ${comparisonProblems.join("; ")}`,
  );
  // The check itself must notice one genuinely missing city page.
  const dropped = `${SITE}/p/peerspace-vs-pool-rental-near-me-in-fixture-city-1199`;
  check(
    phase,
    "comparisons paging check detects a missing entry (self-test: one city page removed)",
    comparisonListProblems(comparisons.filter((u) => u !== dropped)).some((p) => p.includes(dropped)),
    `${dropped} removed, check reported: ${comparisonListProblems(comparisons.filter((u) => u !== dropped)).join("; ") || "nothing"}`,
  );

  // Each listed URL this app serves: 200, not noindex, its own canonical.
  // Comparison city pages are one template, so a sample of them is enough.
  const served = [...where.keys()].filter((u) => {
    const p = new URL(u).pathname;
    if (p === "/s" || p.startsWith("/l/")) return false; // marketplace (WEST)
    if (/-vs-pool-rental-near-me-in-/.test(p)) return /fixture-city-(0000|0999|1199)$|-akron$|-boston-ma$/.test(p);
    return true;
  });
  const bad = [];
  for (const u of served) {
    const r = await get(localPath(u));
    const canon = r.body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
    const noindex =
      /noindex/.test(r.headers.get("x-robots-tag") || "") ||
      /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(r.body);
    const rendered = renderedPageProblems(r.body);
    if (r.status !== 200 || noindex || canon !== u || rendered.length) {
      bad.push(
        `${localPath(u)}: ${r.status}${noindex ? " noindex" : ""}${canon !== u ? ` canonical ${canon ?? "missing"}` : ""}${rendered.length ? ` ${rendered.join(", ")}` : ""}`,
      );
    }
  }
  check(
    phase,
    `every listed URL served here (${served.length}) -> 200, indexable, self-canonical, a non-empty H1 and body`,
    bad.length === 0,
    bad.slice(0, 6).join("; "),
  );
}

/**
 * Audit F6(a): each confirmed exact duplicate answers ONE 301 to its
 * state-suffixed twin, which answers 200 and is its own canonical; a city
 * comparison that is not on the list is untouched. Integration trial
 * 2026-11-16: the twin's canonical is never a 301 source even when only the
 * bare cities row exists (Charlotte), and the trailing-slash form of a listed
 * bare URL reaches the twin in one 301, not a 307 strip then the 301.
 */
async function comparisonDuplicates(phase) {
  const SITE = "https://www.poolrentalnearme.com";
  const canonicalOf = (body) => [...body.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  // Every absolute URL in the page's JSON-LD that names a comparison city page.
  const comparisonUrlsInJsonLd = (body) =>
    [...body.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) =>
      [...m[1].matchAll(/https:\/\/[^"\\]+-vs-pool-rental-near-me-in-[a-z0-9-]+/g)].map((u) => u[0]),
    );
  for (const competitor of ["giggster", "peerspace"]) {
    // boston + boston-ma both have a cities row; charlotte has only the bare row.
    for (const city of ["boston", "charlotte"]) {
      const bare = `/p/${competitor}-vs-pool-rental-near-me-in-${city}`;
      const twin = comparisonDuplicateTarget(bare);
      if (!twin) {
        check(phase, `${bare} is on the duplicate list`, false, "not listed: fixture out of date");
        continue;
      }
      const r = await get(bare);
      const loc = r.headers.get("location") || "";
      check(phase, `${bare} -> 301 ${twin}`, r.status === 301 && loc.endsWith(twin), describe(r));
      const slash = await get(`${bare}/`);
      const slashLoc = slash.headers.get("location") || "";
      check(
        phase,
        `${bare}/ -> ONE 301 straight to ${twin} (no 307 trailing-slash hop first)`,
        slash.status === 301 && new URL(slashLoc, "http://localhost").pathname === twin,
        describe(slash),
      );
      const t = await get(twin);
      const canons = canonicalOf(t.body);
      const ogUrl = t.body.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/)?.[1];
      const ld = comparisonUrlsInJsonLd(t.body);
      const loops = [...canons, ogUrl ?? "", ...ld].filter((u) => u && isComparisonDuplicatePath(new URL(u).pathname));
      check(
        phase,
        `${twin} -> 200, canonical itself, no canonical/og:url/JSON-LD URL that 301s (one hop, no loop)`,
        t.status === 200 && canons.length === 1 && canons[0] === `${SITE}${twin}` && ogUrl === `${SITE}${twin}` && loops.length === 0,
        `${describe(t)} canonical ${canons.join(" + ") || "missing"}, og:url ${ogUrl}${loops.length ? `, 301 sources: ${loops.join(" ")}` : ""}`,
      );
    }
  }
  const other = await get("/p/peerspace-vs-pool-rental-near-me-in-akron");
  check(phase, "a comparison not on the list is unchanged (200)", other.status === 200, describe(other));
  // Trailing-slash handling of every other URL is unchanged: the router's 307 strip.
  for (const p of [
    "/p/peerspace-vs-pool-rental-near-me-in-akron/",
    "/p/giggster-vs-pool-rental-near-me-in-boston-ma/",
    "/p/fixture-live-page/",
  ]) {
    const r = await get(p);
    check(
      phase,
      `${p} (not a listed duplicate) -> unchanged 307 to ${p.slice(0, -1)}`,
      r.status === 307 && (r.headers.get("location") || "").endsWith(p.slice(0, -1)),
      describe(r),
    );
  }
}

/**
 * Audit F10: the canonical host comes from the explicit country mapping, not
 * from the host that served the request. Every request carries
 * X-Forwarded-Host as production's proxies set it.
 */
async function canonicalHosts(phase) {
  const WWW = "https://www.poolrentalnearme.com";
  const HOSTS = {
    "www.poolrentalnearme.com": null,
    "poolrentalnearme.co.uk": "poolrentalnearme.co.uk",
    "www.poolrentalnearme.co.uk": "poolrentalnearme.co.uk",
    "poolrentalnearme.ca": "poolrentalnearme.ca",
    "www.poolrentalnearme.ca": "poolrentalnearme.ca",
    "poolrentalnearme.com.au": "poolrentalnearme.com.au",
    "www.poolrentalnearme.com.au": "poolrentalnearme.com.au",
  };
  const PAGES = {
    "/p/fixture-live-page": WWW,
    "/p/fixture-us-wrong-override": WWW,
    "/p/peerspace-vs-pool-rental-near-me-in-akron": WWW,
    "/p/es/fixture-pagina": WWW,
    "/p/rent-out-your-pool-uk": "https://poolrentalnearme.co.uk",
    "/p/pool-rental-london": "https://poolrentalnearme.co.uk",
    "/p/fixture-maintenance-uk": "https://poolrentalnearme.co.uk",
    "/p/fixture-maintenance-canada": "https://poolrentalnearme.ca",
    "/p/fixture-maintenance-australia": "https://poolrentalnearme.com.au",
    "/p/pool-rental-toronto": "https://poolrentalnearme.ca",
    "/p/fixture-twin-en": WWW,
    "/p/fixture-maintenance": WWW,
    "/p/fixture-us-cross-override": WWW,
    "/p/fixture-host-little-canada": WWW,
    "/p/fixture-blog-uk": "https://poolrentalnearme.co.uk",
    // url_path NULL: one per market and a US page.
    "/p/fixture-null-path-uk": "https://poolrentalnearme.co.uk",
    "/p/fixture-null-path-canada": "https://poolrentalnearme.ca",
    "/p/fixture-null-path-australia": "https://poolrentalnearme.com.au",
    "/p/fixture-null-path-us": WWW,
  };
  // Pages whose own markup must carry no hreflang: no defined equivalent.
  const NO_HREFLANG = new Set([
    "/p/rent-out-your-pool-uk",
    "/p/pool-rental-london",
    "/p/pool-rental-toronto",
    "/p/fixture-maintenance",
    "/p/fixture-us-cross-override",
    "/p/fixture-host-little-canada",
    "/p/fixture-blog-uk",
    "/p/fixture-null-path-uk",
    "/p/fixture-null-path-canada",
    "/p/fixture-null-path-australia",
    "/p/fixture-null-path-us",
  ]);
  const OUR_HOSTS = new Set(Object.keys(HOSTS).concat(["poolrentalnearme.com", "localhost"]));
  /** Every absolute URL in the page's JSON-LD that names the page itself (same path, any of our hosts). */
  const selfUrlsInJsonLd = (body, path) => {
    const out = [];
    const walk = (v) => {
      if (typeof v === "string") {
        try {
          const u = new URL(v);
          if (OUR_HOSTS.has(u.hostname) && u.pathname === path) out.push(v);
        } catch {
          /* not a URL */
        }
      } else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.values(v).forEach(walk);
    };
    for (const m of body.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      try {
        walk(JSON.parse(m[1]));
      } catch {
        out.push(`unparseable JSON-LD`);
      }
    }
    return out;
  };
  /** Same-origin files the page's markup loads (link/script/img), not page links. */
  const renderAssetsOf = (body) =>
    [
      ...new Set(
        [...body.matchAll(/<(?:link|script|img)\b[^>]*?\s(?:href|src)="(\/[^"/][^"]*)"/g)].map((m) =>
          m[1].replace(/&amp;/g, "&"),
        ),
      ),
    ];
  /** Google's robots.txt matching (RFC 9309): longest pattern wins, a tie goes to Allow. */
  const robotsAllows = (body, path) => {
    let best = { len: -1, allow: true };
    for (const line of body.split("\n")) {
      const m = line.match(/^(Allow|Disallow):\s*(\S*)\s*$/);
      if (!m || !m[2]) continue;
      const pat = m[2];
      const anchored = pat.endsWith("$");
      const core = (anchored ? pat.slice(0, -1) : pat).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      if (!new RegExp(`^${core}${anchored ? "$" : ""}`).test(path)) continue;
      const allow = m[1] === "Allow";
      if (pat.length > best.len || (pat.length === best.len && allow)) best = { len: pat.length, allow };
    }
    return best.allow;
  };
  // What sitemap-country.xml must list on each country (both host variants).
  const COUNTRY_LOCS = {
    "poolrentalnearme.co.uk": [
      "/p/fixture-blog-uk",
      "/p/fixture-hosting-uk",
      "/p/fixture-maintenance-uk",
      "/p/pool-rental-london",
      "/p/rent-out-your-pool-uk",
    ],
    "poolrentalnearme.ca": ["/p/fixture-maintenance-canada", "/p/pool-rental-toronto"],
    "poolrentalnearme.com.au": ["/p/fixture-maintenance-australia"],
  };
  const hreflangOf = (body) =>
    [...body.matchAll(/<link[^>]+rel="alternate"[^>]*>/g)]
      .map((m) => [m[0].match(/hreflang="([^"]+)"/)?.[1], m[0].match(/href="([^"]+)"/)?.[1]])
      .filter(([l]) => l)
      .map(([l, h]) => `${l} ${h}`)
      .sort();
  const MAINTENANCE_SET = [
    "en-AU https://poolrentalnearme.com.au/p/fixture-maintenance-australia",
    "en-CA https://poolrentalnearme.ca/p/fixture-maintenance-canada",
    "en-GB https://poolrentalnearme.co.uk/p/fixture-maintenance-uk",
  ];

  for (const [host, country] of Object.entries(HOSTS)) {
    const opts = { forwardedHost: host };
    const wrong = [];
    for (const [path, origin] of Object.entries(PAGES)) {
      const r = await get(path, opts);
      const canons = [...r.body.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
      const ogUrl = r.body.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/)?.[1];
      if (r.status !== 200 || canons.length !== 1 || canons[0] !== `${origin}${path}`) {
        wrong.push(`${path}: ${r.status} canonical ${canons.join(" + ") || "missing"}`);
      } else if (!/vs-pool-rental/.test(path) && ogUrl !== canons[0]) {
        wrong.push(`${path}: og:url ${ogUrl}`);
      }
      // Structured data names the page by its canonical URL too (breadcrumb
      // self crumb, mainEntityOfPage, LocalBusiness url), never by another host.
      const selfUrls = selfUrlsInJsonLd(r.body, path);
      const strayLd = selfUrls.filter((u) => u !== canons[0]);
      if (!/vs-pool-rental/.test(path) && (selfUrls.length === 0 || strayLd.length)) {
        wrong.push(`${path}: JSON-LD self URL ${strayLd.join(" + ") || "missing"}`);
      }
      // Every page renders: a non-empty H1 and body (a render that throws is
      // a 200 with an empty <main>), and no ".../null" URL anywhere.
      const rendered = renderedPageProblems(r.body);
      if (rendered.length) wrong.push(`${path}: ${rendered.join(", ")}`);
      const alts = hreflangOf(r.body);
      if (/fixture-maintenance-/.test(path)) {
        if (JSON.stringify(alts) !== JSON.stringify(MAINTENANCE_SET)) wrong.push(`${path}: hreflang ${alts.join(", ")}`);
      } else if (path === "/p/fixture-twin-en") {
        const want = [
          `en-US ${WWW}/p/fixture-twin-en`,
          `es-US ${WWW}/p/fixture-twin-es`,
          `x-default ${WWW}/p/fixture-twin-en`,
        ].sort();
        if (JSON.stringify(alts) !== JSON.stringify(want)) wrong.push(`${path}: hreflang ${alts.join(", ") || "none"}`);
      } else if (NO_HREFLANG.has(path) && alts.length) {
        wrong.push(`${path}: hreflang ${alts.join(", ")} (no defined equivalent)`);
      }
    }
    check(
      phase,
      `[${host}] every page renders (H1 + body); canonical + og:url + JSON-LD self URL: country pages on their ccTLD, every other page on www; hreflang only between equivalents`,
      wrong.length === 0,
      wrong.slice(0, 8).join("; "),
    );

    const robots = await get("/robots.txt", opts);
    const sm = await get("/sitemap-country.xml", opts);
    const locs = locsOf(sm.body);
    if (!country) {
      check(
        phase,
        `[${host}] robots.txt is the production body; sitemap-country.xml is empty`,
        robots.status === 200 &&
          /^Allow: \/$/m.test(robots.body) &&
          robots.body.includes(`Sitemap: ${WWW}/sitemap.xml`) &&
          sm.status === 200 &&
          locs.length === 0,
        `robots ${robots.status}, sitemap-country ${sm.status} ${locs.length} <loc>`,
      );
      continue;
    }
    const allow = [...robots.body.matchAll(/^Allow: (\S+)$/gm)].map((m) => m[1]);
    const problems = [];
    if (robots.status !== 200) problems.push(`status ${robots.status}`);
    if (!/^Disallow: \/$/m.test(robots.body)) problems.push("no Disallow: /");
    for (const need of ["/sitemap-country.xml$", "/fw-assets/"]) if (!allow.includes(need)) problems.push(`no Allow ${need}`);
    if (!robots.body.includes(`Sitemap: https://${country}/sitemap-country.xml`)) problems.push("Sitemap line not on the canonical host");
    for (const path of COUNTRY_LOCS[country]) {
      if (!robotsAllows(robots.body, path)) problems.push(`${path} not allowed`);
    }
    for (const [path, origin] of Object.entries(PAGES)) {
      if (origin !== `https://${country}` && robotsAllows(robots.body, path)) problems.push(`${path} (not this country's) allowed`);
    }
    if (allow.some((a) => !a.endsWith("$") && a !== "/fw-assets/")) problems.push(`unanchored Allow: ${allow.join(" ")}`);
    // Everything a country page loads from this origin (bundle, logo,
    // favicons) must be fetchable, or Google renders it without them.
    const page = await get(COUNTRY_LOCS[country][0], opts);
    const assets = renderAssetsOf(page.body);
    if (!assets.some((a) => a.startsWith("/fw-assets/")) || !assets.includes("/icon.svg")) {
      problems.push(`asset scan found too little: ${assets.join(" ")}`);
    }
    for (const a of assets) if (!robotsAllows(robots.body, a)) problems.push(`render asset ${a} blocked`);
    check(
      phase,
      `[${host}] robots.txt allows the mapped pages, its sitemap and every render asset a country page loads; nothing else (bare-host Sitemap line)`,
      problems.length === 0,
      problems.join("; "),
    );
    // The list lives on the canonical host only: www.<ccTLD> may not list
    // bare-host URLs (cross-host sitemap), so it answers an empty urlset.
    const want = host === country ? COUNTRY_LOCS[country].map((p) => `https://${country}${p}`).sort() : [];
    check(
      phase,
      host === country
        ? `[${host}] sitemap-country.xml lists exactly the country's mapped pages (blog posts included), on https://${country}`
        : `[${host}] sitemap-country.xml is an empty urlset (its pages' canonical host lists them)`,
      sm.status === 200 && /<urlset/.test(sm.body) && JSON.stringify([...locs].sort()) === JSON.stringify(want),
      `${describe(sm)}: ${locs.join(" ")}`,
    );
  }
}

// ───────────────────────── host_acq_city intent ─────────────────────────────

const decode = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
const h1sOf = (html) => [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1]));
const titleOf = (html) => decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "");
const metaDescriptionOf = (html) =>
  decode(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "");
/** The element whose opening tag carries `marker`, through its matching close. */
function elementWith(html, marker) {
  const at = html.indexOf(marker);
  if (at === -1) return "";
  const open = html.lastIndexOf("<", at);
  const tag = /^<([a-z0-9]+)/.exec(html.slice(open))?.[1];
  if (!tag) return "";
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, "g");
  re.lastIndex = open;
  let depth = 0;
  for (let m; (m = re.exec(html)); ) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(open, m.index + m[0].length);
  }
  return html.slice(open);
}
const numbersIn = (text) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

/** Independent haversine (miles) over the fixture coordinates. */
function fixtureMiles(aLat, aLng, bLat, bLng) {
  const r = (d) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(bLat - aLat) / 2) ** 2 +
    Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}
const cityRow = (slug) => FIXTURES.cities.find((c) => c.slug === slug);
const listingsIn = (citySlug, st) =>
  DISTINCT_LISTINGS.filter((l) => l.city_slug === citySlug && l.state_code === st);
/** "October 1, 2026" for the fixtures' NOW: the inventory's "Listing data as of" date. */
const AS_OF = new Date(NOW).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const AS_OF_NUMBERS = (AS_OF.match(/\d+/g) ?? []).map(Number);
/** Every number a fixture listing can legitimately put on a page. */
const LISTING_NUMBERS = new Set([
  ...INTENT_LISTINGS.flatMap((l) => {
    const allIn = l.price_amount + Math.floor((l.price_amount * 15 + 50) / 100);
    return [allIn / 100, l.capacity];
  }),
  ...AS_OF_NUMBERS,
]);
const NEARBY_RADIUS_MI = 60;

/**
 * The marketplace search link WEST honours for a fixture city, built here
 * independently of src/lib/search-links.ts: `address` plus `bounds`
 * ("neLat,neLng,swLat,swLng", 5 decimals) covering NEARBY_RADIUS_MI around the
 * inventory centre. WEST's SearchPage drops `address` and searches only by
 * `bounds`; an address-only link shows every pool, unordered.
 */
function boundedSearchHref(label, centre) {
  const dLat = NEARBY_RADIUS_MI / 69;
  const dLng = NEARBY_RADIUS_MI / (69 * Math.abs(Math.cos((centre.latitude * Math.PI) / 180)));
  const f = (n) => n.toFixed(5);
  const bounds = [centre.latitude + dLat, centre.longitude + dLng, centre.latitude - dLat, centre.longitude - dLng]
    .map(f)
    .join(",");
  return `/s?address=${encodeURIComponent(label)}&bounds=${encodeURIComponent(bounds)}`;
}
/** Every marketplace-search href on a page (attribute-decoded). */
const searchHrefsOf = (html) =>
  [...html.matchAll(/href="(\/s(?:\?[^"]*)?)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
/** The href of the element carrying data-primary-cta="renter". */
const primaryRenterHref = (html) =>
  (/<a[^>]*href="([^"]*)"[^>]*data-primary-cta="renter"/.exec(html)?.[1] ?? "").replace(/&amp;/g, "&");

async function intentChecks(phase) {
  stub.setMode("healthy");
  const pages = {};
  const slugs = [
    "become-a-swimming-pool-host-tempe-az",
    "become-a-swimming-pool-host-mesa-az",
    "become-a-swimming-pool-host-dayton-oh",
    "tempe-az",
    "mesa-az",
    "chevy-chase-md",
    "chapel-hill",
  ];
  for (const slug of slugs) {
    pages[slug] = await get(`/p/${slug}`);
    check(phase, `/p/${slug} -> 200`, pages[slug].status === 200, describe(pages[slug]));
  }
  const tempeHits = listingsIn("tempe", "AZ");
  const mesa = cityRow("mesa");
  const mesaMiles = DISTINCT_LISTINGS.map((l) =>
    fixtureMiles(mesa.latitude, mesa.longitude, l.latitude, l.longitude),
  ).sort((a, b) => a - b);

  const expectOne = (_phase, name, list, want) =>
    check(phase, name, list.length === 1 && list[0] === want, JSON.stringify(list));
  /** Raw HTML contains `needle` (attributes, hrefs). */
  const has = (r, needle) => r.body.includes(needle);
  /** Visible text contains `needle` (React puts <!-- --> between text nodes). */
  const hasText = (r, needle) => decode(r.body).includes(needle);
  const noEmptyNotice = (r) =>
    !hasText(r, "still adding pools") &&
    !hasText(r, "There are no pools listed in") &&
    !hasText(r, "No pools are listed in");
  const ogTitleOf = (html) => decode(/<meta property="og:title" content="([^"]*)"/.exec(html)?.[1] ?? "");
  const breadcrumbLists = (html) => (html.match(/"@type":"BreadcrumbList"/g) ?? []).length;
  /** Numbers in the given marked elements must all be fixture facts. */
  const numbersOk = (r, allowed, markers = ["data-renter-intro", "data-inventory="]) => {
    const text = decode(markers.map((m) => elementWith(r.body, m)).join(" "));
    const bad = numbersIn(text).filter((n) => !allowed.has(n));
    return { ok: bad.length === 0, detail: bad.length ? `unexpected ${bad.join(", ")} in "${text.slice(0, 300)}"` : "" };
  };
  /** Checks every host_acq_city page must pass. */
  const common = (label, r) => {
    check(
      phase,
      `${label}: host CTAs go straight to /wizard/ (no 302 draft URL)`,
      !has(r, "/l/draft/") && has(r, 'href="/wizard/"'),
    );
    check(phase, `${label}: og:title equals <title>`, ogTitleOf(r.body) === titleOf(r.body), ogTitleOf(r.body));
    check(phase, `${label}: exactly one BreadcrumbList`, breadcrumbLists(r.body) === 1, String(breadcrumbLists(r.body)));
    check(phase, `${label}: no stated earnings figure in the hero, title or meta`, !/\$\d/.test(
      decode(elementWith(r.body, "data-host-lede")) + titleOf(r.body) + metaDescriptionOf(r.body) + ogTitleOf(r.body),
    ));
  };

  // ── HOST with pools listed in the city ───────────────────────────────────
  const hostT = pages["become-a-swimming-pool-host-tempe-az"];
  common("HOST Tempe", hostT);
  expectOne(
    phase,
    "HOST Tempe: one H1, host value with the state",
    h1sOf(hostT.body),
    "Rent out your pool in Tempe, AZ by the hour. 0% host fees. Keep 100%.",
  );
  check(
    phase,
    "HOST Tempe: stored title states an earnings figure, so the rule's title replaces it",
    titleOf(hostT.body) === "Become a Pool Host in Tempe, AZ | 0% Host Fees",
    titleOf(hostT.body),
  );
  check(
    phase,
    "HOST Tempe: stored earnings description is neither the hero lede nor the meta description",
    decode(elementWith(hostT.body, "data-host-lede")).startsWith("List your Tempe pool on Pool Rental Near Me") &&
      metaDescriptionOf(hostT.body).startsWith("Rent out your pool in Tempe, AZ by the hour on Pool Rental Near Me.") &&
      // (the stored row also travels in the dehydrated loader data; only rendered text counts)
      !decode(hostT.body.replace(/<script[\s\S]*?<\/script>/g, "")).includes("side hustle"),
    `${decode(elementWith(hostT.body, "data-host-lede"))} || ${metaDescriptionOf(hostT.body)}`,
  );
  check(
    phase,
    "HOST Tempe: primary CTA is listing a pool, no renter CTA",
    /<a[^>]*href="\/wizard\/"[^>]*data-primary-cta="host"/.test(hostT.body) && !has(hostT, 'data-primary-cta="renter"'),
  );
  check(
    phase,
    `HOST Tempe: host-framed inventory with the true count (${tempeHits.length}; the pool stored twice counts once)`,
    has(hostT, 'data-inventory="host"') &&
      decode(elementWith(hostT.body, 'data-inventory="host"')).includes(
        `${tempeHits.length} pools already listed in Tempe`,
      ) &&
      (hostT.body.match(new RegExp(`href="/l/${tempeHits[0].slug}/`, "g")) ?? []).length === 1,
  );
  check(phase, "HOST Tempe: no empty-inventory notice", noEmptyNotice(hostT));
  check(phase, `HOST Tempe: inventory carries the mirror date (${AS_OF})`, hasText(hostT, `Listing data as of ${AS_OF}.`));
  const hostNums = numbersOk(hostT, new Set([tempeHits.length, ...LISTING_NUMBERS]));
  check(phase, "HOST Tempe: every number in the inventory section is a fixture fact", hostNums.ok, hostNums.detail);
  const ledeNums = numbersOk(hostT, new Set([0, 100]), ["data-host-lede"]);
  check(phase, "HOST Tempe: the hero lede states only the fee facts (0%, 100%)", ledeNums.ok, ledeNums.detail);
  check(
    phase,
    "HOST Tempe: no earnings projection, no pool-pros?city= variant",
    !hasText(hostT, "host earns") && !has(hostT, "/p/pool-pros?city=") && has(hostT, 'href="/p/pool-pros"'),
  );

  // ── HOST with only nearby pools ──────────────────────────────────────────
  const hostM = pages["become-a-swimming-pool-host-mesa-az"];
  common("HOST Mesa", hostM);
  check(
    phase,
    "HOST Mesa: stored control-arm title kept (no figure in it)",
    titleOf(hostM.body) === "Mesa, AZ: Make Money Renting Your Pool | Host Guide",
    titleOf(hostM.body),
  );
  check(
    phase,
    `HOST Mesa: "Pools already listed near Mesa" with ${mesaMiles.length} pools, no "none in Mesa" clause`,
    hasText(hostM, "Pools already listed near Mesa") &&
      hasText(hostM, `${mesaMiles.length} pools are listed within ${NEARBY_RADIUS_MI} miles of Mesa`) &&
      noEmptyNotice(hostM),
  );

  // ── HOST without pools ───────────────────────────────────────────────────
  const hostD = pages["become-a-swimming-pool-host-dayton-oh"];
  common("HOST Dayton", hostD);
  expectOne(
    phase,
    "HOST Dayton: one H1 with the state",
    h1sOf(hostD.body),
    "Rent out your pool in Dayton, OH by the hour. 0% host fees. Keep 100%.",
  );
  check(
    phase,
    "HOST Dayton: no inventory section and no empty-inventory notice",
    !has(hostD, "data-inventory=") && noEmptyNotice(hostD) && !has(hostD, 'id="pools-available"'),
  );
  check(phase, "HOST Dayton: primary CTA is listing a pool", has(hostD, 'data-primary-cta="host"'));
  check(
    phase,
    "HOST Dayton: stored title kept as the control arm, stored description kept as hero + meta",
    titleOf(hostD.body) === "Fixture host page Dayton | Pool Rental Near Me" &&
      decode(elementWith(hostD.body, "data-host-lede")) === "Fixture description." &&
      metaDescriptionOf(hostD.body) === "Fixture description.",
    titleOf(hostD.body),
  );

  // ── RENTER with exact-city pools ─────────────────────────────────────────
  const rT = pages["tempe-az"];
  common("RENTER Tempe", rT);
  expectOne(phase, "RENTER Tempe: one renter H1", h1sOf(rT.body), "Private pool rentals in Tempe, AZ");
  check(
    phase,
    "RENTER Tempe: renter <title>",
    titleOf(rT.body) === "Private Pool Rentals in Tempe, AZ | Pool Rental Near Me",
    titleOf(rT.body),
  );
  check(
    phase,
    "RENTER Tempe: title and H1 differ from the HOST page for the same city",
    titleOf(rT.body) !== titleOf(hostT.body) && h1sOf(rT.body)[0] !== h1sOf(hostT.body)[0],
  );
  check(
    phase,
    `RENTER Tempe: intro and meta description state the real count (${tempeHits.length}, duplicate counted once)`,
    decode(elementWith(rT.body, "data-renter-intro")).startsWith(
      `${tempeHits.length} private pools are listed in Tempe, AZ`,
    ) && metaDescriptionOf(rT.body).startsWith(`${tempeHits.length} private pools are listed in Tempe, AZ`),
    metaDescriptionOf(rT.body),
  );
  check(
    phase,
    "RENTER Tempe: stored description with 'reviews' is not the meta description",
    !metaDescriptionOf(rT.body).includes("reviews"),
  );
  check(
    phase,
    "RENTER Tempe: primary CTA searches the map around Tempe (address + bounds)",
    primaryRenterHref(rT.body) === boundedSearchHref("Tempe, AZ", cityRow("tempe")),
    primaryRenterHref(rT.body),
  );
  const invAt = rT.body.indexOf('data-inventory="renter"');
  const hostAt = rT.body.indexOf('id="own-a-pool"');
  const bodyAt = rT.body.indexOf("Fixture host body Tempe");
  check(
    phase,
    "RENTER Tempe: inventory first, then the labelled host section, then the stored body",
    invAt > -1 && hostAt > invAt && bodyAt > hostAt && hasText(rT, "Own a pool in Tempe?") && has(rT, "data-host-cta"),
    `inventory@${invAt} host@${hostAt} body@${bodyAt}`,
  );
  check(
    phase,
    "RENTER Tempe: every listing card shown once, no empty notice",
    tempeHits.every((l) => (rT.body.match(new RegExp(`href="/l/${l.slug}/`, "g")) ?? []).length === 1) &&
      noEmptyNotice(rT),
  );
  check(
    phase,
    "RENTER Tempe: the body's +-spelled search link for Tempe renders as the bounded search",
    // (the raw markdown also travels in the dehydrated loader data; only hrefs count)
    !/href="[^"]*Tempe%2C\+AZ/.test(rT.body) &&
      searchHrefsOf(rT.body).filter((h) => h === boundedSearchHref("Tempe, AZ", cityRow("tempe"))).length >= 3,
    searchHrefsOf(rT.body).join(" "),
  );
  const rTNums = numbersOk(rT, new Set([tempeHits.length, ...LISTING_NUMBERS]));
  check(phase, "RENTER Tempe: every number in intro + inventory is a fixture fact", rTNums.ok, rTNums.detail);
  check(
    phase,
    "RENTER Tempe: no host-acquisition JSON-LD, no host lead popup",
    !has(rT, '"audienceType":"Pool Owners"') && !has(rT, '"@type":"HowTo"'),
  );
  check(
    phase,
    "RENTER Tempe: no rolling 'Last updated', mirror date on the inventory instead",
    !hasText(rT, "Last updated") && hasText(rT, `Listing data as of ${AS_OF}.`),
  );
  check(
    phase,
    "RENTER Tempe: no market-tier claim, no 'pre-tuned to local pricing', no host take-home table",
    !hasText(rT, "top-tier") &&
      !hasText(rT, "first-mover") &&
      !hasText(rT, "growing pool rental demand") &&
      !hasText(rT, "pre-tuned to local pricing") &&
      !hasText(rT, "You take home on $200"),
  );
  check(
    phase,
    "RENTER Tempe: the liability-coverage sentence is unchanged",
    hasText(rT, "We give you more of every booking, real liability coverage, and payouts before your skimmer's even dry."),
  );

  // ── RENTER with only nearby pools ────────────────────────────────────────
  const rM = pages["mesa-az"];
  common("RENTER Mesa", rM);
  expectOne(phase, "RENTER Mesa: one renter H1", h1sOf(rM.body), "Private pool rentals in Mesa, AZ");
  const nearest = Math.round(mesaMiles[0]);
  const mesaIntro = decode(elementWith(rM.body, "data-renter-intro"));
  check(
    phase,
    `RENTER Mesa: ${mesaMiles.length} within ${NEARBY_RADIUS_MI} miles, nearest ${nearest} miles from the "mesa" centre (not the off-centre "mesa-az" row), no claim that Mesa has none`,
    mesaIntro ===
      `${mesaMiles.length} private pools are listed within ${NEARBY_RADIUS_MI} miles of Mesa, AZ on Pool Rental Near Me. The nearest is ${nearest} miles from Mesa.`,
    mesaIntro,
  );
  check(
    phase,
    "RENTER Mesa: each nearby card carries its real distance",
    mesaMiles.every((mi) => hasText(rM, `About ${Math.round(mi)} miles from Mesa`)),
  );
  check(phase, "RENTER Mesa: 'Pools near Mesa', no empty notice", hasText(rM, "Pools near Mesa") && noEmptyNotice(rM));
  const rMNums = numbersOk(
    rM,
    new Set([mesaMiles.length, NEARBY_RADIUS_MI, ...mesaMiles.map((m) => Math.round(m)), ...LISTING_NUMBERS]),
  );
  check(phase, "RENTER Mesa: every number in intro + inventory is a fixture fact", rMNums.ok, rMNums.detail);
  check(
    phase,
    "RENTER Mesa: primary CTA searches the map around the \"mesa\" centre (address + bounds)",
    primaryRenterHref(rM.body) === boundedSearchHref("Mesa, AZ", cityRow("mesa")),
    primaryRenterHref(rM.body),
  );

  // ── RENTER with no coordinates: nearby not checked ───────────────────────
  const rV = pages["chevy-chase-md"];
  common("RENTER Chevy Chase", rV);
  const vIntro = decode(elementWith(rV.body, "data-renter-intro"));
  check(
    phase,
    "RENTER Chevy Chase (no centroid): says only that none has it as their city; browse all, no promise of a map near it",
    vIntro === "No pools are listed with Chevy Chase, MD as their city on Pool Rental Near Me yet." &&
      primaryRenterHref(rV.body) === "/s" &&
      hasText(rV, "Browse all pools") &&
      !hasText(rV, "Search the map") &&
      !hasText(rV, "Search pools near Chevy Chase") &&
      has(rV, "data-nearby-unchecked") &&
      !has(rV, "data-empty-inventory") &&
      !hasText(rV, "There are no pools listed in"),
    vIntro,
  );
  const rVNums = numbersOk(rV, new Set());
  check(phase, "RENTER Chevy Chase: no number in intro + inventory", rVNums.ok, rVNums.detail);

  // ── RENTER with none in or near ──────────────────────────────────────────
  const rC = pages["chapel-hill"];
  common("RENTER Chapel Hill", rC);
  expectOne(phase, "RENTER Chapel Hill (bare slug): H1 carries the title's state", h1sOf(rC.body), "Private pool rentals in Chapel Hill, NC");
  check(
    phase,
    "RENTER Chapel Hill: plain no-pools statement + browse-all link, no 'still adding'",
    hasText(rC, "There are no pools listed in Chapel Hill yet.") &&
      !hasText(rC, "still adding pools") &&
      /<a[^>]*href="\/s"[^>]*data-primary-cta="renter"/.test(rC.body),
  );
  const rCNums = numbersOk(rC, new Set());
  check(phase, "RENTER Chapel Hill: no number in intro + inventory", rCNums.ok, rCNums.detail);
  check(
    phase,
    "RENTER Chapel Hill: meta description says no pools are listed yet",
    metaDescriptionOf(rC.body).startsWith("No pools are listed in Chapel Hill, NC yet."),
    metaDescriptionOf(rC.body),
  );
  // ── every renter search link: bounded when the city has coordinates ──────
  // Fixture centre per renter page (p.$slug.tsx: the bare same-state cities row
  // with coordinates, else the resolved row): tempe-az -> "tempe", mesa-az ->
  // "mesa", chapel-hill -> "chapel-hill", chevy-chase-md -> none.
  for (const [slug, label, centre, hasPools] of [
    ["tempe-az", "Tempe, AZ", cityRow("tempe"), true],
    ["mesa-az", "Mesa, AZ", cityRow("mesa"), true],
    ["chapel-hill", "Chapel Hill, NC", cityRow("chapel-hill"), false],
    ["chevy-chase-md", "Chevy Chase, MD", null, false],
  ]) {
    const hrefs = searchHrefsOf(pages[slug].body);
    const bounded = centre ? boundedSearchHref(label, centre) : null;
    const stray = hrefs.filter((h) => h !== "/s" && h !== bounded);
    check(
      phase,
      centre
        ? `RENTER ${slug}: every /s link is the bounded search around its centre or the bare /s; none is address-only`
        : `RENTER ${slug} (no coordinates): every /s link is the bare /s`,
      hrefs.length > 0 && stray.length === 0,
      stray.join(" ") || `${hrefs.length} links`,
    );
    check(
      phase,
      `RENTER ${slug}: the primary CTA is ${hasPools ? "the bounded search" : "the bare /s (browse all)"}`,
      primaryRenterHref(pages[slug].body) === (hasPools ? bounded : "/s"),
      primaryRenterHref(pages[slug].body),
    );
    if (hasPools)
      check(
        phase,
        `RENTER ${slug}: hero, sticky mobile and body search links all carry bounds`,
        hrefs.filter((h) => h === bounded).length >= 2,
        hrefs.join(" "),
      );
  }
  check(
    phase,
    "No two intent fixture pages share an H1 or a <title>",
    new Set(Object.values(pages).map((r) => h1sOf(r.body)[0])).size === Object.keys(pages).length &&
      new Set(Object.values(pages).map((r) => titleOf(r.body))).size === Object.keys(pages).length,
  );
}

/**
 * Hand-offs from EAST pages to the marketplace (WEST): city search links on the
 * comparison pages, state-level search links, host CTAs and the WebSite
 * SearchAction. WEST's SearchPage searches by `bounds` only (an address-only
 * /s?address= shows every pool unordered and switches off its
 * nearest-to-visitor default), honours `keywords` for full-text search and
 * ignores `q`; /l/draft/0000…/new/details is a 302 to /wizard/.
 */
async function handoffChecks(phase) {
  stub.setMode("healthy");
  // ── comparison city pages: bounded around the cities row, else bare /s ────
  for (const [path, centre, label] of [
    [PAGES.comparison, cityRow("akron"), "Akron, OH"],
    [PAGES.comparison2, cityRow("akron"), "Akron, OH"],
    ["/p/peerspace-vs-pool-rental-near-me-in-youngstown", null, "Youngstown, OH"],
    ["/p/giggster-vs-pool-rental-near-me-in-youngstown", null, "Youngstown, OH"],
  ]) {
    const r = await get(path);
    check(phase, `${path} -> 200`, r.status === 200, describe(r));
    const hrefs = searchHrefsOf(r.body);
    if (centre) {
      const bounded = boundedSearchHref(label, centre);
      check(
        phase,
        `${path}: the city search link is the bounded search around the cities row (${label}); no other /s link but the bare /s`,
        hrefs.includes(bounded) && hrefs.every((h) => h === "/s" || h === bounded),
        hrefs.join(" ") || "no /s link",
      );
    } else {
      check(
        phase,
        `${path} (cities row without coordinates): every /s link is the bare /s, none address-only`,
        hrefs.length > 0 && hrefs.every((h) => h === "/s"),
        hrefs.join(" ") || "no /s link",
      );
      check(
        phase,
        `${path} (no coordinates): the link does not promise a ${label} search`,
        !decode(r.body).includes(`${label.split(",")[0]} pool search`) &&
          !decode(r.body).includes(`See live ${label.split(",")[0]} pool-rental demand`) &&
          decode(r.body).includes("Browse all pools"),
      );
    }
  }
  // ── state-level pages: no single centre, so the bare /s, never address-only
  const stateHub = await get(PAGES.stateHub);
  const advocacy = await get("/p/host-advocacy-ohio");
  check(phase, "/p/host-advocacy-ohio -> 200", advocacy.status === 200, describe(advocacy));
  for (const [label, r] of [
    [PAGES.stateHub, stateHub],
    ["/p/host-advocacy-ohio", advocacy],
  ]) {
    const hrefs = searchHrefsOf(r.body);
    check(
      phase,
      `${label}: every /s link is the bare /s (no address-only /s?address=<State>)`,
      hrefs.length > 0 && hrefs.every((h) => h === "/s"),
      hrefs.join(" ") || "no /s link",
    );
  }
  // ── host CTAs: /wizard/ directly on every rendered fixture page ──────────
  const templatePages = ["/p/host-advocacy-ohio", "/p/fixture-pool-maintenance", "/p/fixture-generic-hero"];
  const rendered = [
    ...Object.values(PAGES),
    ...templatePages,
    "/p/peerspace-vs-pool-rental-near-me-in-youngstown",
    "/p/giggster-vs-pool-rental-near-me-in-youngstown",
    ...[
      "become-a-swimming-pool-host-tempe-az",
      "become-a-swimming-pool-host-mesa-az",
      "become-a-swimming-pool-host-dayton-oh",
      "tempe-az",
      "mesa-az",
      "chevy-chase-md",
      "chapel-hill",
    ].map((slug) => `/p/${slug}`),
  ];
  const drafts = [];
  for (const path of rendered) {
    const r = path === PAGES.stateHub ? stateHub : path === "/p/host-advocacy-ohio" ? advocacy : await get(path);
    if (r.status !== 200) drafts.push(`${path} (${r.status})`);
    else if (r.body.includes("/l/draft/")) drafts.push(path);
    if (templatePages.includes(path) || path === PAGES.stateHub)
      check(
        phase,
        `${path}: renders its host CTA as href="/wizard/"`,
        r.status === 200 && r.body.includes('href="/wizard/"'),
        describe(r),
      );
  }
  check(
    phase,
    `no rendered fixture page (${rendered.length}) links the 302 /l/draft/ URL`,
    drafts.length === 0,
    drafts.join(" "),
  );
  // ── WebSite SearchAction: the parameter WEST's search honours ────────────
  const live = await get(PAGES.live);
  const websites = [...live.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return null;
      }
    })
    .filter((o) => o && o["@type"] === "WebSite");
  const templates = websites.map((w) => w.potentialAction?.target?.urlTemplate ?? "");
  check(
    phase,
    "WebSite SearchAction targets /s?keywords={search_term_string} (not the ignored ?q=)",
    templates.length === 1 && /\/s\?keywords=\{search_term_string\}$/.test(templates[0]),
    templates.join(" ") || "no WebSite JSON-LD",
  );
}

let crashed = null;
try {
  await failurePhase("hang", { cold: true });
  await healthyPhase("healthy");
  await intentChecks("intent (healthy)");
  await handoffChecks("hand-offs (healthy)");
  await failurePhase("http-500");
  await failurePhase("connection-reset");
  await failurePhase("hang");

  // connection-reset once more with a timeout long enough for supabase-js to
  // exhaust its own retries (1 s + 2 s + 4 s), so the 503 comes from the
  // returned-error path rather than from our timeout.
  stub.setMode("connection-reset");
  process.env.SUPABASE_READ_TIMEOUT_MS = "20000";
  const started = Date.now();
  const res = await Promise.race([
    server.fetch(new Request(`http://localhost${PAGES.live}`)),
    sleep(15000).then(() => new Response("", { status: 599 })),
  ]);
  await res.text();
  const ms = Date.now() - started;
  process.env.SUPABASE_READ_TIMEOUT_MS = String(READ_TIMEOUT_MS);
  check(
    "connection-reset (retries exhausted)",
    `${PAGES.live} -> 503 from the returned error, before the 20 s timeout`,
    res.status === 503 && /no-store/.test(res.headers.get("cache-control") || "") && ms < 15000,
    `${res.status} in ${ms} ms`,
  );

  await healthyPhase("recovery");
} catch (err) {
  crashed = err;
} finally {
  await stub.close();
}

// ───────────────────────────── report ───────────────────────────────────────

if (quiet) Object.assign(console, realConsole);
let lastPhase = "";
for (const r of results) {
  if (r.phase !== lastPhase) {
    say(`\n[${r.phase}]`);
    lastPhase = r.phase;
  }
  say(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `   <-- ${r.detail}`}`);
}
const failed = results.filter((r) => !r.ok);
say(
  `\ntest:failed-reads — ${results.length - failed.length} passed, ${failed.length} failed, ${stub.requests.length} stub request(s) recorded (${DIST})`,
);
if (crashed) say(`\nHARNESS ERROR: ${crashed?.stack || crashed}`);
// The app keeps timers and sockets alive; exit explicitly.
process.exit(failed.length === 0 && !crashed ? 0 : 1);
