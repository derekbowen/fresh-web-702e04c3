# F5 code hand-off: hard-coded old links in `src/**`

Nothing in `src/**` was edited. This file lists every hard-coded occurrence of an old link target from
`link-mapping.csv`, found by grepping the worktree (`seo/02-content-repairs`, production commit `7702845`) with the
same exact-boundary rule as the database counts: the path must be followed by a quote, `)`, whitespace, `#`, `?`, a
backtick or end of line, so `/p/foo` never matches `/p/foo-bar`. `src/routeTree.gen.ts` and `*.bak*` files are
excluded.

**kind**: `link` = an href, `to` or path used to build a link. `AI prompt text` = a string fed to the page generator,
so every new page copies the old URL. `route definition`, `comment`, `example text`, `not a link` = no change needed
for F5; listed so nobody has to find them again.

## `/p/free-host-tools` -> `/p/pool-host-tools`

Mapping action: **REWRITE**. Live chain: `301 /p/free-host-tools > 200 /p/pool-host-tools`. Linked from 2323 audited pages.

Production answers `/p/free-host-tools` with a 301 to `/p/pool-host-tools` even though `src/routes/p.free-host-tools.tsx` still defines a page at that path, so the redirect sits in front of this app. Whether to delete the route file is a developer decision outside F5. `src/server/internal-links.functions.ts:19-20` are auto-link rules: every page body that contains the phrase "host tools" gets a link to the old path at render time. The database also holds it as a literal (569 rows in `content_pages.content`, 507 in `content_pages.body_markdown`, 1 in `blog_posts.content`, 1 in `content_pages.related_slugs`), so the body rewrite and this code change are both needed; the auto-link rule is why the audit saw 2,323 linking pages. `src/routes/api/public/link-health.ts:32` is a crawl seed list; point it at the new path too.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/components/related-pages.tsx:11` | link | `{ to: "/p/free-host-tools", label: "Free pool host tools", description: "Calculators, checklists, and templ...` | `/p/pool-host-tools` |
| `src/components/templates/advocacy.tsx:429` | link | `{ to: "/p/free-host-tools", label: "Free host tools", description: "Calculators, checklists, and templates"...` | `/p/pool-host-tools` |
| `src/components/templates/tool-placeholder.tsx:246` | link | `href="/p/free-host-tools"` | `/p/pool-host-tools` |
| `src/components/templates/pool-maintenance.tsx:309` | link | `{ to: "/p/free-host-tools", label: "Free host tools", description: "Calculators, checklists, and templates"...` | `/p/pool-host-tools` |
| `src/server/internal-links.functions.ts:19` | link | `{ phrase: "free host tools", to: "/p/free-host-tools", priority: 9, title: "Free pool host tools" },` | `/p/pool-host-tools` |
| `src/server/internal-links.functions.ts:20` | link | `{ phrase: "host tools", to: "/p/free-host-tools", priority: 8, title: "Free pool host tools" },` | `/p/pool-host-tools` |
| `src/server/all-locations.functions.ts:111` | link | `{ href: "/p/free-host-tools", label: "Free Host Tools" },` | `/p/pool-host-tools` |
| `src/routes/p.host-marketing-playbook.tsx:107` | link | `secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.host-marketing-playbook.tsx:112` | link | `{ name: "Host Tools", path: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.ai-listing-generator.tsx:107` | link | `secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.ai-listing-generator.tsx:112` | link | `{ name: "Host Tools", path: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.hosting.tsx:622` | link | `{ href: "/p/free-host-tools", title: "All free host tools", body: "Pricing, calendar, screening, payouts, t...` | `/p/pool-host-tools` |
| `src/routes/p.pool-heating-cost-calculator.tsx:110` | link | `secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.pool-heating-cost-calculator.tsx:115` | link | `{ name: "Host Tools", path: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.earnings-calculator.tsx:322` | link | `to="/p/free-host-tools"` | `/p/pool-host-tools` |
| `src/routes/p.start-hosting.tsx:122` | link | `{ name: "Host Tools", path: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.pool-wifi-guide.tsx:146` | link | `secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.pool-wifi-guide.tsx:151` | link | `{ name: "Host Tools", path: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.waiver-generator.tsx:106` | link | `secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.waiver-generator.tsx:111` | link | `{ name: "Host Tools", path: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.pool-rules-generator.tsx:107` | link | `secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.pool-rules-generator.tsx:112` | link | `{ name: "Host Tools", path: "/p/free-host-tools" },` | `/p/pool-host-tools` |
| `src/routes/p.free-host-tools.tsx:11` | route definition | `const PATH = "/p/free-host-tools";` | no change |
| `src/routes/p.free-host-tools.tsx:52` | route definition | `export const Route = createFileRoute("/p/free-host-tools")({` | no change |
| `src/routes/api/public/link-health.ts:32` | link | `"/p/free-host-tools",` | `/p/pool-host-tools` |

## `/p/terms-of-service` -> `/terms-of-service`

Mapping action: **REWRITE**. Live chain: `301 /p/terms-of-service > 200 /terms-of-service`. Linked from 1091 audited pages.

Legal page, mapped to the live legal URL. `src/lib/legacy-redirects.ts:42` is a redirect-map target; pointing it at `/terms-of-service` turns a two-hop chain into one hop. No database row links this path. All 1,091 linking pages get it from these templates.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/components/comparison-page.tsx:165` | link | `<a href="/p/terms-of-service">` | `/terms-of-service` |
| `src/lib/legacy-redirects.ts:42` | link | `"/legal-and-compliance/terms-of-service-pool-rental-near-me": "/p/terms-of-service",` | `/terms-of-service` |
| `src/routes/p.giggster-vs-pool-rental-near-me.tsx:680` | link | `<a href="/p/terms-of-service">` | `/terms-of-service` |
| `src/routes/p.peerspace-vs-pool-rental-near-me.tsx:359` | link | `<a href="/p/terms-of-service">Terms of Service</a>.` | `/terms-of-service` |
| `src/routes/p.swimply-alternative-vs-pool-rental-near-me.tsx:393` | link | `<a href="/p/terms-of-service">` | `/terms-of-service` |
| `src/routes/p.giggster-vs-pool-rental-near-me-in-{$city}.tsx:562` | link | `<a href="/p/terms-of-service">` | `/terms-of-service` |

## `/l/draft/00000000-0000-0000-0000-000000000000/new/details` -> `/wizard/`

Mapping action: **REWRITE**. Live chain: `302 /l/draft/00000000-0000-0000-0000-000000000000/new/details > 200 /wizard/`. Linked from 4182 audited pages.

`scripts/approved-redirects.json` lists this 302 as the published listing CTA, so it is allowed today. The homepage already links `/wizard/` directly. Rewriting removes a hop on 4,182 pages. The five `AI prompt text` lines matter most: until they change, every newly generated page body will carry the old URL again. `/wizard/` is a WEST app page with no canonical tag. It is a functional CTA, not an SEO destination.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/components/templates/generic-page.tsx:75` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/components/templates/host-acq-city.tsx:245` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/components/templates/host-acq-city.tsx:670` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/components/templates/host-acq-city.tsx:698` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/components/templates/advocacy.tsx:103` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/components/templates/advocacy.tsx:358` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/components/templates/pool-maintenance.tsx:383` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/components/templates/pool-maintenance.tsx:408` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/server/admin-quick-page.functions.ts:46` | AI prompt text (new pages will copy it) | `List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details` | `/wizard/` |
| `src/server/backfill-content-pages.server.ts:120` | AI prompt text (new pages will copy it) | `List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details` | `/wizard/` |
| `src/server/backfill-content-pages.server.ts:141` | AI prompt text (new pages will copy it) | `End with a one-sentence CTA linking to /l/draft/00000000-0000-0000-0000-000000000000/new/details ("List you...` | `/wizard/` |
| `src/server/admin-tools.functions.ts:265` | AI prompt text (new pages will copy it) | `List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details` | `/wizard/` |
| `src/server/admin-tools.functions.ts:800` | AI prompt text (new pages will copy it) | `- List Your Pool CTA URL: /l/draft/00000000-0000-0000-0000-000000000000/new/details` | `/wizard/` |
| `src/routes/p.pool-party-rentals.tsx:10` | link | `const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";` | `/wizard/` |
| `src/routes/p.pool-rentals-{$state}.tsx:122` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/routes/p.pool-rentals-{$state}.tsx:199` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/routes/p.hosting.tsx:46` | link | `const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";` | `/wizard/` |
| `src/routes/p.author.derek-bowen.tsx:312` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/routes/p.blog.tsx:414` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/routes/p.pool-rental-app.tsx:10` | link | `const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";` | `/wizard/` |
| `src/routes/p.pool-rentals.tsx:93` | link | `href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/routes/p.start-hosting.tsx:115` | link | `href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",` | `/wizard/` |
| `src/routes/p.pool-pros.$slug.tsx:239` | link | `<a href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"` | `/wizard/` |
| `src/routes/p.private-pool-rental.tsx:10` | link | `const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";` | `/wizard/` |

## `https://poolrentalnearme.com/` -> `https://www.poolrentalnearme.com`

Mapping action: **REWRITE**. Live chain: `301 https://poolrentalnearme.com/ > 200 /`. Linked from 14 audited pages.

Non-www base URL. These have to be absolute (booking links, JSON-LD `url`, an email template), so the replacement is the www origin, not a relative path. `pool-waitlist-confirmation.tsx` is an email template. Changing the constant sends nothing, but it changes links in future emails, so it goes through the normal email-template review.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/components/availability-calendar.tsx:10` | example text (admin/sample) | `bookingBaseUrl?: string; // e.g. "https://poolrentalnearme.com"` | no change |
| `src/components/availability-calendar.tsx:55` | link | `const baseUrl = String(props.bookingBaseUrl ?? "https://poolrentalnearme.com").replace(/\/$/, "");` | `https://www.poolrentalnearme.com` |
| `src/components/availability-calendar.tsx:81` | link | `bookingBaseUrl = "https://poolrentalnearme.com",` | `https://www.poolrentalnearme.com` |
| `src/components/availability-calendar.tsx:184` | link | `const base = String(bookingBaseUrl ?? "https://poolrentalnearme.com").replace(/\/$/, "");` | `https://www.poolrentalnearme.com` |
| `src/lib/email-templates/pool-waitlist-confirmation.tsx:16` | link | `const SITE_URL = 'https://poolrentalnearme.com'` | `https://www.poolrentalnearme.com` |
| `src/routes/p.la-saltwater-featured.tsx:256` | link | `bookingBaseUrl="https://poolrentalnearme.com"` | `https://www.poolrentalnearme.com` |
| `src/routes/p.about-our-company.tsx:22` | link | `url: "https://poolrentalnearme.com",` | `https://www.poolrentalnearme.com` |
| `src/routes/p.about-our-company.tsx:27` | link | `url: "https://poolrentalnearme.com",` | `https://www.poolrentalnearme.com` |

## `/p/aprende-a-rentar-tu-piscina` -> `/p/aprende-a-rentar-tu-alberca`

Mapping action: **REWRITE**. Live chain: `301 /p/aprende-a-rentar-tu-piscina > 200 /p/aprende-a-rentar-tu-alberca`. Linked from 1 audited pages.

`src/lib/course-urls.ts:14` is the Spanish academy hub path used for links. The same slug is also a database lookup key (`ACADEMY_HUB_SLUGS.es`, `src/lib/course-urls.ts:19`) and is listed in `MARKETPLACE_P_SLUGS` (`src/lib/link-rewrite.ts:52`). Change those only after confirming which content_pages row is now the live hub; the old slug answers 301 to the alberca page.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/components/templates/academy-hub.tsx:13` | comment | `* /p/aprende-a-rentar-tu-piscina (es). Renders featured courses and a` | no change |
| `src/lib/course-urls.ts:14` | link | `export const SPANISH_ACADEMY_HUB_PATH = "/p/aprende-a-rentar-tu-piscina";` | `/p/aprende-a-rentar-tu-alberca` |

## `/host-tools` -> `/p/pool-host-tools`

Mapping action: **REWRITE**. Live chain: `404 /host-tools`. Linked from 18 audited pages.

Both occurrences are a comment and a prefix constant used to detect dead links. Neither is a link. No change.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/components/auto-linked-content.tsx:131` | comment | `// /help-center/, and /host-tools/ links has been removed. Those URL prefixes` | no change |
| `src/lib/host-tools-live.ts:79` | not a link (string check) | `export const DEAD_TOOL_PREFIX = "/host-tools/";` | no change |

## `/search` -> `/s`

Mapping action: **REWRITE**. Live chain: `404 /search`. Linked from 0 audited pages.

The only occurrence is a string check on Google URLs. No change.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/routes/api/public/hooks.seo-self-test.ts:73` | not a link (string check) | `if (u.includes("google.com") \|\| u.includes("/search?") \|\| u.includes("webcache.")) continue;` | no change |

## `/p/los-angeles-ca` -> `(NEEDS_DEREK in the CSV)`

Mapping action: **NEEDS_DEREK**. Live chain: `301 /p/los-angeles-ca > 200 /p/losangeles`. Linked from 0 audited pages.

All occurrences are admin placeholders or sample data. No change.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/lib/email-templates/daily-seo-digest.tsx:215` | example text (admin/sample) | `{ url_path: '/p/los-angeles-ca', score: 35, summary: 'Missing schema, thin content' },` | no change |
| `src/routes/admin.competitors.tsx:139` | example text (admin/sample) | `<label className="mt-3 block text-xs text-muted-foreground">Your page URL path (e.g. /p/los-angeles-ca)</la...` | no change |
| `src/routes/admin.competitors.tsx:142` | example text (admin/sample) | `placeholder="/p/los-angeles-ca"` | no change |
| `src/routes/admin.faq-generator.tsx:67` | example text (admin/sample) | `placeholder="/p/los-angeles-ca"` | no change |

## `/p/sign-a-waiver` -> `/p/waivers` (NEEDS_DEREK)

Live chain: `301 /p/sign-a-waiver > 200 /p/waivers`. The destination is right, but the label on this link item is "Liability waiver template". Under CLAUDE.md rule 8 I am not editing or proposing any text about liability. The proposal is an href-only change; the label stays exactly as it is. Derek to OK.

| file:line | kind | current code | replace with |
|---|---|---|---|
| `src/components/templates/advocacy.tsx:428` | link | `{ to: "/p/sign-a-waiver", label: "Liability waiver template", description: "What to require before any gues...` | `/p/waivers` (href only, after Derek's OK) |

## Link generators that emit old targets with no literal anywhere

227 rows of `link-mapping.csv` have no literal in the database bodies or in `src/**` (the `code_locations` column says so). They are produced at render time from data. These generators need a fix, or the links come back after the body rewrite:

| where | what it does | change |
|---|---|---|
| `src/server/all-locations.functions.ts:126-144` | lists every `content_pages` row with `in_sitemap=true` in the template groups, including rows whose `redirect_to` is set (for example `fort-mill-sc`, `frisco-tx`, `kings-mountain-nc`, `new-franklin-oh`, `thompson-s-station-tn`, `hoover`, `new-orleans`, `saginaw-tx`, `learning-academy`) | also require `redirect_to is null`; the rows' `in_sitemap` belongs to F4 |
| `src/server/nearby-cities.functions.ts:86-107` | checks candidate `/p/...` paths against `status='published'` only | also require `redirect_to is null`, or link the row's `redirect_to` target |
| `src/server/internal-links.functions.ts:58-73` and `:86-95` | builds `/p/become-a-swimming-pool-host-{slug}[-{st}]` from the `cities` table and from city-name phrases without checking that the page exists; rows such as `become-a-swimming-pool-host-chicago`, `-raleigh`, `-tampa` exist only as redirects | resolve against `content_pages` (published, `redirect_to is null`) before emitting |
| `src/server/top-cities.functions.ts:28-31` | same slug construction for the top-cities list | same as above |
| `content_pages.related_slugs` (data, not code) | `become-a-swimming-pool-host-new-ny` (10 rows), `become-a-swimming-pool-host-template-city-ca` (10), `poolrentalsignage` (7), `become-a-pool-host-highlands-ranch-co` (2), `englewood-co` (1), `huntington-beach-ca` (1), `free-host-tools` (1) point at missing, placeholder or redirecting rows | fix the arrays in the same F5 database pass, old values saved to the backup table first |
| WEST (not this repo) | old `/l/...` listing slugs (47, 14, 14 and 4 linking pages) and `/p/privatepoolrentalssandiego` (126 pages, all of them listing pages) come from WEST listing and public-pools pages | hand to the WEST owner; the mapping rows are in the CSV |

`scripts/bulk-fix-broken-links.mjs` (outside `src/`, not run) already holds an older rewrite list. Three of its entries disagree with this mapping: `/make_money_renting_out_your_pool` -> `/p/hosting` (this mapping: `/p/make-money-renting-out-your-pool`, the same subject at the same slug), `/host_help` -> `/p/faq` (this mapping: `/p/host-help`, the host help page), and `/help-center` -> `/p/faq` (this mapping: NEEDS_DEREK). Use one list, not both.
