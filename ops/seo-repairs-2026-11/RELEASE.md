# SEO release 2026-11: one approval, step by step

**Status: nothing in this document has been run.** It was written on 2026-11-15 from the
branches, PRs and files named below. Every count was read from those files or measured
with read-only GETs on 2026-11-15. Items marked **to confirm** depend on work that other
jobs are still finishing. Items marked **pending** do not exist yet.

How to use it:

- **Owner:** read section 1 (what changes), then answer each line of section 3 with Yes
  or No. A Yes covers that line only. Nothing in section 2 starts without it.
- **Operator:** follow section 2 in order. Each step ends with a gate. If a gate fails,
  stop, roll back that step (section 4), and report. Do not skip a gate.
- Rules from `CLAUDE.md` in poolrentalnearme-web apply throughout. In particular: rule 3
  (no email or SMS to users. Nothing here is *known* to send any: the F13 sync job calls
  an EAST-only hook nobody has read yet, so step 6.2 must confirm it sends nothing before
  A13 is asked; and every scheduled run is reported, step 6.4), rule 4 (disclose every
  scheduled job when it is created; step 6), rule 8 (insurance, liability, coverage,
  claims or damage text goes to the owner and is not edited), and the WEST deploy ritual.
- **A Yes is only possible for a change whose exact content exists.** A line marked
  **not yet approvable** in section 3 is not asked in this round. It comes back as its
  own line once its exact SQL or config diff, dry-run output, backup name and rollback
  file exist and have been reviewed.
- **Not part of this release:** any change to DNS, Cloudflare caching, redirects,
  security rules, Workers or routing. Workers Routes on founders.click are never edited.

---

## 0. Facts this runbook relies on (re-check on the day)

| Fact | Value on 2026-11-15 | How to re-check |
|---|---|---|
| What EAST runs | `77028454655e7b272d8c23987b54f445f9eba9f7`, branch `ops/deploy-sha-enforcement`, `dirty` 5, built 2026-11-04T07:38:03Z | `curl -s https://www.poolrentalnearme.com/fw-assets/__build.json` |
| EAST-only files (the five `dirtyFiles`) | `src/components/home-page.tsx`, `src/routes/__root.tsx`, `src/server/listing-sync.server.ts`, `src/server/sharetribe.server.ts`, `src/lib/listing-slug.ts` | same stamp, `dirtyFiles` |
| Rule for those five | They exist only on EAST. They must be byte-for-byte the same after every step. No branch in this release changes them (checked with `git diff --name-only 7702845 <branch> -- <five files>`: empty for all six branches below). | step 1, check 1.3 |
| fresh-web repo | `https://github.com/derekbowen/fresh-web-702e04c3.git` (public) | |
| Branch tips used for the trial merge | `seo/01-failed-read-503` b3e2ace, `seo/02-redirects-fees-links` f04fb6e, `seo/03-sitemaps` d127364, `seo/05-intent` 46aa05e, `seo/06-scheduled-jobs` f9b6d9b, `seo/07-release-tracking` bba4b13 | `git ls-remote https://github.com/derekbowen/fresh-web-702e04c3.git 'refs/heads/seo/*'` |
| On GitHub already | 01 (b3e2ace), 02 (f04fb6e), 06 at **2c2f857** (the token fix f9b6d9b is local only), 07 at **3edfbe9** (bba4b13, 8229cee, 8f7c105 and c9fd110 are local only). 03, 04 and 05 are **not on GitHub**. Step 0.2 pushes them before anything else. | same command |
| `seo/04-dupes-canonical` (F6a + F10) | **Pending:** no local or remote branch exists. Whether this release waits for it is approval line A0. | same command |
| EAST release tooling | poolrentalnearme-web `ops/east/seo-release-2026-11/`: `east_seo_release.py` (PLAN, GO, ROLLBACK), `ship.py` (sends it to EAST in parts: it no longer fits one SSM command), `README.md`, `test/` (local simulation of EAST, 42 scenarios). Not pushed; never run on EAST. | `ls ops/east/seo-release-2026-11` in poolrentalnearme-web |
| `ops/deploy-east.sh` on `seo/07-release-tracking` | Committed (8229cee, 8f7c105, and c9fd110, the build-copy / proven-restart commit). (1) EAST-only allowlist: a pin file in `sha256sum` format, by default `/home/ubuntu/fresh-web.east-only.sha256` (outside the tree); each pinned file must be dirty and match its pin, every dirty file must be pinned. (2) It builds in a copy (`/home/ubuntu/fresh-web.build`), so the live `dist/` is untouched until a rename right before the restart, and it carries the previous build's hashed assets over. (3) Every restart is proven through pm2 (new pid/uptime); the live stamp cannot prove it, since `serve.mjs` reads it from disk. (4) `pm2 restart fresh-web` without `--update-env`. | `git log -3 -- ops/deploy-east.sh` |
| EAST build memory | `NODE_OPTIONS=--max-old-space-size=3072` is required. 1536 MB ran out of memory on 2026-11-04. The box is a t3.medium (3.8 GB RAM, 2 GB swap). | `docs/OPS_RECORD_2026-11-04_remove-intercom.md` (poolrentalnearme-web) |
| Cloudflare cache rule | One rule per zone (`http_request_cache_settings`). It caches `/`, `/p/*` (except `/p/affiliate*`, `/p/privacy-request*`, `/p/waitlist-signup*`), `/public-pools/*`, `/sitemap*` and `/robots.txt` for GET requests without the `st-authinfo` cookie, with an **edge TTL override of 600 s**. A 404 and a 301 on `/p/*` go MISS, then HIT. | `docs/OPS_RECORD_2026-09-16_edge-cache-db-protection.md` §1 (poolrentalnearme-web) |
| CI | Red on both repos for reasons outside these PRs. fresh-web: three link-audit workflows crawl a Lovable preview URL (`BASE_URL` in `.github/workflows/internal-links.yml`, `page-links-check.yml`, `all-locations-check.yml`) that answers 403. poolrentalnearme-web: "Tests and gates" fails on PR #2 and PR #3; the image audit flags bun's package cache. | GitHub checks on each PR |

---

## 1. What is being released

"Merge" below means: merged into the integration branch `seo/release-2026-11`, which is
built from `ops/deploy-sha-enforcement` (7702845). PR numbers are fresh-web unless marked
WEST (poolrentalnearme-web).

