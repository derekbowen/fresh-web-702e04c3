# RUNBOOK: F5 internal links + F14 fee statements, database change

**Status: built and tested locally (PostgreSQL 16, 94 checks). Not applied. Not dry-run on production, because the
database tool was down on 2026-11-16 (see `PENDING-READS.md`). Apply only after Derek's explicit GO for this change,
given on a reviewed production dry run (section 3).**

Revised by the review of 2026-11-16: every field is now guarded by its md5 (link fields included), rule ids no longer
depend on CSV row order, the insurance guard works per paragraph / list item, re-runs log only real skips, rollback can
be limited to one run and works when apply never ran, and `verify.sql` detects a writer putting old text back. The CSVs
were corrected too (`fees/review-2026-11-16-changes.csv`, `links/review-2026-11-16-changes.csv`).

## 0. Decisions Derek makes before GO

1. **The field guard's reference point.** The task rule is "guard every field by its old value from the snapshot". The
   saved extracts of 2026-11-15 hold fee *sentences* and link *counts*, not whole field values, so a whole-field md5
   cannot come from that snapshot. This change therefore pins every field (link and fee) in one read-only pin read
   (P1), shows the result of exactly those pins in the dry run, and applies only fields still equal to them. On top of
   that, every fee sentence must still match the 2026-11-15 text byte for byte, and every link rule's count must be
   within tolerance of the 2026-11-15 count. Derek accepts "pinned at the reviewed P1 read" as the reference, or asks
   for a different one.
2. **`updated_at`.** The tables' triggers set `updated_at = now()` on every changed row (about 6,500 `content_pages`
   rows). What reads it: the `.co.uk` / `.ca` / `.com.au` country sitemaps (`src/routes/sitemap-country[.]xml.ts:43-51`,
   used as `lastmod`), JSON-LD `dateModified` and `article:modified_time` (`src/routes/p.$slug.tsx`), and visible
   "updated" dates in some templates (`advocacy.tsx`, `pool-maintenance.tsx`). These pages would be advertised as
   freshly modified for link-only edits, the pattern `src/lib/sitemap.ts:158-162` records from the 2026-09-01 incident.
   The main sitemaps use `content_refreshed_at`, which this change does not set, so the real fee corrections are not
   advertised there. The backup table keeps each row's `updated_at` from before the change (`old_updated_at`), but
   rollback cannot put it back (the same trigger fires). Options: accept the bump; switch the country sitemap to
   `content_refreshed_at` first (code, `code-handoff.md` §1); set `content_refreshed_at` on fee-corrected rows only
   (not built). Nothing for this is built into the package.
3. **Unverified fee rows.** 995 of the 2,724 fee rules have `verified = PENDING` (28 of them added by the review).
   Apply re-checks the same condition (old text present exactly once) and skips failures. `--verified-only` leaves
   them out (1,729 rules), which is the strict reading of fees/README §6.

## 1. What the change does

It edits page text in `content_pages` and `blog_posts`. No schema change to those tables, no code, no deploy.

1. **Fee statements (audit F14).** 2,724 corrections on 2,334 fields of 1,547 pages: the `FIX` rows of
   `fees/fee-corrections.csv`. Each replaces one exact sentence fragment with its reviewed correction.

   | Column | Fields |
   |---|---|
   | `content_pages.body_markdown` | 1,166 |
   | `content_pages.content` | 732 |
   | `content_pages.description` | 414 |
   | `content_pages.seo_description` | 13 |
   | `content_pages.seo_title` | 8 |
   | `content_pages.og_description` | 1 |

   The review of 2026-11-16 held 147 former FIX rows for Derek, qualified 264 new texts as the *host* fee
   ("0% para anfitriones", "Host fees (0%)"), completed two metadata strings, and added 31 rows (28 FIX: stale
   "$90 of every $100" figures and dependent arithmetic; 3 NEEDS_DEREK). Details: `fees/README.md` §7.

2. **Internal links (audit F5).** 514 link rules (REWRITE 393, UNLINK 121) from `links/link-mapping.csv`, for targets
   that at least one database field holds. 15,030 fields held one of these targets on 2026-11-15 ~22:04 UTC
   (`content` 13,609, `body_markdown` 1,346, `blog_posts.content` 75). Largest: `/host_help` -> `/p/host-help` 2,162;
   `/faq` -> `/p/faq` 2,134; `/guest_pool_safety_guidelines` 2,108; `/pool_safety_for_hosts` 2,107;
   `/community_guidelines` 2,095; `/make_money_renting_out_your_pool` 2,087; `/p/free-host-tools` ->
   `/p/pool-host-tools` 1,077.
   - **REWRITE**: the link points at its live destination instead.
   - **UNLINK**: the target is gone and nothing replaces it; the anchor text stays, the link markup goes.

