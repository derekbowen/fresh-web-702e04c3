# F5 internal link mapping

Every internal link target that does not answer 200 directly, plus every non-www absolute link to our own site, mapped to
its final destination, with where each old link lives. Nothing in the database or in `src/**` was changed. These files
are the input for the F5 body rewrite and the code hand-off.

| file | what it is |
|---|---|
| `link-mapping.csv` | one row per old target: status, live redirect chain, destination, action, reason, audit link count, database rows by column, code locations |
| `code-handoff.md` | every hard-coded old link in `src/**` with file:line and its replacement (code not edited), plus the render-time link generators that emit old targets |

## Totals

| action | targets | audited linking pages (sum) | database rows (sum over targets, content + body_markdown + blog) |
|---|---:|---:|---:|
| REWRITE | 600 | 8,890 | 14,870 |
| UNLINK | 135 | 74 | 253 |
| NEEDS_DEREK | 434 | 687 | 3,726 |
| **all** | **1,169** | 9,651 | 18,849 |

By link form: 977 relative or www-absolute paths, 192 non-www absolute URLs (`https://poolrentalnearme.com/...`). No `http://` link to our own site was found. First-hop status: 301: 859, 302: 1, 404: 307, 410: 2.

Sources: 945 rows come from the audit crawl (`link_targets.tsv` + `stage2.jsonl`): they cover all 949 non-200 audit URLs, the 161 non-www ones included, after merging trailing-slash variants; 224 more rows were found only by scanning the database bodies for internal links whose live status is not 200. Rows that differ only by a trailing slash are merged (the `found_by` and `audit_linking_pages` columns add them up).

Actions:

- **REWRITE**: change the link to `destination` (a site-relative path). Every destination was fetched again for this file and answers 200 in one hop, is not noindex, and is self-canonical (`/wizard/`, the listing wizard behind the host CTA, has no canonical tag).
- **UNLINK**: the target is gone and no page on the site covers the same thing. Keep the anchor text, remove the link.
- **NEEDS_DEREK**: a judgement call. `destination` starts with `PROPOSED` and gives the alternative I would use, or says `PROPOSED unlink / none`. Nothing in these rows should be applied until Derek decides.

## How it was built

1. Targets: every non-200 URL in the audit crawl of linked non-sitemap targets, every non-www absolute link in the audit link table, and every internal link in `content_pages.content`, `content_pages.body_markdown` and `blog_posts.content` whose live status is not 200. Links to deliberately noindex pages that answer 200 (`/s?address=...`, `/p/pool-pros...`) are out of scope and not listed.
2. Chains: each target was followed live with GET (browser User-Agent, under 2 requests per second, no automatic redirects) until a non-redirect answer; every hop is in `redirect_chain`. Re-fetched for this version on 2026-11-15; 0 of 1312 chains end differently from the first run's fetch; 1 chain(s) changed length with the same end: https://www.poolrentalnearme.com/p/swim-instructor-pool-rental-bronx.
3. Decisions: the destination must be about the same thing as the old URL and its anchor text (anchor texts were read from the database where a body holds the link). A live redirect whose target is wrong for the link's intent (renter city link landing on a host-recruitment page, a Peerspace or Giggster comparison landing on the Swimply comparison, a missing city landing on a generic hub) is NEEDS_DEREK, never REWRITE. No missing page is mapped to the homepage or to a generic hub. Legal pages map to the live legal URL (`/p/terms-of-service` -> `/terms-of-service`).
4. Insurance: any target whose URL is about insurance, liability, coverage, claims or damage is NEEDS_DEREK, with a URL proposal only. So is any target whose every database occurrence sits in a sentence that mentions one of those words. `db_rows_in_insurance_sentences` counts the rows where at least one occurrence does; when such a row is rewritten, only the href changes and the sentence text stays as it is.
5. Database counts are read-only `SELECT`s. Links are extracted with `](...)` and `href=` (either quote, optionally backslash-escaped), absolute and relative forms, then normalised by dropping `#...`, `?...` and trailing slashes, so `/p/foo` never matches `/p/foo-bar`. Counts are distinct rows per column. Other text columns were checked and hold no internal links: `content_pages.description`, `seo_description`, `og_description`, `faq_items`, `title`, `blog_posts.excerpt`, `tldr_bullets`. `content_pages.related_slugs` (slug arrays used for related-page links) is counted in `db_related_slugs_rows`; `blog_posts.related_slugs` holds none of the old slugs. `content_pages.raw_html` is the Firecrawl scrape archive: it is not rendered (the app reads it only as a word-count fallback and in the admin migration view), so `db_raw_html_rows` is informational.
6. Code: `src/**` was grepped with the same boundary rule (`src/routeTree.gen.ts` and `*.bak*` excluded). When a target has no literal anywhere, `code_locations` says which render-time generator emits it.

## Checks run on this version

- Coverage: all 949 non-200 targets in the audit crawl and all 161 non-www/http targets in the audit link table are in the CSV (0 missing).
- Destinations: 348 distinct REWRITE destinations re-fetched (2026-11-15 20:37 UTC): 0 problems (200 in one hop, not noindex, self-canonical or no canonical tag, site-relative, not itself an old target, no homepage destination except for a homepage link). No canonical tag: `/wizard/`.
- NEEDS_DEREK proposals: 109 distinct proposed URLs re-fetched, 0 not a direct 200.
- Homepage as destination: only for `https://poolrentalnearme.com/` (homepage variants).
- Emit-time problems reported by the generator: 0.
- `link-mapping.csv`: 1169 data rows, 19 columns, every row the same width (19).
- No e-mail addresses (none found) and no key or token patterns (0 found) in the output files.

## Corrections to the interrupted first run

- Database counts were recomputed for all targets in one read-only pass. The first run had lost the counts for 16 targets (its hash list missed them), so their rows showed 0. The largest: `/p/free-host-tools` is literally in 569 `content_pages.content` rows, 507 `body_markdown` rows and 1 blog post (the first run said no database row held it); `https://poolrentalnearme.com/s` in 36 `body_markdown` rows; the `/s/nc/...` non-www search links, `/p/become-a-swimming-pool-host-new-ny`, `/p/pool-liability-insurance`, `/p/everything-you-need-to-know-about-pool-rental-insurance`, `/s/de/dover`, `/s/ny/salisbury-mills`, and the `/l/draft/...` CTA (1 blog post).
- `content_pages.related_slugs`: `free-host-tools` (1 row) added; the other six counts were re-verified.
- `content_pages.raw_html` (not rendered) counted as its own column; 13 old targets appear there once each.
- Insurance-sentence counts were recomputed for every target in the same pass (sentence = text between `.`/`!`/`?` + space or a newline).
- Every redirect chain and every destination was fetched again; the README was missing and is new.