| Fix | Branch / PR | What changes, for which URLs | How it was tested | Rollback |
|---|---|---|---|---|
| **F3** failed reads | `seo/01-failed-read-503`, PR #1 | A failed database read (error, exception, or 10 s timeout) answers **503** with `Retry-After: 120`, `Cache-Control: no-store` and a noindex body. It writes no `content_404_log` row and does not redirect. Covers `/p/*`, `/p/es/*`, both comparison routes, state hubs, the pool-pros directory, courses, `/p/all-locations`, `/p/blog`, every sitemap and the sitemap index. A real miss keeps today's answer (404 plus log row, or the existing 301). | `node scripts/check-types.mjs` pass; build pass; `node --test "tests/*.test.mjs"` 54/54; `npm run test:failed-reads` 259/259. The same harness fails 34 checks on the old code. | EAST rollback (section 4). No data. |
| **F11** (EAST part) loops and junk slugs | `seo/02-redirects-fees-links`, PR #3 (stacked on #1) | `/p` and `/p/` answer **404** in the app (they looped 301/307). `/p/null`, `/p/details`, `/p/mailto:*` answer **404** instead of 301 to `/`, and are not logged. | Same checks on f04fb6e; harness 271/0 (+11 F11 checks). | EAST rollback. |
| **F14** (code) false fee | `seo/02-redirects-fees-links`, PR #3 | `/p/affiliate`: removes the non-existent "10% platform fee" waiver and the figures built on it. Title, description and H1 state the 0% host fee; a new FAQ says 0% host / 15% guest. The 5%-for-2-years recruiter terms are unchanged. Profit calculator (`PoolRentalProfit`): host fee default 15% → 0%, still editable. | As above. | EAST rollback. |
| **F4** sitemaps (+ sitemap part of F2) | `seo/03-sitemaps`, no PR yet. **To confirm when the branch is final.** | Entries 10,181 → 10,024. URLs in two sitemaps 107 → 0 (5 stay on www until WEST proxies the academy sitemap, step 5e). Listed redirects 2 → 0. Listed noindex 1 → 0 (`/p/pool-pros`). Cross-host canonicals 57 → 0. Config listing removed. Comparisons read is paged past PostgREST's 1,000-row cap. Academy app route 70 → 202 URLs. `/sitemap-directory.xml` (1,357 noindex URLs) answers **410**. Adds `/s` and 7 dedicated `/p/` routes to `sitemap-static.xml`. Details: `docs/seo-repairs-2026-11/sitemaps.md` on that branch. | `tests/sitemap-rules.test.mjs` (20), `tests/sitemap.test.mjs` (15); harness 317/0. A build of b3e2ace fails 30 of the same checks. | EAST rollback. |
| **F1, F7** renter vs host intent (+ template part of F2) | `seo/05-intent`, no PR yet. **To confirm when the branch is final.** | 3,696 rendering HOST pages (`/p/become-a-*`): H1 and title carry the state; the empty-inventory notice is gone from the top; the inventory section shows only when pools exist in or near the city; the unbacked "$3,600/mo" projection and the `$75/hr` `priceRange` are removed. 256 RENTER pages (`/p/<city>-<st>`, bare `/p/<city>`, 3 topic pages): renter H1 and title, inventory-based meta description, search CTA, a labelled host section below. Links: 3,107 distinct `/p/pool-pros?city=` URLs → one `/p/pool-pros` link; `/s?address=` in one spelling per place. Duplicate H1 groups 518 → 20 (the 20 are the 24 duplicate city rows, step 4d). Details: `docs/seo-repairs-2026-11/intent.md` on that branch. | `tests/city-intent.test.mjs`; harness renders five intent fixtures. Counts in the doc come from `scripts/intent-report.mjs` over a read-only export. | EAST rollback. |
| **F6a** duplicate comparison pages | `seo/04-dupes-canonical`. **Pending** (branch does not exist). | Expected (from the tracker's data, `tracking/data/comparison-exact-dups.tsv`): the 78 `-in-<city>` comparison URLs 301 once to their `-in-<city>-<st>` twin. **To confirm when the branch is final.** | To confirm. | EAST rollback. |
| **F10** canonical host | `seo/04-dupes-canonical`. **Pending.** | Expected (from the tracker): US pages served on a ccTLD canonicalise to `www.poolrentalnearme.com`; each ccTLD `robots.txt` allows its own `/sitemap-country.xml`. **To confirm.** | To confirm. | EAST rollback. |
| **F15** related-links job | `seo/06-scheduled-jobs`, PR #2 | **Already applied in production on 2026-11-15.** Pages with `redirect_to` are never picked as related links; only changed rows are written. One refresh changed 136 rows; 0 visible pages now link to a redirecting page. The release only records the migration file in git. | `related-links-job/test.sh` on a throwaway PostgreSQL 16: ALL PASS. | `ops/seo-repairs-2026-11/related-links-job/rollback.sql` (seo/06). |
| **F13** listing-mirror sync | `seo/06-scheduled-jobs`, PR #2 | Prepared, not installed. A cron job every 15 minutes calls the deployed hook `POST /api/public/hooks/sync-listings`. `synced_listings` was last refreshed 2026-09-25. Step 6. | Runner tested against a local stub (commit f9b6d9b message). Not run on EAST. | STOP file, or remove the cron line (step 6). |
| **F7 data** 24 duplicate city pages | SQL in `docs/seo-repairs-2026-11/intent.md` §6 (seo/05) | 24 published HOST rows that duplicate a `-xx` page become `status='redirect'` (301 to the keeper), `in_sitemap=false`. Step 4d. | Generated by `scripts/intent-report.mjs --sql`; not applied. | Rollback SQL in the same section. |
| **F14 data** fee statements in page bodies | `/home/user/fresh-web-seo-data/ops/seo-repairs-2026-11/fees/` (branch `seo/02-content-repairs`, uncommitted). **In progress.** | `fee-corrections.csv`: 1,828 proposed edits in `content_pages` bodies: 1,385 `FIX`, 443 `NEEDS_DEREK` (insurance or other wording that only the owner decides). Includes the three database pages the tracker checks (`become-a-swimming-pool-host-saratoga-springs-ny`, `swim-instructor-pool-rental-fair-oaks-ranch-tx`, `swim-instructor-pool-rental-mount-vernon-va`). Step 4a. | **Pending:** `dry-run.sql`, `apply.sql`, `rollback.sql`, runbook. | Backup table (step 4a). |
| **F5** internal links | same folder, `links/` (in progress) | `link-mapping.csv`: 1,169 old link targets: 600 `REWRITE`, 135 `UNLINK`, 434 `NEEDS_DEREK`. `code-handoff.md` lists hard-coded old links in `src/**` (e.g. 2,323 pages link `/p/free-host-tools` through the auto-link rules in `src/server/internal-links.functions.ts`). **The code part is in no branch yet.** Step 4b. | **Pending:** dry-run, apply, rollback, runbook. | Backup table (step 4b). |
| **F8** public pools | Data: `/home/user/fresh-web-seo-pp/ops/seo-repairs-2026-11/public-pools/` (branch `seo/05b-public-pools-data`, uncommitted, **in progress**). Rendering: `pp-ssr` on WEST, after WEST PR #3. | Data: read-only SQL and CSVs so far (`duplicate-mapping.csv` 291 candidate pairs; `count-consistency.csv` 444 cities). Rendering fix (`ai_best_for` printed as raw JSON on 1,679 of 2,000 indexed pool pages): not written; it needs the pp-ssr source in git first. Step 4c, step 5a. | **Pending:** apply and rollback SQL. | Backup table (step 4c). |
| **F9** listing status codes; **F11** `/l` loop; `/confirm` | WEST PR #2 (`seo/west-status-and-robots`, 34d12a7) | `/l/<not-a-uuid>` (the six "Error in loading the listing" pages) → **404**. A temporary listing-load failure (5xx, 429, network, timeout, unknown, a 403 without an API error) → **503**, `Retry-After: 120`, `no-store`, `noindex`. `/l` and `/l/` → **404** in the app. `/confirm` → `noindex, follow`. Healthy, closed and owner-view listings: byte-identical. Record: `docs/OPS_RECORD_2026-11-15_seo-status-codes.md` (on that branch). | `jest server` 19 suites, 322 passed; `ssrStatus` 83; `bun run test-ssr-status` 58/58. | WEST nginx upstream swap back (step 5b). |
| **F12** robots.txt | WEST PR #2, `ops/west/robots/` | The live www `robots.txt` is versioned byte-for-byte. Proposed file applies edits E1–E6 (README §4). Every URL in today's sitemaps stays allowed. Step 5f. | `node --test ops/west/robots/*.test.mjs`: 269 tests, 268 pass, 1 skipped (opt-in live run); live run 91/91. | Swap back the backup file (step 5f). |
| **F8 prerequisite** pp-ssr capture | WEST PR #3 (`seo/pp-ssr-preserve`, ee16493) | Captures the pp-ssr container source to an orphan branch `ops/pp-ssr-snapshot-<date>`. Changes nothing that serves traffic. Step 5a. | `--selftest` (secret scanner). Not run against WEST. | Nothing to roll back; delete the snapshot branch if wanted. |
| Tracker | `seo/07-release-tracking`, PR #4 | `ops/seo-repairs-2026-11/tracking/track_groups.py` and this file. No application code. | `--selftest` 5/5 (commit bba4b13); baseline runs in `tracking/reports/2026-11-15/`. | Delete the directory. |
| **EAST deploy gate** | `seo/07-release-tracking`, PR #4: 8229cee, 8f7c105, c9fd110 | **Changes the gate every later EAST deploy runs through.** `ops/deploy-east.sh`, `scripts/check-deployed-sha.mjs`, `scripts/check-production-drift.mjs`. What it now allows: dirty files that are listed in the pin file AND whose sha256 equals the pin, exactly that set and no other (the stamp, the live stamp and the drift check must all list exactly it; without a pin file the old "clean tree" rule holds). What it changes in how a deploy runs: the build happens in a copy, so the live `dist/` is untouched until a rename just before the restart; the previous build's hashed assets stay servable; every restart (and every restore's restart) must be proven through pm2; the restart no longer uses `--update-env`; a restore that cannot be proven says so in its ABORT line. | The tooling harness (poolrentalnearme-web `ops/east/seo-release-2026-11/test/run_tests.py`): 42 scenarios, 310 checks, 0 failed, with the real `deploy-east.sh`, `serve.mjs`, `stamp-build.mjs` and both check scripts. Includes the old rule without a pin file, wrong/stale/malformed pins, a sixth dirty file, failed and no-op restarts. Not run on EAST. | The EAST rollback restores the previous checkout, whose `deploy-east.sh` is the old one. The pin file stays (harmless to the old script, which ignores it). |

**F11 items outside EAST code** (step 5): bare `/p` gets a 301 to `/p/` from WEST nginx;
10 of the 99 stored underscore-slug redirects take two hops (measured below); `/l` gets a
301 to `/l/` from WEST nginx (inferred, PR #2 §1; step 5g, A17).

**Underscore redirects, measured 2026-11-15** (read-only GETs over the 99 underscore slugs
in `tracking/data/redirect-slugs.txt`): 10 take two hops. The other 352 stored redirects
in that file each took one hop in the same check, so all 10 multi-hop redirects are
underscore slugs. (The tracker baseline at 17:47 UTC counted 14 of 451; the later check
found 10.) In 9, the first hop
replaces only some of the underscores (for example
`/p/bubble_covers_for_…` → `/p/bubble_covers-for-…` → `/p/bubble-covers-for-…`). In 1,
`/p/trust_safety` → `/p/trust-safety` → `/p/trustsafety` (rewrite, then the stored
redirect). The underscore hops have an absolute `Location` and `content-type: text/html`;
the app's own redirect hop has a relative `Location` and `x-content-type-options: nosniff`.
That points to WEST nginx, but it is **inferred, not read**: no nginx file in either repo
contains the rule (`ops/cloudflare/west-nginx/` holds only `00-default-server.conf` and
`cloudflare-real-ip.conf`). On `www.poolrentalnearme.co.uk` the same URL also 301s, with a
relative `Location`, so EAST may have its own copy. Step 0.4 locates it.

---

## 2. Order of operations

```
0 pre-checks ── 1 build + local checks ── 2 EAST deploy ── 3 post-deploy checks ──┬── 4a fees    (data)
                                                                                    ├── 4b links   (data)
                                                                                    ├── 4c public pools (data, after 5a for rendering)
                                                                                    └── 4d 24 city redirects (data)
5a pp-ssr capture ── (independent of EAST; can run any time)
5b WEST release (PR #2) ── 5c nginx /p 404 ── 5d underscore fix ── 5g nginx /l
5e academy proxy (only after step 2 has shipped seo/03)      5f robots.txt (any time after A15)
6 F13 sync cron (after step 2; before the Sunoblack cutover it must be switched or stopped)
7 tracking (after every step, then on the dates in 7.1)
```

Independent: 4a–4d do not depend on each other. 5a–5f do not depend on EAST, except 5e.
Each data step and each WEST step is its own approval line.

### Step 0. Pre-checks (read-only)

0.1 **EAST is still what this runbook expects.**

```
curl -s https://www.poolrentalnearme.com/fw-assets/__build.json
```

Expect `sha` 77028454655e7b272d8c23987b54f445f9eba9f7, `dirty` 5, and exactly the five
`dirtyFiles` of section 0. Anything else: stop and re-plan.

0.2 **Branch tips.**

```
git ls-remote https://github.com/derekbowen/fresh-web-702e04c3.git 'refs/heads/seo/*' refs/heads/ops/deploy-sha-enforcement
```

Every branch of section 1 must be on GitHub at its final SHA **before** step 1, because
step 1 clones from GitHub. Today that means pushing (needs A2; the owner or an operator
with push rights):

- `seo/03-sitemaps` and `seo/05-intent` (not on GitHub at all);
- `seo/06-scheduled-jobs` at **f9b6d9b or later** (GitHub has 2c2f857, whose runner always
  sends the service-role key, so every tick would get a 401 once a hooks token is set);
- `seo/07-release-tracking` at **c9fd110 or later** (GitHub has 3edfbe9,
  whose `deploy-east.sh` has no allowlist: the EAST tooling refuses that release, and
  the old gate refuses the five EAST-only files);
- `seo/04-dupes-canonical` if A0 says the release waits for it.

Write every SHA into the release record. Check after pushing:

```
git ls-remote https://github.com/derekbowen/fresh-web-702e04c3.git refs/heads/seo/06-scheduled-jobs refs/heads/seo/07-release-tracking
git merge-base --is-ancestor f9b6d9b <recorded seo/06 SHA> && echo seo/06 has the token fix
git show <recorded seo/07 SHA>:ops/deploy-east.sh | grep -c -e EAST_ONLY_SHA256 -e restart_proven -e BUILD_DIR   # 3 kinds of line, so >= 3
```

0.2b **Record the marketplace marker** (WEST serves `/s` and `/login`; step 3.2 compares):

```
for p in /s /login; do curl -s "https://www.poolrentalnearme.com$p" | grep -o 'assets/index-[A-Za-z0-9_-]*\.js' | head -1; done
```

Write both markers into the release record.

0.3 **Cloudflare: can a 503 be cached?** (owner reads it; this release changes nothing.)

Why: F3 (and WEST F9) answer a temporary failure with `503` and `Cache-Control: no-store`.
The cache rule uses an edge TTL override of 600 s and covers `/`, `/p/*`,
`/public-pools/*`, `/sitemap*`. If that override also applies to 5xx, a 503 caused by a
short database blip stays cached on that URL for 10 minutes. It would still not be a 404,
not a redirect, and not a false 404-log row.

Where to read it, for each of the four zones (`poolrentalnearme.com`, `.co.uk`, `.ca`,
`.com.au`): Cloudflare dashboard → the zone → **Caching → Cache Rules** → open the rule →
**Edge TTL** section. Note:

- which Edge TTL option is selected (the ops record says it overrides the origin);
- whether a **Status code TTL** entry exists, and what it says for `503` or `500-599`;
- any custom error page or "Always Online" setting that could replace an origin 503.

Via the API the same fields are `action_parameters.edge_ttl.mode` and
`action_parameters.edge_ttl.status_code_ttl`. Record what you see in the release record.
The decision is the owner's (approval A1, a precondition of A3). Changing the rule is
outside this release.

0.4 **WEST and EAST nginx, read-only.** This finds (a) whether nginx replaces an origin 503
with its own error page on the proxied locations (PR #2 §7.4; it matters for F3 too,
because WEST proxies `/` and `/p/*` to EAST), (b) the `/p` and `/l` slash hops, and (c) the
underscore rewrite. Save this as `nginx_read.py` and run it once per box:

```python
import subprocess
cmd = ("nginx -T 2>/dev/null | grep -n -E "
       "'# configuration file|proxy_intercept_errors|error_page|rewrite |return 30[1278]|location = /p|location /p|location = /l|location /l/|location ~'")
out = subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout
print(out[-20000:])
```

```
python3 ops/runners/ssm_runx.py nginx_read.py     # WEST
python3 ops/runners/east_runx.py nginx_read.py    # EAST
```

(from a poolrentalnearme-web checkout on a machine with `PRNM_AWS_*`; SSM truncates
output past about 24 KB, hence the tail.) The `# configuration file <path>:` lines in the
output name the file each following line comes from; steps 5c and 5d back up and edit
that file. Gate: an `error_page` (or `proxy_intercept_errors on`) that would replace a 5xx
on a location that proxies to `upstream web` or to EAST **stops the release**: F3 and F9
would then show nginx's page instead of the app's 503. It goes to the owner as a new
decision, outside this approval round.

0.5 **Baseline tracker run** (from a fresh-web checkout of `seo/07-release-tracking`):

```
python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py --selftest
python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py
```

Expect the regression group to PASS and the repair checks to FAIL, as in
`tracking/reports/2026-11-15/`.

0.6 **Listing mirror staleness** (Supabase, read-only):

```sql
set transaction read only;
-- then the body of ops/seo-repairs-2026-11/listing-sync/staleness-check.sql (seo/06)
```

0.7 **Approvals.** Section 3 is filled in and dated by the owner, after 0.2–0.4 are
recorded, so that A3 names the exact branch SHAs.

**Gate 0:** 0.1 matches; 0.2 pushed and checked (seo/06 contains f9b6d9b; seo/07's
`deploy-east.sh` has all three markers); 0.2b recorded; 0.3 recorded; 0.4 reviewed and no
`error_page` stop; 0.5 baseline saved; A0 answered; **A1, A2 and A3 are Yes. A1 is a
precondition of A3:** F3 cannot be left out (seo/02, seo/03 and seo/05 are all built on
its commit b3e2ace), so A1 = No means no EAST release until the cache question is
settled, by a Cloudflare decision outside this release.

### Step 1. Build the integration branch and run the local checks

Run in a fresh clone, never in a shared worktree.

1.1 Build `seo/release-2026-11`:

```
git clone https://github.com/derekbowen/fresh-web-702e04c3.git fw-release && cd fw-release
git checkout -b seo/release-2026-11 77028454655e7b272d8c23987b54f445f9eba9f7
git merge --no-ff origin/seo/01-failed-read-503
git merge --no-ff origin/seo/02-redirects-fees-links
git merge --no-ff origin/seo/03-sitemaps
git merge --no-ff origin/seo/04-dupes-canonical    # ONLY if A0 = "wait for seo/04"; otherwise skip this line
git merge --no-ff origin/seo/05-intent
git merge --no-ff origin/seo/06-scheduled-jobs
git merge --no-ff origin/seo/07-release-tracking
```

Trial merge on 2026-11-15 (scratch clone, without 04): 01, 02, 03, 06 and 07 merge
cleanly. **05 conflicts with 03 in `scripts/test-failed-reads.mjs`**: both add checks to
the same harness. Resolve by keeping both sides' checks, then run 1.4. No other file
conflicted. Re-do the trial when 03, 04 and 05 are final.

1.2 Record the release SHA: `git rev-parse HEAD`. Call it `RELEASE_SHA`. Also record
`git diff --stat 77028454655e7b272d8c23987b54f445f9eba9f7 HEAD | tail -1` and check that
`git diff --name-only 7702845 HEAD` is exactly the union of the merged branches' own file
lists (`git diff --name-only 7702845 <branch SHA>` for each SHA recorded in 0.2). The only
hand edit allowed is the conflict resolution in `scripts/test-failed-reads.mjs`. That is
what A3 approved; anything else means stop.

1.3 Prove the release does not touch what it must not:

```
git diff --name-only 77028454655e7b272d8c23987b54f445f9eba9f7 HEAD -- src/components/home-page.tsx src/routes/__root.tsx src/server/listing-sync.server.ts src/server/sharetribe.server.ts src/lib/listing-slug.ts
git diff --name-only 77028454655e7b272d8c23987b54f445f9eba9f7 HEAD -- package-lock.json bun.lock bun.lockb
git diff 77028454655e7b272d8c23987b54f445f9eba9f7 HEAD -- package.json
```

The first two must print nothing. The third may only add the `test:unit` and
`test:failed-reads` scripts (that is all branches 01–05 change there today); no
dependency may change.

1.4 Local checks:

```
npm ci
node scripts/check-types.mjs
npm run test:unit
VITE_SUPABASE_URL=http://127.0.0.1:54399 VITE_SUPABASE_PUBLISHABLE_KEY=stub-anon-key VITE_SUPABASE_PROJECT_ID=stub NODE_OPTIONS=--max-old-space-size=3072 npm run build
npm run test:failed-reads
python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py --selftest
```

If `npm ci` refuses because the lockfile is out of step, stop: do not regenerate a
lockfile. The stub build is for the harness only; it is never shipped. EAST builds its own
`dist/` in step 2.

1.5 Push the branch (needs A2): `git push origin seo/release-2026-11`. EAST fetches it
anonymously in step 2.

**Gate 1:** 1.3 prints nothing; typecheck has no errors beyond the baseline; `test:unit`
0 failed; `test:failed-reads` 0 failed (write down the total; it must be at least 317,
the largest single-branch count); tracker selftest ALL PASS;
`git ls-remote origin seo/release-2026-11` equals `RELEASE_SHA`.

### Step 2. EAST deploy (needs A3)

Tooling: poolrentalnearme-web `ops/east/seo-release-2026-11/east_seo_release.py`, shipped
with `ops/east/seo-release-2026-11/ship.py` (it is too big for one SSM command;
`east_runx.py` would refuse it) from a machine with `PRNM_AWS_*`. Its `README.md` is the
authority for how to select a mode and for its exact gates; read it before running. The
script declares `RUNNER_TIMEOUT = 3600`. Start GO in the background and read the result
with `python3 ops/runners/east_runx.py --result <command-id>` (the last command id
`ship.py` prints is the run).

Pick a low-traffic window for GO: the swap and restart cost a few seconds of EAST pages,
and the build runs next to the live site and Chatwoot on a 3.8 GB box.

2.1 **PLAN** (read-only). It must show, and change nothing:

- the live stamp equals 7702845 and the five `dirtyFiles`;
- an anonymous `git fetch https://github.com/derekbowen/fresh-web-702e04c3.git seo/release-2026-11`
  works from EAST, and the fetched SHA equals `RELEASE_SHA` (fail closed if the fetch
  fails or the SHA differs; EAST has no GitHub credential);
- `git diff --name-only 7702845 RELEASE_SHA` lists none of the five EAST-only files;
- the sha256 of each of the five files on EAST, matching the pin file
  (`/home/ubuntu/fresh-web.east-only.sha256` by default, see section 0);
- free memory and disk, and that pm2 runs `fresh-web` as ubuntu with
  `PM2_HOME=/home/ubuntu/.pm2`;
- each five file's mtime against the live build's `builtAt`: a file changed after the
  live build is content production does not run, and GO refuses it;
- that the build can be memory-capped (systemd-run, cgroup v2), and the cap it would use.

2.2 **GO.** It must, in this order, and roll back automatically on any failure:

1. copy `dist/` to a backup and the five EAST-only files to a tar beside it (for a human;
   the tool never restores them), and pin the five by sha256;
2. move the checkout to `RELEASE_SHA` with the five files left byte-for-byte;
3. inside a memory-capped systemd scope (RAM cap = MemAvailable − 512 MB, plus at most
   1.5 GB swap), run the release's `ops/deploy-east.sh`: copy the tree to
   `/home/ubuntu/fresh-web.build`, typecheck and build **there** with
   `NODE_OPTIONS=--max-old-space-size=3072` (the live `dist/` is not touched);
4. check the stamp: `sha` = `RELEASE_SHA`, and `dirtyFiles` = exactly the five pinned files;
5. smoke the new build on `:3005` with `.env` (content, not just a 200);
6. carry the previous build's hashed assets into the new one, swap `dist/` by rename, then
   `sudo -u ubuntu PM2_HOME=/home/ubuntu/.pm2 pm2 restart fresh-web` (never as root, and
   **without `--update-env`**, so the process keeps exactly its environment and
   `dump.pm2` stays true), and prove the restart through pm2 (new pid/uptime);
7. live stamp = `RELEASE_SHA`; `verify:production`; `check:price-variants` with `.env`
   (a SKIPPED result is a failure); `check:production-drift`;
8. re-hash the five EAST-only files: unchanged; compare pm2's env variable names with
   preflight (names only).

No environment variable changes in this release and the restart does not merge any, so
no `pm2 save` is needed; step 3.4 checks that this held. If the build is killed inside
its memory cap, the deploy fails before step 6 and production is untouched; the
options are then more swap or a temporary resize for the build window (an owner decision).

**Gate 2:** GO exits OK with `RESULT: RELEASED` (not `RELEASED WITH WARNINGS`);
`curl -s https://www.poolrentalnearme.com/fw-assets/__build.json` shows `RELEASE_SHA` and
the five `dirtyFiles`. Record the build scope's memory peak that GO printed.

### Step 3. Post-deploy checks (read-only)

Wait 10 minutes after the restart before judging `/` or `/p/*`: Cloudflare can serve the
old answer for 600 s.

3.1 Tracker:

```
python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py
```

| Group | Expected now |
|---|---|
| regression | PASS (all) |
| F11 | `/p` and `/p/` end in a 404 without a loop: PASS. "`/p` answers 404 directly": still FAIL until step 5c. Junk slugs: PASS. Multi-hop stored redirects: still 10 (the underscore hops) until step 5d |
| F14 | `/p/affiliate`: PASS. The other three pages: FAIL until step 4a (they are database text) |
| F1, F7 | PASS |
| F4 | PASS except "no URL in two sitemaps": 5 until step 5e |
| F6a, F10 | PASS if A0 = "wait for seo/04"; otherwise still FAIL (not in this release) |

3.2 Marketplace paths, which WEST serves (prove the proxied paths still answer):

```
for p in /s /login /signup /wizard/ /l/your-private-paradise-the-ultimate-backyard-mini-resort/682f5447-1584-496c-bdfc-2d6e18a0fe72; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://www.poolrentalnearme.com$p"; sleep 1; done
```

Expect 200 for each (all five answered 200 on 2026-11-15). Also prove WEST still serves
the marketplace: the `assets/index-<hash>.js` marker on `/s` and `/login` (same command as
0.2b) equals the one recorded in 0.2b (EAST does not change it). The listing URL is the second
`<loc>` of `/sitemap-listings.xml` on that day; if it no longer answers 200, take any
`<loc>` from that sitemap.

3.3 Sitemaps:

```
curl -s https://www.poolrentalnearme.com/sitemap.xml | grep -c '<sitemap>'
curl -s -o /dev/null -w '%{http_code}\n' https://www.poolrentalnearme.com/sitemap-directory.xml
curl -s https://www.poolrentalnearme.com/sitemap-pages-comparisons.xml | grep -c '<loc>'
```

Expect: the index answers 200 with children; `sitemap-directory.xml` answers 410;
comparisons lists 1,091 URLs (less 78 if A0 = "wait for seo/04"; to confirm).

3.4 **pm2 environment still matches `dump.pm2`** (CLAUDE.md "EAST runtime env"; names
only, never values). Run on EAST through `east_runx.py`:

```python
import json, subprocess
j = subprocess.run("sudo -u ubuntu PM2_HOME=/home/ubuntu/.pm2 pm2 jlist", shell=True, capture_output=True, text=True).stdout
line = [l for l in j.split("\n") if l.startswith("[{")][-1]
live = set(next(p for p in json.loads(line) if p["name"] == "fresh-web")["pm2_env"].get("env", {}))
dump = set(next(p for p in json.load(open("/home/ubuntu/.pm2/dump.pm2")) if p["name"] == "fresh-web").get("env", {}))
print("live %d names, dump %d names; only live: %s; only dump: %s" % (len(live), len(dump), sorted(live - dump), sorted(dump - live)))
```

Expect the two "only" lists empty, as they are before step 2 (run it in step 0 too).

**Gate 3:** regression group PASS; 3.2 all 200 and markers unchanged; 3.3 as expected;
3.4 unchanged from step 0. If the regression group fails, run the EAST rollback now.

### Step 4. Database content repairs (each needs its own Yes)

**4a, 4b and 4c are not yet approvable** (section 3): their dry-run, apply, backup and
rollback files do not exist. They are listed so the owner sees what is coming. Each
returns as its own approval line, with the files, once they exist and have been reviewed.
Only 4d has its exact SQL today.

Common rules for 4a–4d:

- Every SQL session starts with `set transaction read only;` for the dry-run. Writes
  happen only in the apply step, in one transaction.
- Back up every row an apply step touches, first, into a table **outside the `public`
  schema** (the Supabase API exposes `public`). The apply aborts if the backup row count
  differs from the dry-run count.
- Rows whose text mentions insurance, liability, coverage, claims or damage are not edited
  (`NEEDS_DEREK`). They go to the owner with the page and the sentence (CLAUDE.md rule 8).
- Pages are cached for up to 600 s at the edge and sitemaps for 300 s in the app, so verify
  after 10 minutes.

| Step | Prepared files | Dry-run | Backup | Apply | Verify | Rollback |
|---|---|---|---|---|---|---|
| **4a** F14 fee statements (A4) | `fees/fee-corrections.csv` (present). `dry-run.sql`, `apply.sql`, `rollback.sql`, runbook: **pending** (folder `/home/user/fresh-web-seo-data/ops/seo-repairs-2026-11/`, branch `seo/02-content-repairs`, uncommitted) | pending | pending | `FIX` rows only | tracker `--only F14`: 4/4 PASS | pending (restore from backup) |
| **4b** F5 internal links (A5) | `links/link-mapping.csv`, `links/code-handoff.md` (present). SQL and runbook: **pending**. The `src/**` link changes are in no branch (see below) | pending | pending | `REWRITE` and `UNLINK` rows only, **excluding** every row inside an insurance, liability, coverage, claims or damage sentence | re-crawl the pages whose links come from the **database**: 0 database-sourced links to a 301 or 404 for the mapped targets. Links that come from code are out of scope (below) | pending |
| **4c** F8 public-pools data (A6) | `public-pools/duplicate-mapping.sql`, `count-consistency.sql`, CSVs (present, read-only SELECTs). Apply and rollback SQL: **pending** (`/home/user/fresh-web-seo-pp/ops/seo-repairs-2026-11/public-pools/`) | the two read-only SQL files | pending | pending | re-run `count-consistency.sql`: 0 cities where `pool_count` differs | pending |
| **4d** 24 duplicate city pages (A7) | `docs/seo-repairs-2026-11/intent.md` §6 (seo/05): APPLY and ROLLBACK SQL (present) | re-run the export and `node scripts/intent-report.mjs export.json --sql`; the 24 pairs must be unchanged | `create table <backup schema>.content_pages_city_dupes_<date> as select * from public.content_pages where template_type = 'host_acq_city' and slug in (<the 24 dup slugs of §6>);` must hold 24 rows | §6 APPLY | each dup URL 301s once to its keeper; the keeper answers 200; tracker F1/F7 PASS | §6 ROLLBACK |

**4b, what it cannot fix and what must change first** (measured from `link-mapping.csv`):

- The two biggest sources of old links are **code**, not database text:
  `/p/free-host-tools` (2,323 linking pages; `src/components/related-pages.tsx`,
  `src/components/templates/*`, `src/server/internal-links.functions.ts`) and the
  `/l/draft/00000000-…/new/details` CTA (4,182 linking pages; `src/components/templates/*`).
  Those `src/**` changes are in no branch, so they are not in `RELEASE_SHA`. They need
  their own fresh-web branch and a later EAST release; 4b's verify counts database links
  only.
- **9 `REWRITE` targets have rows inside insurance sentences** (`/faq`,
  `/guest_pool_safety_guidelines`, `/pool_safety_for_hosts`, `/community_guidelines`,
  `/make_money_renting_out_your_pool` (2 rows), `/p/trust-safety`,
  `/blog/pool-safety-guide`, `/guides/pool-safety-for-hosts`, and the
  `/p/why_pool_owners_are_such_fans_…` slug). Those rows are not edited by 4b; they go to
  the owner under D-h (CLAUDE.md rule 8).
- **2 `REWRITE` rows point at a redirect:** `https://poolrentalnearme.com/location/florida-fl`
  and `…/location/united-states/florida` → `/p/pool-rentals-florida`, which is itself a
  stored redirect (`tracking/data/redirect-slugs.txt`). The mapping's owner must point
  them at the final target before the file is final.

Before 4d: in Search Console, check which URL of each pair gets the impressions. Where
the bare URL is the one Google ranks, swap keeper and dup for that pair (intent.md §6).

**Gate 4 (per step):** verify passes; backup table row count recorded; regression group
PASS.

### Step 5. WEST (each line is its own Yes)

WEST rules (CLAUDE.md): `/home/ubuntu/build` is a loose copy, not a git checkout; patch it
with exact-anchor edits, then mirror into the repo and push after the flip. Builds are
memory-capped (`DOCKER_BUILDKIT=0 docker build --memory=2500m --memory-swap=2500m`, with
the rollback container stopped while building). Moving traffic is the upstream file swap
(`/etc/nginx/conf.d/main-web.conf`), then `nginx -t` and reload. Prove which container
serves by the `assets/index-<hash>.js` marker on `/s` or `/login`, never on `/`. The
retired MAIN is `docker rename`d and the new one renamed to `poolrentalnearme-production`.
nginx config is not in git: before and after each nginx change, save the changed
`location` blocks (no secrets) into poolrentalnearme-web.

**5a. pp-ssr capture, WEST PR #3 (A8). First, before any pp-ssr change.**

```
python3 ops/west/pp-ssr/preserve_pp_ssr.py            # plan only
python3 ops/west/pp-ssr/preserve_pp_ssr.py --selftest
python3 ops/west/pp-ssr/preserve_pp_ssr.py --go       # needs PRNM_AWS_*
```

Gate: the orphan branch `ops/pp-ssr-snapshot-<date>` exists, every sha256 hop matched, the
file count matched, the secret scan passed. Nothing serving traffic changed.

**5b. WEST release of PR #2 by the gated flip (A9).**

1. In the repo: `yarn test-server` and `yarn test-ssr-status` pass, and
   `node --test ops/west/robots/*.test.mjs` passes. If not green, do not build.
2. Step 0.4 showed no `error_page` that would replace a 503 on the marketplace locations.
3. Read, do not assume, where MAIN and the rollback container are:
   `docker ps --format '{{.Names}} {{.Image}} {{.Ports}}'` and
   `grep -n 127.0.0.1 /etc/nginx/conf.d/main-web.conf /home/ubuntu/main-web.conf /home/ubuntu/fallback-web.conf`.
   CLAUDE.md's ":4000 gate" is generic: in the latest record (poolrentalnearme-web
   `ops/west/c208/README.md`) **MAIN serves on :4000** and the rollback container is on
   :3000, so the gate ran on :3000. The gate always runs on the port MAIN is **not** on.
   Patch the build tree with the PR #2 files (exact-anchor edits, md5-gated as in c207 and
   c208). Build image `cNNN-seo-status` (next free number).