**How links are matched**
- Only in a link context: markdown `](url)`, `](url "title")`, `](<url>)`; HTML `href=` with `"`, `'` or `\"`.
- Relative, `https://www.` and non-www forms, optional trailing slash, any host letter case. `?query` and `#fragment`
  are kept. The URL must end there: longer URLs, other domains and plain prose are never touched.

**Safety**
- **One transaction.** Any error or failed guard rolls back everything, including creation of the log tables.
- **Preflight.** Every target column exists and is text; `id` is `uuid`; `slug` and `updated_at` exist.
- **Field guard (every field).** A field is changed only when its md5 equals its pin from the reviewed P1 read. A field
  changed after that read, or created after it, is skipped and logged ("field changed since the reviewed pin read",
  "field was not in the reviewed pin read"). A field whose current md5 is the last md5 an earlier run of this change
  wrote is recognised as already applied and passed over without a log row.
- **Fee guard.** On top of the field guard: the embedded `old_text` arrived intact (md5) and occurs exactly once.
- **Count guard.** Before anything is written: per link rule, fields holding the target now (pin-matching ones it
  will change + insurance-guarded ones) + fields an earlier run changed must be within **2 + 5%** of the 2026-11-15
  count; all fee rules together within **2 + 2%** of 2,724. A failure aborts the run and names the rules. Many fields
  changed after the pin read also make it abort, rather than apply a thin remainder.
- **Insurance guard.** A link is not changed (href included) when its paragraph or list item mentions insurance,
  liability, coverage, "covered", claims, damage, waiver, injury, indemnity, or the Spanish seguro / responsabilidad /
  cobertura / reclamo / daño / lesión. A paragraph is one line, cut further at HTML block tags (`p`, `li`, `div`, `br`,
  headings, table cells), so "e.g." or "vs." can no longer split a link away from "Liability coverage", and a link in
  its own `<li>` is not swept in by a neighbouring item. When a field holds such an occurrence, that rule leaves the
  whole field alone and logs it as pending Derek. The dry run lists every such field. The older sentence-level check
  found 13 such rows on 2026-11-15; the paragraph-level check will find more, by design, and the count guard counts
  them as present, so the guard result does not depend on this classification.
- **Row locks and guarded writes.** `select ... for update`, then `update ... where id = ? and md5(col) = <value read>`.
- **Backup.** Before a field is first changed, its full old value and the row's `updated_at` from before this run go
  into `public.seo_repair_backup_20261115` (one row per field and old value, never overwritten).
- **Logs.** `seo_repair_change_log` (run, rule, table, row, slug, column, old md5, new md5, occurrences),
  `seo_repair_skip_log` (reason per skipped rule and field), `seo_repair_rollback_log`. All four tables have row level
  security on and no `anon` / `authenticated` access.
- **Re-runs.** A second run changes nothing and writes no change-log or backup rows. It does not log already-applied
  fields (the totals line counts them); it logs again only the real skips of that run (insurance-guarded fields,
  fields changed after or created after the pin read).
- **Rule ids** are content-derived: `F5-<md5(form|path)[:10]>`, `F14-<md5(table|row|column|old_text)[:10]>`. A later
  package built from re-sorted or extended CSVs keeps the same id for the same rule, so the "already applied" counts
  and the logs stay attached to the right rule.

## 2. Files