## NEEDS_DEREK cases

434 targets, grouped by the reason. Each line: old target (audited linking pages / database rows) -> proposal.

### insurance/liability subject: not decided by me (rule 8); proposal is a URL only (51)

- `/insurance_guide_for_pool_owners` (10 / 2076) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/guides/pool-rental-insurance` (9 / 18) -> `/p/insurance-guide-for-pool-owners`
- `/blog/pool-rental-insurance-guide` (6 / 14) -> `/p/insurance-guide-for-pool-owners`
- `/guides/pool-rental-insurance-guide` (3 / 8) -> `/p/insurance-guide-for-pool-owners`
- `/guides/pool-rental-insurance-basics` (2 / 8) -> `/p/insurance-guide-for-pool-owners`
- `/guides/pool-rental-insurance` (3 / 6) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/guides/pool-rental-insurance-guide` (3 / 6) -> `/p/insurance-guide-for-pool-owners`
- `/blog/pool-rental-insurance` (1 / 5) -> `/p/insurance-guide-for-pool-owners`
- `/p/pool-liability-insurance` (2 / 3) -> `/p/insurance-guide-for-pool-owners`
- `/blog/pool-rental-insurance-basics` (1 / 3) -> `/p/insurance-guide-for-pool-owners`
- `/p/pool-rental-insurance` (1 / 3) -> `/p/insurance-guide-for-pool-owners`
- `/b/pool-rental-liability-insurance` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/blog/is-pool-rental-insurance-provided` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/blog/pool-rental-insurance-liability` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/blog/pool-rental-liability` (1 / 2) -> unlink / none
- `/blog/pool-rental-liability-insurance` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/blog/safety-and-insurance-what-pool-hosts-need-to-know` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/g/how-much-general-liability-insurance-does-a-pool-owner-need` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/g/pool-hosting-insurance-explained` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/guides/insurance-for-pool-hosting` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/guides/pool-rental-insurance-everything-you-need-to-know` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/guides/pool-rental-insurance-safety` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/p/everything-you-need-to-know-about-pool-rental-insurance` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/p/liability-insurance-for-pool-rental-hosts` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/p/pool-rental-insurance-everything-you-need-to-know` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/p/pool-rental-insurance-what-you-need-to-know` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/blog/pool-rental-insurance-what-you-need-to-know` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/do-i-need-extra-insurance-to-rent-my-pool` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/guides/insurance-explained` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/guides/pool-rental-insurance-everything-hosts-need-to-know` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/guides/pool-safety-and-liability` (1 / 2) -> unlink / none
- `https://poolrentalnearme.com/insurance-for-pool-rental` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/pool-rental-insurance-faq` (1 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/b/pool-insurance-guide` (0 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/guides/pool-hosting-insurance-safety` (0 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/host-tools/pool-insurance` (0 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/host-tools/pool-liability-waiver` (0 / 2) -> unlink / none
- `/p/pool-rental-insurance-guide` (0 / 2) -> `/p/insurance-guide-for-pool-owners`
- `https://poolrentalnearme.com/guides/pool-rental-liability-insurance-what-you-need-to-know` (0 / 2) -> `/p/insurance-guide-for-pool-owners`
- `/blog/is-my-pool-covered-by-insurance-if-i-rent-it-out` (0 / 1) -> `/p/insurance-guide-for-pool-owners`
- `/blog/liability-insurance-for-pool-hosts` (0 / 1) -> `/p/insurance-guide-for-pool-owners`
- `/p/course/alcohol-cannabis-liability-what-hosts-must-know` (1 / 0) -> `/p/elearning-academy-alcohol-cannabis-liability-what-hosts-must-know`
- `/p/course/alcohol-policy-liability-management` (1 / 0) -> `/p/elearning-academy-alcohol-policy-and-liability-management-for-pool-hosts`
- `/p/course/damage-control-navigating-insurance-claims-repairs` (1 / 0) -> `/p/elearning-academy-damage-control-navigating-insurance-claims-repairs`
- `/p/course/dealing-with-property-damage-documentation-claims-recovery` (1 / 0) -> `/p/elearning-academy-dealing-with-property-damage-documentation-claims-recovery`
- `/p/course/homeowners-insurance-gaps-why-your-policy-wont-cover-paid-rentals` (1 / 0) -> `/p/elearning-academy-homeowners-insurance-gaps-why-your-policy-wont-cover-paid-rentals`
- `/p/course/insurance-legal-essentials-for-pool-hosts` (1 / 0) -> `/p/insuranceandlegalessentialsforpoolhostscourse`
- `/p/course/liability-waivers-that-actually-protect-you` (1 / 0) -> `/p/elearning-academy-liability-waivers-that-protect-you-how-to-create-course`
- `/p/course/the-broken-glass-nightmare-remediation-liability` (1 / 0) -> `/p/elearning-academy-the-broken-glass-nightmare-remediation-liability`
- `/p/insurance` (0 / 1) -> `/p/insurance-guide-for-pool-owners`
- `/p/insurance_guide_for_pool_owners` (0 / 1) -> `/p/insurance-guide-for-pool-owners`

### redirects to generic hub /, which is not about the same thing; proposal: unlink (2)

- `/p/pool-rental-near-me` (0 / 781) -> unlink / none
- `/p/pool` (0 / 1) -> unlink / none

### renter-intent city link redirects to host-recruitment page /p/<page>; no guest page for this city; alternative is /s?address= search (noindex) or unlink (53)

- `/p/denver-co` (11 / 2) -> unlink / none
- `/p/fort-mill-sc` (11 / 0) -> unlink / none
- `/p/frisco-tx` (11 / 0) -> unlink / none
- `/p/kings-mountain-nc` (11 / 0) -> unlink / none
- `/p/new-franklin-oh` (11 / 0) -> unlink / none
- `/p/thompson-s-station-tn` (11 / 0) -> unlink / none
- `/p/englewood-co` (10 / 0) -> unlink / none
- `/p/huntington-beach-ca` (10 / 0) -> unlink / none
- `/p/saginaw-tx` (10 / 0) -> unlink / none
- `/p/san-antonio-tx` (3 / 7) -> unlink / none
- `/p/aurora-il` (4 / 4) -> unlink / none
- `/p/bellevue-wa` (1 / 3) -> unlink / none
- `/p/novi-mi` (2 / 2) -> unlink / none
- `/p/arlington-tx` (1 / 2) -> unlink / none
- `/p/carmel-in` (1 / 2) -> unlink / none
- `/p/cedar-hill-tx` (1 / 2) -> unlink / none
- `/p/collierville-tn` (1 / 2) -> unlink / none
- `/p/cranston-ri` (1 / 2) -> unlink / none
- `/p/desoto-tx` (1 / 2) -> unlink / none
- `/p/east-providence-ri` (1 / 2) -> unlink / none
- `/p/elkhart-in` (1 / 2) -> unlink / none
- `/p/ellicott-city-md` (1 / 2) -> unlink / none
- `/p/frederick-md` (1 / 2) -> unlink / none
- `/p/gaithersburg-md` (1 / 2) -> unlink / none
- `/p/gary-in` (1 / 2) -> unlink / none
- `/p/germantown-md` (1 / 2) -> unlink / none
- `/p/grand-prairie-tx` (1 / 2) -> unlink / none
- `/p/greenwood-in` (1 / 2) -> unlink / none
- `/p/hammond-in` (1 / 2) -> unlink / none
- `/p/issaquah-wa` (1 / 2) -> unlink / none
- `/p/jackson-tn` (1 / 2) -> unlink / none
- `/p/jeffersonville-in` (1 / 2) -> unlink / none
- `/p/lafayette-in` (1 / 2) -> unlink / none
- `/p/louisville-ky` (1 / 2) -> unlink / none
- `/p/manassas-va` (1 / 2) -> unlink / none
- `/p/mansfield-tx` (1 / 2) -> unlink / none
- `/p/memphis-tn` (1 / 2) -> unlink / none
- `/p/noblesville-in` (1 / 2) -> unlink / none
- `/p/pawtucket-ri` (1 / 2) -> unlink / none
- `/p/south-bend-in` (1 / 2) -> unlink / none
- `/p/springfield-oh` (1 / 2) -> unlink / none
- `/p/stillwater-mn` (1 / 2) -> unlink / none
- `/p/warwick-ri` (1 / 2) -> unlink / none
- `/p/woodbury-mn` (1 / 2) -> unlink / none
- `/p/woonsocket-ri` (1 / 2) -> unlink / none
- `/p/gastonia-nc` (0 / 2) -> unlink / none
- `/p/glendale-az` (1 / 1) -> unlink / none
- `/p/shelby-nc` (0 / 2) -> unlink / none
- `/p/bellingham-wa` (0 / 1) -> unlink / none
- `/p/las-vegas-nv` (0 / 1) -> unlink / none
- `/p/miami-fl` (0 / 1) -> unlink / none
- `/p/seattle-wa` (0 / 1) -> unlink / none
- `/p/spokane-wa` (0 / 1) -> unlink / none

### no guest page for <city>; only the host-recruitment page exists. Renter-intent link: alternative is /s?address= search (noindex) or unlink (49)

- `/ca/corona` (1 / 2) -> `/p/become-a-swimming-pool-host-corona-ca`
- `/ca/fontana` (1 / 2) -> `/p/become-a-swimming-pool-host-fontana-ca`
- `/ca/hemet` (1 / 2) -> `/p/become-a-swimming-pool-host-hemet-ca`
- `/ca/murrieta` (1 / 2) -> `/p/become-a-swimming-pool-host-murrieta-ca`
- `/ca/redlands` (1 / 2) -> `/p/become-a-swimming-pool-host-redlands-ca`
- `/ca/rialto` (1 / 2) -> `/p/become-a-swimming-pool-host-rialto-ca`
- `/ca/san-bernardino` (1 / 2) -> `/p/become-a-swimming-pool-host-san-bernardino-ca`
- `/ca/temecula` (1 / 2) -> `/p/become-a-swimming-pool-host-temecula-ca`
- `/p/il-arlington-heights` (1 / 2) -> `/p/become-a-swimming-pool-host-arlington-heights-il`
- `/p/il-bloomington` (1 / 2) -> `/p/become-a-swimming-pool-host-bloomington-il`
- `/p/il-bolingbrook` (1 / 2) -> `/p/become-a-swimming-pool-host-bolingbrook-il`
- `/p/il-champaign` (1 / 2) -> `/p/become-a-swimming-pool-host-champaign-il`
- `/p/il-cicero` (1 / 2) -> `/p/become-a-swimming-pool-host-cicero-il`
- `/p/il-decatur` (1 / 2) -> `/p/become-a-swimming-pool-host-decatur-il`
- `/p/il-des-plaines` (1 / 2) -> `/p/become-a-swimming-pool-host-des-plaines-il`
- `/p/il-elgin` (1 / 2) -> `/p/become-a-swimming-pool-host-elgin-il`
- `/p/il-evanston` (1 / 2) -> `/p/become-a-swimming-pool-host-evanston-il`
- `/p/il-palatine` (1 / 2) -> `/p/become-a-swimming-pool-host-palatine-il`
- `/p/il-peoria` (1 / 2) -> `/p/become-a-swimming-pool-host-peoria-il`
- `/p/il-rockford` (1 / 2) -> `/p/become-a-swimming-pool-host-rockford-il`
- `/p/il-schaumburg` (1 / 2) -> `/p/become-a-swimming-pool-host-schaumburg-il`
- `/p/il-skokie` (1 / 2) -> `/p/become-a-swimming-pool-host-skokie-il`
- `/p/il-springfield` (1 / 2) -> `/p/become-a-swimming-pool-host-springfield-il`
- `/p/il-waukegan` (1 / 2) -> `/p/become-a-swimming-pool-host-waukegan-il`
- `/sc/columbia` (1 / 2) -> `/p/become-a-swimming-pool-host-columbia-sc`
- `/sc/north-charleston` (1 / 2) -> `/p/become-a-swimming-pool-host-north-charleston-sc`
- `https://poolrentalnearme.com/s/nc/indian-trail` (1 / 2) -> `/p/become-a-swimming-pool-host-indian-trail-nc`
- `https://poolrentalnearme.com/s/nc/matthews` (1 / 2) -> `/p/become-a-swimming-pool-host-matthews-nc`
- `https://poolrentalnearme.com/s/nc/monroe` (1 / 2) -> `/p/become-a-swimming-pool-host-monroe-nc`
- `https://poolrentalnearme.com/s/nc/stallings` (1 / 2) -> `/p/become-a-swimming-pool-host-stallings-nc`
- `https://poolrentalnearme.com/s/nc/waxhaw` (1 / 2) -> `/p/become-a-swimming-pool-host-waxhaw-nc`
- `/c/rogers-arkansas` (0 / 2) -> `/p/become-a-swimming-pool-host-rogers-ar`
- `/p/al/birmingham` (0 / 1) -> `/p/become-a-swimming-pool-host-birmingham-al`
- `/p/bothell-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-bothell-wa`
- `/p/edmonds-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-edmonds-wa`
- `/p/everett-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-everett-wa`
- `/p/federal-way-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-federal-way-wa`
- `/p/kenmore-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-kenmore-wa`
- `/p/kent-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-kent-wa`
- `/p/kirkland-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-kirkland-wa`
- `/p/lynnwood-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-lynnwood-wa`
- `/p/marysville-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-marysville-wa`
- `/p/olympia-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-olympia-wa`
- `/p/redmond-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-redmond-wa`
- `/p/shoreline-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-shoreline-wa`
- `/p/tacoma-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-tacoma-wa`
- `/p/vancouver-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-vancouver-wa`
- `/p/west-palm-beach-fl` (0 / 1) -> `/p/become-a-swimming-pool-host-west-palm-beach-fl`
- `/p/yakima-wa` (0 / 1) -> `/p/become-a-swimming-pool-host-yakima-wa`

### several existing pages cover starting out (also /p/start-hosting and the academy course /p/elearning-academy-start-a-business-with-pool-rental-near-me-management); pick one (13)

- `/blog/how-to-start-a-pool-rental-business` (10 / 24) -> `/p/how-to-rent-out-your-pool`
- `https://poolrentalnearme.com/guides/start-pool-rental-business` (6 / 14) -> `/p/how-to-rent-out-your-pool`
- `https://poolrentalnearme.com/guides/how-to-start-a-pool-rental-business` (6 / 12) -> `/p/how-to-rent-out-your-pool`
- `/guides/starting-a-pool-rental-business` (0 / 7) -> `/p/how-to-rent-out-your-pool`
- `/p/how-to-start-a-pool-rental-business` (2 / 4) -> `/p/how-to-rent-out-your-pool`
- `/b/how-to-start-a-pool-rental-business` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/guides/how-to-start-a-pool-rental-business` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/guides/starting-a-pool-rental` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/p/pool-rental-business` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/p/pool-rental-business-guide` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `https://poolrentalnearme.com/guides/how-to-set-up-your-pool-for-hourly-renters` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `https://poolrentalnearme.com/how-to-start-a-pool-rental-business` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/blog/how-to-make-your-pool-a-rental-success` (0 / 1) -> `/p/how-to-rent-out-your-pool`

### income/earnings link; the closest page is about bookings, not income (29)

- `https://poolrentalnearme.com/guides/maximize-rental-income` (4 / 8) -> `/p/maximize-pool-bookings`
- `https://poolrentalnearme.com/guides/maximizing-pool-rental-income` (3 / 6) -> `/p/maximize-pool-bookings`
- `/blog/maximize-pool-rental-income` (2 / 4) -> `/p/maximize-pool-bookings`
- `/blog/maximize-rental-income` (2 / 4) -> `/p/maximize-pool-bookings`
- `/blog/maximizing-pool-rental-income` (2 / 4) -> `/p/maximize-pool-bookings`
- `/guides/maximize-rental-income` (2 / 4) -> `/p/maximize-pool-bookings`
- `/b/maximize-rental-profits` (1 / 2) -> `/p/maximize-pool-bookings`
- `/blog/increase-pool-rental-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `/blog/increase-rental-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `/blog/increase-your-pool-rental-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `/blog/maximize-your-pool-rental-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `/blog/maximizing-earnings` (1 / 2) -> `/p/maximize-pool-bookings`
- `/blog/maximizing-rental-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `/guides/host-income-tips` (1 / 2) -> `/p/maximize-pool-bookings`
- `/guides/income-optimization` (1 / 2) -> `/p/maximize-pool-bookings`
- `/guides/increase-rental-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `https://poolrentalnearme.com/blog/maximize-pool-rental-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `https://poolrentalnearme.com/guides/maximize-earnings` (1 / 2) -> `/p/maximize-pool-bookings`
- `https://poolrentalnearme.com/guides/maximize-pool-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `https://poolrentalnearme.com/guides/maximizing-host-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `https://poolrentalnearme.com/maximizing-pool-rental-income` (1 / 2) -> `/p/maximize-pool-bookings`
- `/blog/maximum-pool-earnings` (0 / 2) -> `/p/maximize-pool-bookings`
- `/guides/maximizing-pool-income` (0 / 2) -> `/p/maximize-pool-bookings`
- `https://poolrentalnearme.com/guides/maximize-rental-rate` (0 / 2) -> `/p/maximize-pool-bookings`
- `https://poolrentalnearme.com/maximizing-pool-rental-earnings` (0 / 2) -> `/p/maximize-pool-bookings`
- `/blog/increase-rental-revenue` (0 / 1) -> `/p/maximize-pool-bookings`
- `/blog/maximizing-your-pool-rental-income` (0 / 1) -> `/p/maximize-pool-bookings`
- `/guides/maximizing-rental-income` (0 / 1) -> `/p/maximize-pool-bookings`
- `/p/how-to-get-more-pool-bookings` (0 / 1) -> `/p/maximize-pool-bookings`

### Peerspace comparison link redirects to the Swimply comparison hub; the Peerspace comparison page exists (see also F6) (16)

- `/p/peerspace-vs-pool-rental-near-me-in-manchester` (7 / 7) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-san-anselmo-ca` (5 / 5) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-pomona` (4 / 4) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-riverside-il` (4 / 4) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-el-segundo-ca` (2 / 2) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-manhattan-beach-ca` (2 / 2) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-north-wantagh-ny` (2 / 2) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-st-louis` (2 / 2) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-falls-church-va` (1 / 1) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-gainesville` (1 / 1) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-greenville-ny` (1 / 1) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-hayward-ca` (1 / 1) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-mesquite` (1 / 1) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-minneapolis` (1 / 1) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-orland-park-il` (1 / 1) -> `/p/peerspace-vs-pool-rental-near-me`
- `/p/peerspace-vs-pool-rental-near-me-in-moraga-ca` (0 / 1) -> `/p/peerspace-vs-pool-rental-near-me`

### redirects to generic hub /p/pool-rentals, which is not about the same thing; proposal: unlink (18)

- `/blog/is-renting-out-your-pool-worth-it` (2 / 6) -> unlink / none
- `/guides/is-renting-out-your-pool-worth-it` (2 / 6) -> unlink / none
- `/p/bristow-va` (1 / 2) -> unlink / none
- `/p/bull-run-va` (1 / 2) -> unlink / none
- `/p/centreville-va` (1 / 2) -> unlink / none
- `/p/china-grove-tx` (1 / 2) -> unlink / none
- `/p/city-fort-myers-florida-fl` (1 / 2) -> unlink / none
- `/p/gainesville-va` (1 / 2) -> unlink / none
- `/p/how-monthly-pool-maintenance-costs-add-up` (1 / 2) -> unlink / none
- `/p/is-renting-out-your-pool-worth-it` (1 / 2) -> unlink / none
- `/p/pools-for-rent-in-discovery-bay-ca` (1 / 2) -> unlink / none
- `/p/south-seattle-wa` (1 / 2) -> unlink / none
- `/p/st-hedwig-tx` (1 / 2) -> unlink / none
- `/p/thousandoaks-ca` (1 / 2) -> unlink / none
- `/p/von-ormy-tx` (1 / 2) -> unlink / none
- `/p/what-to-do-when-your-pool-chemicals-are-all-messed-up` (1 / 2) -> unlink / none
- `https://poolrentalnearme.com/guides/is-renting-out-your-pool-worth-it` (1 / 2) -> unlink / none
- `/p/guide-to-kids-birthday-pool-parties-in-merced-ca` (1 / 1) -> unlink / none

### maintenance COST link; /p/pool-maintenance is the general maintenance guide, not a cost page (20)

- `/blog/pool-maintenance-costs` (2 / 4) -> `/p/pool-maintenance`
- `/g/pool-maintenance-cost` (2 / 4) -> `/p/pool-maintenance`
- `/b/average-pool-maintenance-cost` (1 / 2) -> `/p/pool-maintenance`
- `/b/lowering-pool-maintenance-costs` (1 / 2) -> `/p/pool-maintenance`
- `/b/pool-maintenance-cost` (1 / 2) -> `/p/pool-maintenance`
- `/b/pool-maintenance-costs` (1 / 2) -> `/p/pool-maintenance`
- `/blog/pool-maintenance-cost` (1 / 2) -> `/p/pool-maintenance`
- `/g/how-much-does-it-cost-to-maintain-a-pool` (1 / 2) -> `/p/pool-maintenance`
- `/guides/pool-maintenance-costs` (1 / 2) -> `/p/pool-maintenance`
- `https://poolrentalnearme.com/average-pool-maintenance-costs` (1 / 2) -> `/p/pool-maintenance`
- `https://poolrentalnearme.com/blog/common-pool-maintenance-mistakes` (1 / 2) -> `/p/pool-maintenance`
- `https://poolrentalnearme.com/guides/eco-friendly-pool-maintenance-tips` (1 / 2) -> `/p/pool-maintenance`
- `https://poolrentalnearme.com/guides/maryland-pool-maintenance` (1 / 2) -> `/p/pool-maintenance`
- `https://poolrentalnearme.com/guides/pool-maintenance-cost` (1 / 2) -> `/p/pool-maintenance`
- `https://poolrentalnearme.com/guides/pool-skimmer-maintenance` (1 / 2) -> `/p/pool-maintenance`
- `/b/northeast-pool-maintenance-guide` (0 / 2) -> `/p/pool-maintenance`
- `/blog/average-pool-maintenance-cost` (0 / 1) -> `/p/pool-maintenance`
- `/blog/pool-maintenance-tx` (0 / 1) -> `/p/pool-maintenance`
- `https://poolrentalnearme.com/blog/average-pool-maintenance-cost` (0 / 1) -> `/p/pool-maintenance`
- `https://poolrentalnearme.com/guides/how-to-maintain-an-indoor-pool` (0 / 1) -> `/p/pool-maintenance`

### live redirect target /p/waivers is right, but the link label in src/components/templates/advocacy.tsx:428 is 'Liability waiver template' (liability subject, rule 8): href-only change proposed (1)

- `/p/sign-a-waiver` (52 / 0) -> `/p/waivers`

### saltwater-vs-chlorine comparison link; the closest page covers saltwater care only (12)

- `/b/saltwater-vs-chlorine` (2 / 4) -> `/p/saltwater-pool-care`
- `/blog/saltwater-vs-chlorine-pools` (2 / 4) -> `/p/saltwater-pool-care`
- `/guides/saltwater-vs-chlorine` (2 / 4) -> `/p/saltwater-pool-care`
- `https://poolrentalnearme.com/guides/saltwater-vs-chlorine-pools` (2 / 4) -> `/p/saltwater-pool-care`
- `https://poolrentalnearme.com/guides/saltwater-vs-chlorine` (1 / 4) -> `/p/saltwater-pool-care`
- `/b/saltwater-conversion-guide` (1 / 2) -> `/p/saltwater-pool-care`
- `/g/salt-water-vs-chlorine-pools` (1 / 2) -> `/p/saltwater-pool-care`
- `/guides/chlorine-vs-salt` (1 / 2) -> `/p/saltwater-pool-care`
- `/guides/saltwater-vs-chlorine-for-rental-pools` (1 / 2) -> `/p/saltwater-pool-care`
- `https://poolrentalnearme.com/blog/salt-water-pool-vs-chlorine-which-is-better` (1 / 2) -> `/p/saltwater-pool-care`
- `/guides/saltwater-vs-chlorine-pools` (0 / 1) -> `/p/saltwater-pool-care`
- `https://poolrentalnearme.com/guides/saltwater-vs-chlorine-pool-maintenance` (0 / 1) -> `/p/saltwater-pool-care`

### Giggster comparison link redirects to the Swimply comparison hub; the Giggster comparison page exists (see also F6) (13)

- `/p/giggster-vs-pool-rental-near-me-in-carlsbad` (5 / 5) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-park-ridge-nj` (3 / 3) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-corte-madera-ca` (2 / 2) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-washington-dc` (2 / 2) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-wellesley-ma` (2 / 2) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-bradley-gardens-nj` (1 / 1) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-brambleton-va` (1 / 1) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-burke-centre-va` (1 / 1) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-cranford-nj` (1 / 1) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-elmendorf-tx` (1 / 1) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-honolulu` (1 / 1) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-huntington-ny` (1 / 1) -> `/p/giggster-vs-pool-rental-near-me`
- `/p/giggster-vs-pool-rental-near-me-in-irvine` (1 / 1) -> `/p/giggster-vs-pool-rental-near-me`

### guest-prep link; the closest page is an academy course (16)

- `/blog/prepare-pool-for-rental` (1 / 4) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/b/get-your-pool-ready-to-rent` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/blog/prepare-backyard-for-pool-guests` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/blog/preparing-your-backyard-for-guests` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/blog/preparing-your-pool-for-guests` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/g/prepare-pool-for-rental-season` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/guides/how-to-get-your-pool-ready-for-guests` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/guides/how-to-prepare-your-pool-for-guests` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/guides/preparing-your-pool-for-rental-guests` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `https://poolrentalnearme.com/blog/how-to-prepare-your-pool-for-rental-guests` (1 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/b/backyard-guest-prep` (0 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/p/prepare-pool-rentals` (0 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `https://poolrentalnearme.com/how-to-prepare-your-pool-for-guests` (0 / 2) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/blog/how-to-get-your-pool-ready-for-swimming-guests` (0 / 1) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/blog/preparing-your-pool` (0 / 1) -> `/p/elearning-academy-pool-rental-host-prep-guide`
- `/blog/preparing-your-pool-for-rental` (0 / 1) -> `/p/elearning-academy-pool-rental-host-prep-guide`

### help-center link; /p/host-help is host-only help (2)

- `/help-center` (17 / 17) -> `/p/host-help`
- `https://poolrentalnearme.com/help-center` (3 / 3) -> `/p/host-help`

### renter-intent city link redirects to host-recruitment page /p/<page>; a guest page exists (9)

- `/p/houston-tx` (2 / 5) -> `/p/houston`
- `/p/renton-wa` (2 / 5) -> `/p/renton`
- `/p/fort-worth-tx` (2 / 4) -> `/p/fort-worth`
- `/p/evansville-in` (1 / 2) -> `/p/evansville`
- `/p/fort-wayne-in` (1 / 2) -> `/p/fort-wayne`
- `/p/indianapolis-in` (1 / 2) -> `/p/indianapolis`
- `/p/irvine-ca` (1 / 2) -> `/p/irvine`
- `/p/modesto-ca` (1 / 2) -> `/p/modesto`
- `/p/naples-fl` (1 / 2) -> `/p/naples`

### redirects to a city page in a different state (4)

- `/p/charleston-wv` (10 / 0) -> unlink / none
- `/p/madison-nj` (10 / 0) -> unlink / none
- `/p/nashville-ga` (10 / 0) -> unlink / none
- `/p/los-angeles-ca` (0 / 1) -> unlink / none

### missing city host page caught by the become-a-host catch-all; city is lost. Proposal: keep generic /p/become-a-host or unlink (20)

- `/p/become-a-pool-host-highlands-ranch-co` (8 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-become-a-swimming-pool-host-lake-worth-fl` (2 / 1) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-new-provi-dence-nj` (2 / 1) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-foster-ca` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-garden-ny` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-greenlawn-ny` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-hastings-on-hudson-ny` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-hockessin-de` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-ladera-ranch-ca` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-lake-mohawk-nj` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-linganore-md` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-massapequa-ny` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-needham-ma` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-redwood-ca` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-rio-del-mar-ca` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-riverside-il` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-salisbury-ny` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-the-pinery-co` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-villanova-pa` (1 / 0) -> unlink / none
- `/p/become-a-swimming-pool-host-westphalia-md` (1 / 0) -> unlink / none

### host-recruitment link redirects to a swim-instructor page; proposal is the generic /p/become-a-host or unlink (16)

- `/p/become-a-swimming-pool-host-bellmore-ny` (5 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-east-northport-ny` (5 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-highlands-ranch-co` (3 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-accokeek-md` (2 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-cresskill-nj` (2 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-artondale-wa` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-cedar-mill-or` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-chevy-chase-md` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-discovery-bay-ca` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-keystone-fl` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-lexington-ma` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-madeira-oh` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-seaford-ny` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-short-hills-nj` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-succasunna-nj` (1 / 0) -> `/p/become-a-host`
- `/p/become-a-swimming-pool-host-upper-montclair-nj` (1 / 0) -> `/p/become-a-host`

### general hosting-tips link; no dedicated tips page (8)

- `/b/pool-rental-host-tips` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/blog/ultimate-guide-to-profitable-pool-hosting` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/guides/pool-rental-tips-for-professional-hosts` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/guides/tips-for-successful-pool-hosting` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/p/pool-rental-tips` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `https://poolrentalnearme.com/guides/backyard-rental-tips` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `https://poolrentalnearme.com/guides/hosting-tips-for-private-pool-owners` (1 / 2) -> `/p/how-to-rent-out-your-pool`
- `/p/step-by-step-guide-to-hosting-your-first-swimmer` (0 / 1) -> `/p/how-to-rent-out-your-pool`

### cleaning how-to link; the closest page is a cleaning schedule (7)

- `/b/how-to-clean-a-pool` (1 / 2) -> `/p/weekly-pool-cleaning-schedule`
- `/blog/cleaning-guide` (1 / 2) -> `/p/weekly-pool-cleaning-schedule`
- `/blog/diy-pool-cleaning-secrets` (1 / 2) -> `/p/weekly-pool-cleaning-schedule`
- `/blog/pool-cleaning-101` (1 / 2) -> `/p/weekly-pool-cleaning-schedule`
- `/blog/pool-cleaning-tips` (1 / 2) -> `/p/weekly-pool-cleaning-schedule`
- `/guides/pool-cleaning-for-hosts` (1 / 2) -> `/p/weekly-pool-cleaning-schedule`
- `/p/ultimate-pool-cleaning-guide` (1 / 2) -> `/p/weekly-pool-cleaning-schedule`

### price link whose intent (guest price vs host rate) is unclear (6)

- `/blog/average-pool-rental-prices` (1 / 2) -> `/p/how-much-can-i-rent-my-pool-for`
- `/guides/how-to-calculate-pool-rental-rates` (1 / 2) -> `/p/how-much-can-i-rent-my-pool-for`
- `/p/pool-rental-price-calculator` (1 / 2) -> `/p/how-much-can-i-rent-my-pool-for`
- `https://poolrentalnearme.com/guides/how-much-to-rent-a-pool-for-a-day` (1 / 2) -> `/p/how-much-can-i-rent-my-pool-for`
- `https://poolrentalnearme.com/guides/pool-rental-price-calculator` (1 / 2) -> `/p/how-much-can-i-rent-my-pool-for`
- `/blog/how-much-to-rent-a-pool-per-hour` (0 / 1) -> `/p/how-much-can-i-rent-my-pool-for`

### slug 'new-ny' looks like a truncated New York host page (1)

- `/p/become-a-swimming-pool-host-new-ny` (13 / 2) -> `/p/become-a-swimming-pool-host-new-york-ny`

### swim-instructor link redirects to a host-recruitment page; proposal is the generic /p/swim-instructor-pool-rental or unlink (5)

- `/p/swim-instructor-pool-rental-broomfield-co` (6 / 0) -> `/p/swim-instructor-pool-rental`
- `/p/swim-instructor-pool-rental-durham-ct` (2 / 2) -> `/p/swim-instructor-pool-rental`
- `/p/swim-instructor-pool-rental-bronx` (1 / 1) -> `/p/swim-instructor-pool-rental`
- `/p/swim-instructor-pool-rental-wheeling-il` (1 / 1) -> `/p/swim-instructor-pool-rental`
- `/p/swim-instructor-pool-rental-kansas-city-mo` (0 / 1) -> `/p/swim-instructor-pool-rental`

### swim-instructor city link redirects to search hub /s (3)

- `/p/swim-instructor-pool-rental-auburn` (5 / 4) -> `/p/swim-instructor-pool-rental`
- `/p/swim-instructor-pool-rental-sacramento` (2 / 1) -> `/p/swim-instructor-pool-rental`
- `/p/swim-instructor-pool-rental-buckner-ky` (1 / 1) -> `/p/swim-instructor-pool-rental`

### redirects to generic hub /s, which is not about the same thing; proposal: unlink (6)

- `/p/marketingforpoolhosts` (2 / 2) -> unlink / none
- `/p/sylmar-ca` (2 / 2) -> unlink / none
- `/p/locations` (1 / 1) -> unlink / none
- `/p/parma` (1 / 1) -> unlink / none
- `/p/hoover` (1 / 0) -> unlink / none
- `/p/new-orleans` (1 / 0) -> unlink / none

### narrower chemistry topic than the basics page (6)

- `/b/pool-chemistry-hot-weather` (1 / 2) -> `/p/water-chemistry-basics`
- `/blog/pool-water-testing-101` (1 / 2) -> `/p/water-chemistry-basics`
- `/p/how-to-lower-chlorine-in-a-pool-safely` (1 / 2) -> `/p/water-chemistry-basics`
- `https://poolrentalnearme.com/guides/how-much-chlorine-to-add-to-pool` (0 / 1) -> `/p/water-chemistry-basics`
- `https://poolrentalnearme.com/guides/how-to-shock-a-pool-guide` (0 / 1) -> `/p/water-chemistry-basics`
- `https://poolrentalnearme.com/guides/pool-water-testing-guide` (0 / 1) -> `/p/water-chemistry-basics`

### average income / worth-it link; closest page is the earnings article (4)

- `/b/is-renting-out-my-pool-worth-it` (1 / 2) -> `/p/how-much-can-you-make-renting-your-pool`
- `/blog/average-income` (1 / 2) -> `/p/how-much-can-you-make-renting-your-pool`
- `https://poolrentalnearme.com/is-renting-out-your-pool-worth-it` (0 / 2) -> `/p/how-much-can-you-make-renting-your-pool`
- `/blog/average-pool-rental-income` (0 / 1) -> `/p/how-much-can-you-make-renting-your-pool`

### 'is a heater worth it' link; options are /p/pool-heater-guide (owner) or /p/heated-pool-rentals (guest) (3)

- `/b/is-a-heated-pool-worth-it` (1 / 2) -> `/p/heated-pool-rentals`
- `/blog/eco-heating-tips` (1 / 2) -> `/p/heated-pool-rentals`
- `/g/is-a-pool-heater-worth-it` (1 / 2) -> `/p/heated-pool-rentals`

### post-party cleanup link (2)

- `/blog/how-to-clean-pool-after-party` (1 / 3) -> `/p/how-to-host-a-pool-party`
- `https://poolrentalnearme.com/guides/post-party-cleanup-guide` (1 / 2) -> `/p/how-to-host-a-pool-party`

### party-rental link: guest page /p/rent-a-pool-for-kids-birthday-party or host page /p/pool-host-birthday-parties-guide (3)

- `https://poolrentalnearme.com/guides/pool-rental-for-birthday-parties` (1 / 2) -> `/p/rent-a-pool-for-kids-birthday-party`
- `https://poolrentalnearme.com/guides/pool-rental-for-parties` (1 / 2) -> `/p/rent-a-pool-for-kids-birthday-party`
- `/blog/how-to-rent-your-pool-for-a-party` (0 / 1) -> `/p/rent-a-pool-for-kids-birthday-party`

### points at the page itself ('/p/city' -> /); anchor needs reading (1)

- `/p/city` (2 / 4) -> unlink / none

### opening COST link; the page is an opening how-to (2)

- `/g/pool-opening-cost` (1 / 2) -> `/p/opening-a-pool`
- `/p/cost-to-open-a-pool` (1 / 2) -> `/p/opening-a-pool`

### guest-experience link; closest page is an academy course (2)

- `/guides/managing-guest-expectations` (1 / 2) -> `/p/elearning-academy-guest-psychology-experience-design-complete-host-masterclass`
- `https://poolrentalnearme.com/guides/perfect-guest-experience` (1 / 2) -> `/p/elearning-academy-guest-psychology-experience-design-complete-host-masterclass`

### '/ca' could mean California or Canada (1)

- `/ca` (2 / 4) -> unlink / none

### '/va' and '/virginia-va' are ambiguous state links (2)

- `/va` (1 / 2) -> `/p/pool-rentals-virginia`
- `/virginia-va` (1 / 2) -> `/p/pool-rentals-virginia`

### 'safe' / legal-guide link; the page is about legality (2)

- `/blog/is-it-safe-to-rent-out-your-pool` (1 / 2) -> `/p/is-it-legal-to-rent-out-your-pool`
- `/blog/legal-guide-for-pool-hosts` (1 / 2) -> `/p/is-it-legal-to-rent-out-your-pool`

### 'pool rental app' link (2)

- `/g/pool-rental-app` (0 / 2) -> `/p/top-pool-rental-platforms`
- `https://poolrentalnearme.com/pool-rental-app-for-owners` (0 / 2) -> `/p/top-pool-rental-platforms`

### 'washington' could be the state or DC (/p/washington-dc) (1)

- `/p/washington` (1 / 2) -> `/p/pool-rentals-washington`

### guides-index link redirects to the maintenance guide (1)

- `/p/guides` (1 / 2) -> `/p/blog`

### 'keep water clear' link (1)

- `/p/how-to-keep-pool-water-clear` (1 / 2) -> `/p/cloudy-pool-water-fix`

### the only similar page (/p/pool-rental-protect) is an insurance page; not mine to choose (1)

- `/p/protect-your-pool` (1 / 2) -> unlink / none

### above-ground opening link; the page is a general opening how-to (1)

- `/p/how-to-open-an-above-ground-pool` (1 / 2) -> `/p/opening-a-pool`

### photoshoot link: guest policy /p/photoshoots-pool-rental-policy or host guide (1)

- `https://poolrentalnearme.com/guides/pool-rental-for-photoshoots` (1 / 2) -> `/p/pool-host-photoshoots-guide`

### 'union county' has no page; state hub is the nearest (1)

- `https://poolrentalnearme.com/s/nc/union-county` (1 / 2) -> `/p/pool-rentals-north-carolina`

### general 'pool cost calculator' link; the existing calculator is heating-only (1)

- `/g/pool-cost-calculator` (1 / 2) -> `/p/pool-heating-cost-calculator`

### safety-checklist link; closest page is not a checklist (1)

- `/blog/pool-host-safety-checklist` (1 / 2) -> `/p/pool-safety-essentials`

### safety-guidelines link: guest (/p/guest-pool-safety-guidelines) or host (/p/safety-guidelines-for-pool-hosts) version (1)

- `/g/pool-safety-guidelines` (1 / 2) -> `/p/guest-pool-safety-guidelines`

### URL says Reading, MA but the link text says 'North Reading' (a different town); no North Reading page (1)

- `/reading-ma` (1 / 2) -> `/p/reading-ma`

### rules TEMPLATE link; the closest page is the rules generator tool (1)

- `/guides/pool-rental-rules-template` (1 / 2) -> `/p/pool-rules-generator`

### owner-questions link; /p/faq and /p/frequently-asked-questions both exist (1)

- `/guides/common-direct-pool-owner-questions` (1 / 2) -> `/p/frequently-asked-questions`

### every database occurrence sits in a sentence about insurance/liability, so any edit touches that sentence (rule 8); would otherwise be REWRITE to /p/host-marketing-playbook (1)

- `/guides/pool-rental-marketing` (1 / 2) -> `/p/host-marketing-playbook`

### 'monetize your backyard' link (2)

- `/blog/how-to-monetize-your-backyard` (0 / 1) -> `/p/make-money-renting-out-your-pool`
- `https://poolrentalnearme.com/blog/how-to-monetize-your-backyard` (0 / 1) -> `/p/make-money-renting-out-your-pool`

### every database occurrence sits in a sentence about insurance/liability, so any edit touches that sentence (rule 8); would otherwise be UNLINK (1)

- `/host-tools/pool-shade-calculator` (0 / 2) -> unlink / none

### humidity link; nearest is not the same subject (1)

- `/p/humidity-management` (0 / 2) -> `/p/pool-heater-guide`

### anchor unknown; 'poolrentalnearme' brand link (1)

- `/p/poolrentalnearme` (0 / 2) -> `/p/pool-rental-near-me-the-airbnb-of-pools`

### pump running-cost link; the calculator is heating-only (1)

- `/blog/how-much-does-it-cost-to-run-a-pool-pump` (0 / 1) -> `/p/pool-heating-cost-calculator`

### high-end events hosting link (1)

- `/blog/how-to-rent-out-your-pool-for-high-end-events` (0 / 1) -> `/p/how-to-host-a-pool-party`

### 'red flag guests' link; closest is an academy course (1)

- `/blog/how-to-spot-red-flag-guests` (0 / 1) -> `/p/elearning-academy-managing-high-risk-non-compliant-renters`

### 'is building a pool worth it' link (1)

- `https://poolrentalnearme.com/blog/is-building-a-pool-worth-it` (0 / 1) -> `/p/cost-of-building-a-pool-in-2026`

### 'is my pool safe for swimmers' link (1)

- `/blog/is-my-pool-safe-for-swimmers` (0 / 1) -> `/p/water-safety`

## Top REWRITE targets by reach

| old target | destination | audited linking pages | database rows |
|---|---|---:|---:|
| `/l/draft/00000000-0000-0000-0000-000000000000/new/details` | `/wizard/` | 4,182 | 1 |
| `/p/free-host-tools` | `/p/pool-host-tools` | 2,323 | 1,077 |
| `/host_help` | `/p/host-help` | 48 | 2,162 |
| `/faq` | `/p/faq` | 31 | 2,134 |
| `/guest_pool_safety_guidelines` | `/p/guest-pool-safety-guidelines` | 32 | 2,108 |
| `/pool_safety_for_hosts` | `/p/pool-safety-for-hosts` | 20 | 2,107 |
| `/community_guidelines` | `/p/community-guidelines` | 19 | 2,095 |
| `/make_money_renting_out_your_pool` | `/p/make-money-renting-out-your-pool` | 10 | 2,087 |
| `/p/terms-of-service` | `/terms-of-service` | 1,091 | 0 |
| `https://poolrentalnearme.com/p/hosting` | `/p/hosting` | 88 | 102 |
| `/p/privatepoolrentalssandiego` | `/p/san-diego-ca` | 126 | 0 |
| `https://poolrentalnearme.com/s` | `/s` | 31 | 36 |
| `/l/the-luxe-oasis-by-r-e-ultimate-pool-paradise/6878875a-ef62-4189-880e-a8addc2b9a58` | `/l/the-luxe-oasis-by-re-ultimate-pool-paradise/6878875a-ef62-4189-880e-a8addc2b9a58` | 47 | 0 |
| `https://poolrentalnearme.com/` | `/` | 14 | 30 |
| `/pool-rental-near-me-the-airbnb-of-pools` | `/p/pool-rental-near-me-the-airbnb-of-pools` | 20 | 20 |
| `/host-tools` | `/p/pool-host-tools` | 18 | 18 |
| `/p/poolrentalsignage` | `/p/pool-rental-signage` | 9 | 9 |
| `/guides/how-to-rent-out-your-pool` | `/p/how-to-rent-out-your-pool` | 5 | 13 |
| `/p/become-a-swimming-pool-host-chicago` | `/p/become-a-swimming-pool-host-chicago-il` | 16 | 0 |
| `/p/rent_a_pool_for_kids_birthday_party` | `/p/rent-a-pool-for-kids-birthday-party` | 8 | 8 |
| `/l/savage-summer-sports-yard-all-inclusive-backyard-playground/69cd969b-0d5f-4025-8415-abf9a72c7348` | `/l/savage-summer-sports-yard-allinclusive-backyard-playground/69cd969b-0d5f-4025-8415-abf9a72c7348` | 14 | 0 |
| `/l/love-on-private-pool-on-over-an-acre/6a8213ba-cb95-47bb-94ae-41f710bed157` | `/l/loveon-private-pool-on-over-an-acre/6a8213ba-cb95-47bb-94ae-41f710bed157` | 14 | 0 |
| `/p/what_to_include_in_a_welcome_kit_for_pool_renters` | `/p/what-to-include-in-a-welcome-kit-for-pool-renters` | 6 | 6 |
| `/p/why_pool_owners_are_such_fans_of_pool_rental_services_testimonials_and_real_life_cases` | `/p/why-pool-owners-are-such-fans-of-pool-rental-services-testimonials-and-real-life-cases` | 6 | 6 |
| `https://poolrentalnearme.com/pool-rental-near-me-the-airbnb-of-pools` | `/p/pool-rental-near-me-the-airbnb-of-pools` | 6 | 6 |