4. Gate on the port read in 3 (not MAIN's): every prior release's markers, promo math and payment endpoints, plus
   the PR #2 probes (`docs/OPS_RECORD_2026-11-15_seo-status-codes.md` §4):
   `/l/fargo-nd` → 404; `/l/some-pool/abc` → 404 "Page not found";
   `/l/some-pool/00000000-0000-0000-0000-000000000000` → 404; `/l` and `/l/` → 404, no
   `Location`; `/l/new` → 200; `/confirm` → 200 with `noindex, follow`; `/signup` → 200
   `index, follow`; `/login` → 200 `noindex, follow`; a live listing → 200, no
   `Retry-After`, no `X-Robots-Tag`; the same listing by `/l/<id>` → one 301.
5. Flip with a generated flip script on the pattern of the last one
   (`ops/west/c208/`: `flip_c208_block.sh`, `gate_c208_block.sh`, its precondition md5
   check, the restart policy on the gate, the automatic swap-back on abort and the index
   marker check after each move), regenerated for this release and tested the same way
   (`test_c208.py` runs the whole flip under `sh` against a simulated nginx, docker and
   curl). Not a hand-typed swap. Then mirror into the repo and push.

Rollback: copy back the upstream file that pointed at the port the previous MAIN (or the
rollback container) is on, as recorded in 3, over `/etc/nginx/conf.d/main-web.conf`;
`nginx -t`; reload; rename containers back.

**5c. nginx: `location = /p { return 404; }` (A10).** Removes the WEST 301 of bare `/p`
to `/p/`. EAST already answers both with 404 after step 2. Back up the config file named
by the `# configuration file` line above the `/p` match in step 0.4's output, add the
exact-match block, `sudo nginx -t && sudo systemctl reload nginx`.
Verify: `curl -s -o /dev/null -w '%{http_code}\n' https://www.poolrentalnearme.com/p` →
404, and tracker `--only F11` "`/p` answers 404 directly" → PASS. Rollback: restore the
backup, `nginx -t`, reload.

**5d. Underscore rewrite (A11, not yet approvable).** First locate it with step 0.4 (look
for a `rewrite` that matches `_`). What happens next depends on where it is:

- **nginx on WEST or EAST:** write the exact edit (the changed `location` block before and
  after, and the file from the `# configuration file` line) into the release record. That
  edit is what A11 is then asked for. It must give one hop per URL: either rewrite all
  underscores in one external redirect, or stop rewriting slugs that have their own stored
  redirect. Verify with the tracker `--only F11`: multi-hop stored redirects falls to 0.
  Rollback: restore the config backup.
- **Cloudflare** (owner reads Rules → Redirect Rules): the step ends here. A Cloudflare
  redirect change is outside this release (the owner's rule); it goes back to the owner
  as a separate decision.
- **EAST app code** (`grep -rn -E "replace\(/_/g|replaceAll\(['\"]_" /home/ubuntu/fresh-web/src`
  on EAST, read-only): the fix is a new fresh-web branch and a new EAST release with its
  own gate and approval, not A11.

**5e. Academy sitemap proxy (A12). Only after step 2 shipped seo/03.** Before that, the
EAST route emits 70 URLs and proxying would drop 137 healthy pages. Steps, from
`docs/seo-repairs-2026-11/academy-sitemap.md` (seo/03): remove the location that serves
the static academy file for `/sitemap-pages-academy.xml` so the path falls through to the
existing sitemap regex block that proxies to EAST; `nginx -t`; reload. Verify:
`curl -sI https://www.poolrentalnearme.com/sitemap-pages-academy.xml` shows
`content-type: application/xml; charset=utf-8` and the app's `cache-control`, and
`curl -s https://www.poolrentalnearme.com/sitemap-pages-academy.xml | grep -c '<loc>'`
prints 202. Keep `/var/www/prnm-tools/sitemap-academy-full.xml` on disk. Rollback: restore
the location.

**5g. nginx: bare `/l` (A17, not yet approvable).** WEST PR #2's record
(`docs/OPS_RECORD_2026-11-15_seo-status-codes.md` §7.1, on that branch) proposes an exact
`location = /l` that hands `/l` to the marketplace with the same proxy settings as the
existing `/l/` block, so `/l` answers the app's 404 directly instead of 301 → `/l/` → 404.
Its exact text depends on the `/l/` block on WEST (its `proxy_set_header` lines), which
step 0.4 shows. Once that block is written into the release record, A17 is asked. Verify:
`curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.poolrentalnearme.com/l`
→ `404` with no redirect. Rollback: restore the config backup.

**5f. robots.txt install (A15).** Follow `ops/west/robots/README.md` §7 (PR #2) exactly:
tests pass; the live file still hashes to `3fa2699d…773cca`; find the served file with
`nginx -T`; back up outside the web root; install; `nginx -t`; reload; verify at origin and
through Cloudflare (the edge can show the old file for 600 s). Rollback is the same swap
with the backup. Decisions D1–D4 of README §4 come first (A16).

### Step 6. F13 listing-sync cron on EAST (A13)

Disclosure (CLAUDE.md rule 4), to repeat in the message that installs it:

| | |
|---|---|
| Name | `prnm-listing-sync` (crontab of user ubuntu on EAST) |
| Schedule | `*/15 * * * *`: every 15 minutes |
| Runs | `/usr/bin/flock -n /home/ubuntu/locks/prnm-listing-sync.lock /home/ubuntu/bin/prnm-listing-sync.sh >> /home/ubuntu/logs/listing-sync.log 2>&1` |
| What that does | `POST http://127.0.0.1:3000/api/public/hooks/sync-listings` with the admin token read from `/home/ubuntu/fresh-web/.env` (never logged). The hook refreshes `synced_listings` from the Sharetribe Integration API and writes one `listing_sync_log` row per run. |
| Stop | `touch /home/ubuntu/locks/LISTING_SYNC_STOP` (each tick then logs `skip` and exits) |
| Remove | `sudo -u ubuntu crontab -l \| grep -v prnm-listing-sync \| sudo -u ubuntu crontab -` |

Before installing:

1. Confirm `RELEASE_SHA` contains the token fix (it was pushed in step 0.2):
   `git merge-base --is-ancestor f9b6d9b <RELEASE_SHA> && echo ok`. EAST's checkout of
   `RELEASE_SHA` is what step 6 installs from.
2. The hook's implementation is the EAST-only `src/server/listing-sync.server.ts`, which
   differs from the repo. Read it on EAST (read-only) and confirm it only writes
   `synced_listings` and `listing_sync_log`, and sends no email or SMS. **A13 is asked only
   after this has been confirmed and written into the release record.**
3. Confirm fresh-web listens on port 3000 on EAST (`sudo ss -ltnp | grep node`).

Install and verify: the commands in `ops/seo-repairs-2026-11/README.md` (seo/06), "Install
on EAST". After one tick: a new `listing_sync_log` row with `status='success'`, and
`staleness-check.sql` shows `last_ok` within 15 minutes.

4. **Reporting, every run** (CLAUDE.md rule 3: silence is how a runaway goes unnoticed).
   For as long as the job is installed, the operator sends the owner a daily summary of
   the previous 24 hours from `listing_sync_log` (read-only): runs, successes, failures,
   `skip` ticks (STOP file), and the latest `last_ok` from `staleness-check.sql`.
   96 runs a day are expected; fewer is reported as a fault. Clean days are reported too.
   Who sends it, and where, is named in the A13 line before it is asked.

Sunoblack: the marketplace leaves Sharetribe in December. Before the cutover the hook must
read from Sunoblack, or the job is stopped with the STOP file.

Why it matters for this release: renter pages (F1/F7) state pool counts from
`synced_listings`, last refreshed 2026-09-25.

### Step 7. Tracking after release

**A successful deploy is not an indexing result.** The tracker shows what the site does.
Only Search Console shows what Google did, and only weeks later. Do not report indexing
changes from a deploy, and do not request validation in Search Console before the fixes
are live.

7.1 Tracker runs (`python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py`; each run
writes `tracking/reports/<UTC date>/`; commit the reports):

| When | Why |
|---|---|
| D0, before step 2 | fresh baseline |
| D0, after steps 2, 4a–4d, 5b–5e | one run per step, `--only` the groups it changes plus `regression` (group names: `regression`, `F11`, `F6a`, `F14`, `F1F7`, `F4`, `F10`) |
| D+1 | caches have turned over |
| D+7, D+14, D+21, D+28, D+35, D+42 | weekly for at least six weeks (tracker README) |

D0 is the day of step 2. Write the real dates in the release record.

7.2 Search Console exports, per URL group. Take each at D-1 (before step 2), then D+14,
D+28 and D+42. Compare them with the tracker runs of the same dates.

| URL group | Export |
|---|---|
| All | Indexing → Pages, "All submitted pages" summary; the daily chart export; Sitemaps tab (submitted list, each child's status) |
| F3 `/p/*`, sitemaps | Pages → "Not found (404)" and "Server error (5xx)" |
| F11 `/p`, junk slugs, underscore redirects, `/l` | Pages → "Redirect error", "Page with redirect", "Soft 404" |
| F4 sitemaps | Sitemaps tab per child. Owner action: resubmit `/sitemap.xml`; remove `/sitemap-directory.xml` if it is still submitted |
| F1, F7 city pages (`/p/become-a-swimming-pool-host-*`, `/p/<city>-<st>`, bare `/p/<city>`) | Pages → "Crawled - currently not indexed", "Duplicate, Google chose different canonical than user"; Performance → Pages and Queries for the 25 + 25 sampled URLs (`tracking/data/sample-*.txt`) |
| 24 duplicate city pairs | Performance → Pages for both URLs of each pair, **before** step 4d |
| F6a comparisons (`-vs-pool-rental-near-me-in-`) | Pages → "Duplicate, Google chose different canonical than user", "Page with redirect" |
| F10 ccTLDs | The `.co.uk`, `.ca`, `.com.au` properties: Pages → "Alternate page with proper canonical tag", "Duplicate…"; Sitemaps → each `sitemap-country.xml` |
| F8 `/public-pools/*` | Pages → "Crawled - currently not indexed", "Duplicate…" |
| F9 `/l/*`, `/confirm` | Pages → "Soft 404", "Not found (404)", "Excluded by 'noindex' tag" |
| F12 robots.txt | Settings → robots.txt report (which version Google holds); Pages → "Blocked by robots.txt", "Indexed, though blocked by robots.txt" filtered to `/s?` (decision D1) |
| F14, F5 | none specific; "Page with redirect" and "Not found (404)" show whether our own links still feed them |

---

## 3. Approvals

One line, one decision. Nothing outside a Yes line is done. Lines marked **not yet
approvable** are not asked in this round (see the rule at the top): their exact content
does not exist yet. Each comes back as its own line, with its files, when it does.

| # | Decision | Yes / No | What it changes | Risk | Rollback |
|---|---|---|---|---|---|
| A0 | Scope: release **without** `seo/04-dupes-canonical` (F6a and F10 move to a later release), rather than wait for it. Yes = skip its merge line in 1.1. No = step 1 does not start until seo/04 exists, has been reviewed and is pushed (0.2), and A3 then includes it. | | What A3 deploys | Yes: the 78 duplicate comparisons and the ccTLD canonicals stay as they are for now | n/a |
| A1 | Cloudflare 5xx: having read step 0.3, accept that a 503 may be edge-cached for up to 600 s on cached paths, and go ahead with F3. **A precondition of A3:** F3 cannot be dropped (seo/02, 03 and 05 are built on it), so No = no EAST release until a separate Cloudflare decision. | | Nothing | A short database blip shows a cached 503 page for up to 10 minutes on the URLs hit during it | n/a |
| A2 | Push the branches of step 0.2 (seo/03, seo/05, seo/06 at f9b6d9b or later, seo/07 at c9fd110 or later, seo/04 if A0 = No), build `seo/release-2026-11` from the SHAs recorded in 0.2 and push it to GitHub | | GitHub only | none on production | delete the branch |
| A3 | Deploy `RELEASE_SHA` to EAST with the tooling (step 2). `RELEASE_SHA` is the merge of exactly the branch SHAs recorded in 0.2, with only the `scripts/test-failed-reads.mjs` conflict resolved by hand (step 1.2 checks this) | | Every EAST page: F3, F11, F14 code, F4, F1/F7 (and F6a, F10 if A0 = No). **Also the EAST deploy gate itself** (section 1, "EAST deploy gate"): pinned EAST-only files allowed, build in a copy, proven restarts, no `--update-env` | Medium: the largest change (79 files across branches 01–07 without 04, 50 of them under `src/`; recounted at step 1.2). During GO: (1) the build runs next to the live site and Chatwoot on a 3.8 GB box. It runs in a memory-capped scope (MemAvailable − 512 MB, plus up to 1.5 GB swap), so if it needs more it is killed inside the cap and production is untouched; it has never been run on this t3.medium, so it may fail that way, and the next step is then more swap or a temporary resize (owner). The box may still swap, slowing EAST pages and Chatwoot while it builds. (2) The live `dist/` is not touched by the build; the swap and restart cost a few seconds of EAST pages. Choose a low-traffic window. Every gate failure restores the previous build and proves the restart | Tooling ROLLBACK |
| A4 | **Not yet approvable.** Apply the `FIX` rows of the fee corrections (step 4a). Needs `dry-run.sql` + its output, `apply.sql`, the backup table name and `rollback.sql`, reviewed | | `content_pages` bodies | Low to medium (bulk text edit, 1,385 rows) | restore from the backup table |
| A5 | **Not yet approvable.** Apply the `REWRITE` and `UNLINK` rows of the link mapping (step 4b), without the 9 insurance-sentence targets, after the 2 redirect destinations are corrected. Needs the same files as A4 | | `content_pages` bodies | Low to medium | restore from the backup table |
| A6 | **Not yet approvable.** Apply the public-pools data fixes (step 4c). Needs apply and rollback SQL, dry-run output, backup table name | | `pp_pools`, `pp_cities` | Medium (merges records) | restore from the backup table |
| A7 | Redirect the 24 duplicate city pages to their keepers (step 4d) | | 24 rows: `status`, `redirect_to`, `in_sitemap` | Low; each is a 301 to a page already in the sitemap | §6 ROLLBACK SQL |
| A8 | Run the pp-ssr capture on WEST (step 5a) | | A new orphan branch in the public repo; two temporary files on WEST | Low; read-only on WEST; secret scan before push | delete the branch |
| A9 | Release WEST PR #2 by the gated flip (step 5b) | | Marketplace status codes for `/l/*`, `/l`, `/confirm` | Medium: marketplace routing | upstream file swap back |
| A10 | WEST nginx `location = /p { return 404; }` (step 5c) | | bare `/p` | Low | restore the config backup |
| A11 | **Not yet approvable.** Fix the underscore rewrite (step 5d), limited to **an nginx rewrite on WEST or EAST**, with the exact edit shown in the release record. If it is in Cloudflare, the step ends and it goes back to the owner outside this release; if it is in EAST code, it becomes a new branch and a new EAST release | | about 100 underscore URLs | Low to medium | restore the config backup |
| A12 | Proxy `/sitemap-pages-academy.xml` to EAST (step 5e), after A3 shipped seo/03 | | the academy sitemap on www | Low | restore the location |
| A13 | Install the F13 sync cron on EAST (step 6). **Asked only after step 6.2 has confirmed the hook writes only `synced_listings` and `listing_sync_log` and sends no email or SMS.** Includes the daily run report of step 6.4 (sender and channel named here) | | a new scheduled job every 15 min | Low; data only; STOP file | STOP file, then remove the line |
| A14 | Merge the fresh-web PRs (and branches 03–05) into `ops/deploy-sha-enforcement` after step 3 passes, so GitHub matches EAST | | GitHub only | none | revert |
| A15 | Install the proposed `robots.txt` on WEST (step 5f) | | crawl rules for every crawler on www | Low to medium (E5 changes rules for twelve crawlers) | swap back the backup |
| A16 | robots decisions D1–D4 (`ops/west/robots/README.md` §4): keep `Disallow: /s?*&page=`; welcome crawlers share the main group; keep `Crawl-Delay: 5`; do not block `/u/` | | what A15 installs | see README | n/a |
| A17 | **Not yet approvable.** WEST nginx `location = /l` (step 5g), with the exact block (copied from the box's `/l/` block) in the release record | | bare `/l` | Low | restore the config backup |

**Open decisions already known** (no step depends on them unless noted):

| # | Decision | Facts |
|---|---|---|
| D-a | Recruiter commission: lifetime or 2 years? | `/p/affiliate-program` says the 5% recruiter commission is **lifetime**; `/p/affiliate` says **2 years**. PR #3 changed neither. One must be corrected. |
| D-b | Competitor fee claims | About 1,650 pages state competitor fees (Giggster 19% on 1,134, Peerspace 20% on 524, Swimply 15% on the homepage). Not checked against the competitors' current terms (audit F14). Keep, verify, or remove. |
| D-c | WEST CI image audit: bun package cache | Either add `rm -rf /root/.bun/install/cache` after `bun install --production --frozen-lockfile` (Dockerfile line 44 in poolrentalnearme-web), or exclude the cache in `scripts/audit-image-secrets.sh`. Note: the WEST build tree uses its own Dockerfile, not the repo's (`ops/west/c208/README.md`), so this fixes CI, not production images. |
| D-d | fresh-web CI link audits | The three workflows crawl a Lovable preview URL that answers 403. Point `BASE_URL` at production, or disable them. |
| D-e | WEST PR #2 choices | A 403 `forbidden` on a listing → 404 (not observed live); an invalid listing → 404; `Retry-After: 120`; the six `/p/` pages that link `/l/<city-slug>` (record §6). |
| D-f | Sitemap choices (sitemaps.md, "Decisions left open") | list `/p/affiliate` after F14; `/p/jan` and `/p/la-saltwater-featured`; the 65 published `host_acq_city` rows with `in_sitemap = false`. |
| D-g | Search Console | resubmit `/sitemap.xml`; remove `/sitemap-directory.xml` if submitted (owner action, step 7). |
| D-h | Insurance text | The `NEEDS_DEREK` rows of 4a and 4b, the rows of the 9 `REWRITE` targets of 4b that sit inside insurance sentences, and three academy courses on insurance and claims already listed on www (untyped-pages.md). Owner only (rule 8). |
| D-i | F5 link fixes in code | `/p/free-host-tools` (2,323 pages) and the `/l/draft/…` CTA (4,182 pages) are linked from `src/**` (`links/code-handoff.md`). Needs its own fresh-web branch and a later EAST release; not in this one. |

---

## 4. Rollback summary

| Step | Rollback | Time | Leaves |
|---|---|---|---|
| 1 | delete `seo/release-2026-11` | seconds | nothing on production |
| 2 EAST | tooling ROLLBACK (shipped with `ship.py`): restore the previous `dist/` (from `dist-prev-deploy` if it is that build, else the backup) and the 7702845 checkout with the five EAST-only files unchanged, restart as ubuntu **with proof** (pm2: new pid/uptime; the live stamp alone cannot prove it), then check the live stamp is 7702845. A restart that fails or does not happen is `ROLLBACK INCOMPLETE`. (`ROLLBACK=1 ops/deploy-east.sh` restores `dist/` only, also with a proven restart.) | about 1 min | production on 7702845 |
| 4a–4c | restore the touched rows from the backup table, in one transaction; verify row counts | minutes | the data as it was |
| 4d | intent.md §6 ROLLBACK SQL | seconds | 24 pages published again |
| F15 (applied) | `related-links-job/rollback.sql` (seo/06) | seconds | old functions; links already written stay |
| 5a | none needed; delete the snapshot branch if wanted | seconds | |
| 5b | upstream file swap back, `nginx -t`, reload; rename containers back | seconds | previous MAIN |
| 5c, 5d (nginx only), 5e, 5g | restore the nginx config backup, `nginx -t`, reload | seconds | |
| 5f | swap back the robots backup (README §7); the edge holds it up to 600 s; Google caches robots.txt up to 24 h | seconds (edge 10 min) | |
| 6 | `touch /home/ubuntu/locks/LISTING_SYNC_STOP`, then remove the cron line | seconds | mirror keeps its last state |

## What to watch in the first 24 hours

- **EAST health:** `pm2 status` (restarts, memory) and the error log; the live stamp still
  shows `RELEASE_SHA`. The build is memory-capped, but the box can still swap while it
  runs: check that Chatwoot's four containers are up and the live fresh-web did not
  restart unexpectedly during step 2 (`docker ps`, pm2 restart count), and compare the
  build peak GO printed with the cap.
- **503 rate:** each 503 now means a failed database read. A steady stream means Supabase
  is unhealthy, not that the fix is wrong. Check `cf-cache-status` on any 503 seen (step 0.3).
- **`content_404_log`:** new rows per hour should not rise; live pages must not appear in it.
- **WEST timing log:** 5xx count on `/`, `/p/*`, `/s`, `/l/*`, `/login`, `/wizard/`.
- **Tracker regression group** at D0 and D+1: all PASS.
- **Sitemaps:** the index and every child answer 200 (`/sitemap-directory.xml` 410); no
  child is empty.
- **Marketplace:** `/s`, a listing, `/login`, `/signup`, `/wizard/` answer 200;
  `check:price-variants` passes.
- **If step 6 ran:** one `listing_sync_log` row per 15 minutes, all `success`; the log file
  shows `ok` lines. Report every run's outcome, including clean ones.
- **Search Console:** Sitemaps tab shows no "Couldn't fetch" for the index. Nothing else
  there is meaningful in 24 hours.