| File | What it is |
|---|---|
| `generate.py` | Builds everything below from the two CSVs (and, with `--pins`, the P1 pins). Standard library only; byte-for-byte reproducible (the test checks it). |
| `apply.sql` | One transaction: preflight, log tables, rules, pins, count guard, field guard, backup, apply, log, summary. **The checked-in copy has no pins and refuses to run.** |
| `dry-run.sql` | Read-only. Pin-set digest, preflight, triggers, every link rule's counts and verdict, the fields left for Derek by the insurance guard, the fields the field guard will skip, fee status. |
| `rollback.sql` | One transaction. Restores a field only where its current md5 is the md5 the run wrote last. Optional `-v only_run=<run_id>`. |
| `verify.sql` | Read-only. Repaired fields whose value is no longer what the repair wrote (expect 0 rows), and totals. |
| `pending/p1_fee_field_pins_0[1-5].sql`, `pending/p1_link_field_pins_0[1-8].sql` | Read-only P1 pin reads (fee fields; link fields sharded by row id). |
| `pending/p2_page_writers.sql`, `pending/p3_f13_exact_lines.sql` | Read-only P2 (scheduled page writers) and P3 (exact text of crawl-only fee sentences). |
| `code-handoff.md` | Code changes this package depends on or exposes: country-sitemap `lastmod`, unguarded page writers. |
| `rules-manifest.csv` | Every rule: id, source CSV row, target or slug, column, expected fields present, tolerance, snapshot counts. |
| `excluded-pending-derek.csv` | Every CSV row that is not applied, and why (section 6). |
| `test/test.sh`, `test/test_repair.py`, `test/fixture-schema.sql` | Local test on a throwaway PostgreSQL 16 cluster. |
| `test-output.txt`, `dry-run-local-fixture.txt` | Last local test run, and the dry run on the **fixture** (format only; not production numbers). |

## 3. Apply: exact command sequence

From `ops/seo-repairs-2026-11/db-change/` at this commit, with PostgreSQL 16's `psql`, over the **direct (session)
connection**. `$DB` lives in the environment only, never in a file.

```bash
# 0. Preconditions
#    - Derek has decided section 0.
#    - Run P2 (read-only) and pause every page writer it shows, plus these HTTP hooks wherever a scheduler calls them
#      (crontabs on EAST/WEST, uptime pingers): /api/public/hooks/link-auto-fix, seo-fix-worker, gen-host-pages,
#      host-city-tail-fix, blog-autogen, alias-backfill. The migrations also schedule pg_cron
#      'auto-generate-content-batch' every 5 minutes. Nobody uses the admin SEO bulk tools during the window. Avoid
#      03:00 UTC on the 1st of a month (related-slugs refresh).
#    Why: a writer that read a page before apply commits and writes after it puts the old text back (lost update; e.g.
#    link-auto-fix writes body_markdown by id with no old-value guard, src/server/link-auto-fix.server.ts:136; the
#    reviewer reproduced this locally). API and admin writes to a row apply has locked wait for the lock and can hit
#    their 8 s statement timeout. Readers are not blocked.
psql "$DB" -X -1 -v ON_ERROR_STOP=1 -f pending/p2_page_writers.sql

# 1. Local test must pass on this machine (starts and removes its own cluster).
bash test/test.sh

# 2. Pin read P1 (read-only): every fee field and every field holding a link-rule target.
mkdir -p pins
for f in pending/p1_*_pins_*.sql; do
  psql "$DB" -X -q -A -t -F "$(printf '\t')" -1 -f "$f" > "pins/$(basename "$f" .sql).tsv"
done
cat pins/p1_fee_*.tsv | wc -l     # expect 2334 (one per fee field)
cat pins/p1_link_*.tsv | wc -l    # expect about 15,000 (fields holding a link-rule target)

# 3. Build the pinned scripts (the repo copies stay unpinned). Add --verified-only for the strict 1,729-rule fee set.
python3 generate.py --pins pins/ --out build/

# 4. Dry run (read-only) with the same pins. This output is what Derek reviews.
psql "$DB" -X -1 -v ON_ERROR_STOP=1 -f build/dry-run.sql > dry-run-$(date -u +%F).txt
#   - pin_set_sha256: note it; build/apply.sql's header must show the same digest
#   - preflight: columns text, ids uuid, updated_at present; no trigger beyond updated_at / related-slugs / 404 resolver
#   - every link verdict 'ok'; read "link fields left alone for Derek" and "link fields the field guard will skip"
#   - fee summary: read every row in "fee rules that would not apply today"

# 5. Derek's GO on that dry run. Apply build/apply.sql built from the SAME pins. Do not re-read the pins: a new pin
#    read is a new dry run and a new review. Fields changed since the pin read are skipped and logged, never applied.
grep -m1 'pin set sha256' build/apply.sql
psql "$DB" -X -v ON_ERROR_STOP=1 -f build/apply.sql > apply-$(date -u +%FT%H%MZ).log 2>&1; echo "exit $?"
#   exit 0: committed; the log ends with the per-rule summary, totals (with fields already applied and fields the
#   field guard skipped) and skip reasons.  Non-zero: nothing changed; read the error.

# 6. Right after apply, about an hour later, and the next day (after nightly jobs): verify (read-only).
psql "$DB" -X -1 -v ON_ERROR_STOP=1 -f build/verify.sql > verify-$(date -u +%FT%H%MZ).txt
#   expect 0 rows in the first section. A row means something changed a repaired field afterwards; if it put the old
#   link or fee text back, find that writer before resuming it.
# 7. Resume the writers paused in step 0.
```

Runtime: tens of seconds to a few minutes (the reviewer's local benchmark of 6,700 synthetic rows took 33 s; rows stay
locked for the last part of it). The script sets `statement_timeout` 60 min and `lock_timeout` 15 s for itself only.

## 4. Verify afterwards

`build/verify.sql` (step 6), then re-run `build/dry-run.sql`: every link rule should show `would_change` 0 and
`already_applied` near its expected count (minus insurance-guarded fields); applied fee rules show "old_text absent".

Read-only SQL (`psql "$DB" -X -1`):

```sql
set transaction read only;
select run_id, count(*) as changes, count(distinct (table_name, row_id, column_name)) as fields,
       min(applied_at), max(applied_at)
from public.seo_repair_change_log group by run_id order by 4;
select reason, count(*) from public.seo_repair_skip_log group by reason order by 2 desc;
select count(*) from public.content_pages
where content like '%After accounting for the 10\% service fee%' or body_markdown like '%After accounting for the 10\% service fee%'
   or body_markdown like '%our 10\% booking fee built into%' or body_markdown like '%Platform fee (10\% of pool rental, paid by host)%';
```

URLs (at most 2 requests per second, normal browser User-Agent; a page cache may serve old text for a while; do not
purge caches as part of this change). Baseline checked live on 2026-11-16 by the builder:

| URL | Before (live 2026-11-16) | After |
|---|---|---|
| `/p/become-a-swimming-pool-host-saratoga-springs-ny` | "10% service fee, a Saratoga host can walk away with nearly $10,000" | "With a 0% host fee, a Saratoga host keeps the full $10,800." |
| `/p/swim-instructor-pool-rental-fair-oaks-ranch-tx` | "our 10% booking fee built into the host's price" | "Your pool rental cost: $69 ($60 hourly rate plus the 15% guest booking fee added at checkout; the host pays 0%)." |
| `/p/swim-instructor-pool-rental-mount-vernon-va` | "Platform fee (10% of pool rental, paid by host)" | "Booking fee (15% of pool rental, paid by you at checkout): $3.75 (15% of $25). The host pays a 0% fee." |
| `/p/become-a-swimming-pool-host-conway-sc` | links `/host_help` (404) | links `/p/host-help` (200) |
| `/p/become-a-swimming-pool-host-monroe-mi` | links `/faq` (404) | links `/p/faq` (200) |
| `/p/become-a-swimming-pool-host-addison-tx` | links `https://poolrentalnearme.com/p/hosting` | links `/p/hosting` |
| `/p/franklin` | links `/b/backyard-design-tips` (404) | anchor text only, no link |

Still live after this change, by design: `/p/free-host-tools` links added at render time
(`src/server/internal-links.functions.ts`, `links/code-handoff.md`); the `/p/affiliate` 10% copy and the
`host-acq-city.tsx:367` "$180 on $200" cell, which are code (`fees/code-handoff.md` §1 and §0).

## 5. Roll back

```bash
psql "$DB" -X -v ON_ERROR_STOP=1 -f rollback.sql > rollback-$(date -u +%FT%H%MZ).log 2>&1; echo "exit $?"
# one run only (run ids are in seo_repair_change_log.run_id and in the apply log):
psql "$DB" -X -v ON_ERROR_STOP=1 -v only_run=apply-YYYYMMDDTHHMMSSZ-<txid> -f rollback.sql > rollback-<ts>.log 2>&1
```

A field is restored from the backup only when its current md5 equals the md5 the (selected) run wrote last and its
change chain is unbroken. A field a person or a later run changed afterwards is skipped and reported, never
overwritten. Running it again is harmless. On a database where apply never committed it says so and exits 0.
`updated_at` is not restored (the trigger fires on the restore too); the pre-change value is in `old_updated_at`.
Leave the four `seo_repair_*` tables in place as the audit trail. To restore a skipped field by hand, use `old_value`
from the backup, matched on table, row, column and the first `old_md5` of that field in the change log.

## 6. Excluded, pending Derek (not applied)

All listed in `excluded-pending-derek.csv`.

**Fee rows: 767 `NEEDS_DEREK` on 418 pages**

| Category | Rows | What it is |
|---|---|---|
| DIFF | 272 | Competitor rate minus the old 10% |
| SWIM | 175 | Swim-instructor cost models (the two seed pages are fixed) |
| PARTIAL | 103 | Review 2026-11-16: FIX rows in a page body that keeps a held sentence stating 10%/90%; applied alone they would make the page contradict itself |
| INS | 78 | Touches insurance, liability, coverage, claims or damage; untouched by rule |
| COVERS | 42 | Says what the (non-existent) host fee, or a 5% guest fee, covers |
| ARITH | 31 | Figures depend on the wrong fee but the gross is not on the page, or the page disagrees with itself |
| TOTAL | 22 | Review 2026-11-16: a 0% stated against the booking total or host-plus-guest charges (guests pay 15%), or "you keep 100% of what guests pay" |
| FUTURE | 17 | "0% through 2026", a later 10%, or (review 2026-11-16, 8 rows) new text promising the 0% host fee is permanent ("locked-in", "inamovible", "inalterable", "jamás") |
| INS_ADJ | 14 | Review 2026-11-16: the FIX sentence is the antecedent of, or sits beside, an insurance or coverage sentence |
| AMBIG | 12 | Unclear who pays, or which figure is PRNM's |
| LEGAL | 1 | Hand-flagged in run 2 |

Also not applied for fees: competitor figures (fees/README §4); 223 crawl-only candidates with no database text yet
(fees/PENDING-READS Q3, and P3 here for the 8 added by the review); the injected "…you keep 100% of your rate in 2026"
sentence; a possibly invented testimonial (fees/README §5).

**Link targets: 482 `NEEDS_DEREK`**, including 51 insurance/liability-subject URLs, renter-city links whose redirect or
proposed destination is a host-recruitment page (the review moved 48 more here: 47 "guest city page" rows whose
`/p/<city>` destination renders the host-acq-city template, 37 of them linked only from that same page, plus
`/p/il-aurora`), generic-hub redirects, Peerspace/Giggster comparison links and `/help-center`.

**Link targets: 173 code- or render-only** (no database field holds them), among them `/p/terms-of-service` (1,091
linking pages) and `/p/privatepoolrentalssandiego` (126): `links/code-handoff.md`.

**Not touched:** `content_pages.related_slugs`; `raw_html` links (scrape archive). The three `raw_html` fee rows are now
held (INS_ADJ).

**Skipped at apply time and logged:** insurance-guarded link fields; image or nested links UNLINK cannot unwrap; fee
anchors not present exactly once; fields changed after, or created after, the reviewed pin read.

## 7. Numbers and dates

| Figure | Source and snapshot |
|---|---|
| Fee anchors | Production extracts 2026-11-15: ~17:30 UTC (run 1), 22:08 UTC (run 2), 01:03–01:18 UTC (audit lines). 1,729 rules verified unique on 2026-11-15 at 23:46/23:49 UTC; 995 pending, 28 of them added by the review from the 01:03–01:18 UTC and 22:09 UTC line extracts. |
| Link expected counts | Database recount 2026-11-15 ~22:04 UTC: content + body_markdown + blog_posts fields per target. |
| Live checks | 2026-11-16 (builder): `/p/pool-host-tools`, `/p/host-help`, `/p/faq`, `/p/community-guidelines`, `/p/guest-pool-safety-guidelines`, `/p/pool-safety-for-hosts`, `/p/hosting` answer 200; `/p/free-host-tools` 301s to `/p/pool-host-tools`; `/host_help` and `/faq` 404; the three seed fee sentences are live. 2026-11-16 (review): the 10 new link destinations and the 2 corrected ones answer 200, self-canonical, no robots meta; `/p/dover`, `/p/chesapeake`, `/p/madison`, `/p/new-york-ny` render the host-acq-city template and `/p/riverside` a guest page; `/p/dover` and `/p/madison` show "$180" on $200; the `/p/pool-rental-near-me-the-airbnb-of-pools` description ends "with a low 10% ". |
| Production dry run | **Not run** (P0). |
| Column types | From `supabase/migrations`; confirmed by the dry-run preflight. |
