# RUNBOOK: F5 internal links + F14 fee statements, database change

**Status: built and tested locally. Not applied. Not dry-run on production, because the database tool was down on
2026-11-16 (see `PENDING-READS.md`). Apply only after Derek's explicit GO for this change.**

## 1. What the change does

It edits page text in two tables, `content_pages` and `blog_posts`. Nothing else changes: no schema change to those
tables, no code, no deploy.

1. **Fee statements (audit F14).** It applies 2,843 corrections to 2,416 fields on about 1,580 pages. These are the
   `FIX` rows of `fees/fee-corrections.csv`. Each one replaces one exact sentence fragment with its reviewed
   correction. Examples: "After accounting for the 10% service fee, a Saratoga host can walk away with nearly $10,000"
   becomes "With a 0% host fee, a Saratoga host keeps the full $10,800". The swim-instructor worked examples become 15%
   guest booking fee and 0% host fee.

   | Column | Fields |
   |---|---|
   | `content_pages.body_markdown` | 1,424 |
   | `content_pages.content` | 980 |
   | `content_pages.description` | 414 |
   | `content_pages.seo_description` | 13 |
   | `content_pages.seo_title` | 8 |
   | `content_pages.raw_html` | 3 |
   | `content_pages.og_description` | 1 |

2. **Internal links (audit F5).** It applies 562 link rules, built from the `REWRITE` and `UNLINK` rows of
   `links/link-mapping.csv` that have at least one database row. About 15,110 fields are expected to change (snapshot
   2026-11-15 ~22:04 UTC): `content_pages.content` 13,657, `body_markdown` 1,391, `blog_posts.content` 75.
   - **REWRITE** (428 rules): an old link that redirects or 404s now points at its live destination. For example,
     `/host_help` becomes `/p/host-help` (2,162 fields), `/faq` becomes `/p/faq` (2,133), and `/p/free-host-tools`
     becomes `/p/pool-host-tools` (1,074). It also covers 131 non-www absolute URLs such as
     `https://poolrentalnearme.com/p/hosting`, which become `/p/hosting`.
   - **UNLINK** (134 rules): the target is gone and nothing replaces it. The anchor text stays and only the link
     markup is removed: markdown `[text](url)` becomes `text`, and `<a ...>text</a>` becomes `text`.

**How links are matched**
- A link is changed only in a link context:
  - markdown `](url)`, `](url "title")` or `](<url>)`;
  - an HTML `href=` with `"`, `'` or `\"` quotes.
- It is matched in relative, `https://www.` and `https://` non-www form, with or without a trailing slash, and with the
  host in any letter case.
- The URL must end right there. `/p/free-host-tools-extra`, `/p/free-host-tools/sub`, `.html` variants and other
  domains are never touched.
- `?query` and `#fragment` are kept.
- Plain text that merely mentions a URL is not touched.
- These are exactly the link forms the 2026-11-15 counts measured, so the expected counts and the live counts measure
  the same thing.

**Safety**
- **One transaction.** Any error or failed guard rolls back everything, including creation of the log tables.
- **Preflight.** Every target column must exist and be text, and both `id` columns must be `uuid`.
- **Count guard.** Before anything is written, each link rule's "fields it would change now", plus fields an earlier
  run already changed, must be within **2 + 5%** of the expected count. All fee rules together must be within
  **2 + 2%** of 2,843. Otherwise the run aborts and lists the offending rules, so a stale script cannot run blind.
- **Fee guard.** A fee rule changes its field only when:
  - the field's md5 equals the pin read just before apply (P1);
  - its `old_text` arrived intact (md5 check);
  - its `old_text` occurs exactly once in the field.

  A field edited since the pin is skipped and logged, never overwritten.
- **Row locks and guarded writes.** Each field is locked (`select ... for update`) and written with
  `... where id = ? and md5(col) = <value just read>`.
- **Backup.** Before a field is first changed, its full old value goes into `public.seo_repair_backup_20261115`. That
  table has one row per field and old value, inserted with `on conflict do nothing`, so it is never overwritten.
- **Change log.** Every change is logged in `public.seo_repair_change_log`: run, rule, table, row, slug, column, old
  md5, new md5 and occurrences.
- **Skip log.** Skips go to `public.seo_repair_skip_log` with a reason.
- **Access.** All four new tables have row level security on, and `anon`/`authenticated` have no access, which is the
  2026-05 backup-table convention.
- **Insurance.** A link inside a sentence that mentions insurance, liability, coverage, claims or damage is **not**
  changed. When a field holds such an occurrence, that rule leaves the whole field alone. It is logged as pending
  Derek. There were 13 such rows at the snapshot. This is stricter than
  `links/README.md`, which allowed an href-only change there.
- **Unsupported link forms.** An image link (`![..](url)`), or a link nested in a way UNLINK cannot unwrap, is left
  alone and logged.
- **Second run.** A second run finds nothing to change, writes no backup and passes the guard by counting what the
  first run already did.
- **Triggers.** Updates fire the tables' `updated_at` trigger, so `updated_at` moves to the apply time. Rollback does
  not restore `updated_at`.

## 2. Files

| File | What it is |
|---|---|
| `generate.py` | Builds everything below from the two CSVs. Python standard library only; output is byte-for-byte reproducible (the test checks this). |
| `apply.sql` | One transaction: preflight, log tables, rules, count guard, backup, apply, log, per-rule summary. **The checked-in copy has no md5 pins and refuses to run.** Build the runnable one with P1 (step 3.2). |
| `dry-run.sql` | Read-only. Preflight (column types, triggers), every link rule's count today with the guard verdict, and fee-rule status. |
| `rollback.sql` | One transaction. Restores each changed field from the backup only where its current md5 equals the md5 apply wrote. Skips and reports the rest. |
| `pending/p1_fee_field_pins_0[1-5].sql` | Read-only. md5 of every field a fee rule changes. |
| `rules-manifest.csv` | Every rule: id, source CSV row, target or slug, column, expected count, tolerance, snapshot counts. |
| `excluded-pending-derek.csv` | Every CSV row that is **not** applied, and why (section 6). |
| `test/test.sh`, `test/test_repair.py`, `test/fixture-schema.sql` | Local test on a throwaway PostgreSQL 16 cluster. |
| `test-output.txt` | Output of the last local test run. |
| `dry-run-local-fixture.txt` | The dry-run run on the **fixture** database. It shows the format only; its numbers are not production numbers. |

## 3. Apply: exact command sequence

Run from `ops/seo-repairs-2026-11/db-change/` at this commit, with PostgreSQL 16's `psql`. Use the **direct (session)
connection** to the Supabase database, not the transaction pooler. `$DB` is that connection string. Keep it in the
environment only; never write it into a file in this repo.

```bash
# 0. Preconditions: Derek's explicit GO for this change; nobody bulk-editing pages right now.

# 1. Local test must pass on this machine (starts and removes its own cluster).
bash test/test.sh

# 2. Pins: read-only, minutes before applying.
mkdir -p pins
for i in 01 02 03 04 05; do
  psql "$DB" -X -q -A -t -F "$(printf '\t')" -1 -f pending/p1_fee_field_pins_$i.sql > pins/field-pins-$i.tsv
done
cat pins/*.tsv | wc -l            # expect 2416

# 3. Build the pinned scripts (the repo copies stay unpinned).
python3 generate.py --fee-pins pins/ --out build/
#   Strict reading of fees/README section 6 (only rows already verified YES):
#   add --verified-only (1,857 fee rules instead of 2,843).

# 4. Dry run (read-only). Read it before going on.
psql "$DB" -X -1 -v ON_ERROR_STOP=1 -f build/dry-run.sql > dry-run-$(date -u +%F).txt
#   - preflight: every column text, ids uuid, no trigger beyond updated_at / related-slugs / 404 resolver
#   - every link rule verdict 'ok'
#   - fee summary: nearly all 'ok'; read every row in "fee rules that would not apply today"

# 5. Apply. The script has its own BEGIN/COMMIT, so do not add -1.
psql "$DB" -X -v ON_ERROR_STOP=1 -f build/apply.sql > apply-$(date -u +%FT%H%MZ).log 2>&1; echo "exit $?"
#   exit 0: committed; the log ends with the per-rule summary, totals and skip reasons.
#   exit non-zero: nothing changed. Read the error: count guard, missing pins, or preflight.
```

Expected runtime: tens of seconds to a few minutes. The script sets `statement_timeout` to 60 minutes and
`lock_timeout` to 15 seconds for itself only.

## 4. Verify afterwards

SQL (read-only; run with `psql "$DB" -X -1` and start with `set transaction read only;`):

```sql
set transaction read only;
-- what the run did
select run_id, count(*) as changes, count(distinct (table_name, row_id, column_name)) as fields,
       min(applied_at), max(applied_at)
from public.seo_repair_change_log group by run_id order by 4;
select reason, count(*) from public.seo_repair_skip_log group by reason order by 2 desc;
select count(*) from public.seo_repair_backup_20261115;          -- equals 'fields' of the first run
-- seeds: should all be 0
select count(*) from public.content_pages
where content like '%After accounting for the 10\% service fee%' or body_markdown like '%After accounting for the 10\% service fee%'
   or body_markdown like '%our 10\% booking fee built into%' or body_markdown like '%Platform fee (10\% of pool rental, paid by host)%';
select count(*) from public.content_pages
where content ~ '(\]\(|href=["''])/host_help[/"''#?) ]' or body_markdown ~ '(\]\(|href=["''])/host_help[/"''#?) ]';
```

Then re-run `build/dry-run.sql`. Every link rule should show `would_change` 0 and `already_applied` equal to the
expected count, apart from insurance skips. Applied fee rules show "old_text absent".

URLs, at most 2 requests per second with a normal browser User-Agent. The 2026-11-16 baseline below was checked live
before the change. A page cache can serve the old text for a while; do not purge any cache as part of this change.

| URL | Before (live 2026-11-16) | After |
|---|---|---|
| `/p/become-a-swimming-pool-host-saratoga-springs-ny` | "10% service fee, a Saratoga host can walk away with nearly $10,000" | "With a 0% host fee, a Saratoga host keeps the full $10,800." |
| `/p/swim-instructor-pool-rental-fair-oaks-ranch-tx` | "our 10% booking fee built into the host's price" | "Your pool rental cost: $69 ($60 hourly rate plus the 15% guest booking fee added at checkout; the host pays 0%)." |
| `/p/swim-instructor-pool-rental-mount-vernon-va` | "Platform fee (10% of pool rental, paid by host)" | "Booking fee (15% of pool rental, paid by you at checkout): $3.75 (15% of $25). The host pays a 0% fee." |
| `/p/become-a-swimming-pool-host-conway-sc` | links `/host_help` (404) | links `/p/host-help` (200) |
| `/p/become-a-swimming-pool-host-monroe-mi` | links `/faq` (404) | links `/p/faq` (200) |
| `/p/become-a-swimming-pool-host-addison-tx` | links `https://poolrentalnearme.com/p/hosting` | links `/p/hosting` |
| `/p/franklin` | links `/b/backyard-design-tips` (404) | anchor text only, no link |

`/p/free-host-tools` links will keep appearing on many pages even after the change. The app adds them at render time
(`src/server/internal-links.functions.ts:19-20` and about 20 other code locations). That fix is in
`links/code-handoff.md`. The `/p/affiliate` "waive your 10% platform fee" text is code too: `fees/code-handoff.md` §1.

## 5. Roll back

```bash
psql "$DB" -X -v ON_ERROR_STOP=1 -f rollback.sql > rollback-$(date -u +%FT%H%MZ).log 2>&1; echo "exit $?"
```

Rollback works one field at a time. A field is restored from the backup only when:
- the current md5 equals the md5 the last apply wrote, and
- the field's change chain is unbroken.

A field someone edited after the apply is **skipped and reported**, never overwritten. The log lists the restored
count, every skipped field with its reason, and the restored changes per rule. Running it again is harmless: it finds
nothing more to restore.

To restore a skipped field by hand, start from `public.seo_repair_backup_20261115` (`old_value`, matched on table,
row, column and the first `old_md5` in the change log).

Leave the four `seo_repair_*` tables in place after a rollback. They are the audit trail. Dropping them later is
Derek's call.

## 6. Excluded, pending Derek (not applied)

All of these are listed in `excluded-pending-derek.csv`.

**Fee rows: 617 `NEEDS_DEREK`**

| Category | Rows | What it is |
|---|---|---|
| DIFF | 272 | Competitor rate minus the old 10% |
| SWIM | 174 | Swim-instructor cost models. The two seed pages are fixed. |
| INS | 78 | Touches insurance, liability, coverage, claims or damage; untouched by rule |
| COVERS | 40 | Says what the (non-existent) host fee or "payment processing" covers or deducts |
| ARITH | 31 | Figures depend on the wrong fee, but the gross is not on the page, or the page's own numbers disagree |
| AMBIG | 12 | Unclear who pays, or which figure is PRNM's |
| FUTURE | 9 | Says "0% through 2026" or that a later 10% applies |
| LEGAL | 1 | Hand-flagged in run 2 |

Also not applied for fees:
- Competitor figures (fees/README §4).
- 215 crawl-only candidates with no database text yet (fees/PENDING-READS Q3).
- The "…you keep 100% of your rate in 2026" sentence injected from outside fresh-web.
- A possibly invented testimonial (fees/README §5). It was not edited.

**Link targets: 434 `NEEDS_DEREK`.** These include:
- 51 insurance/liability-subject URLs, such as `/insurance_guide_for_pool_owners` (2,076 rows);
- renter-city links that redirect to host-recruitment pages;
- links whose only redirect lands on a generic hub, such as `/p/pool-rental-near-me` (781 rows);
- Peerspace and Giggster comparison links;
- `/help-center`.

**Link targets: 173 code- or render-only.** These are REWRITE/UNLINK rows that no database text holds, so they belong
to the code hand-off. Among them are the seeds `/p/terms-of-service` (1,091 linking pages) and
`/p/privatepoolrentalssandiego` (126).

**Also not touched:**
- `content_pages.related_slugs`: one row holds `free-host-tools` (code hand-off).
- `content_pages.raw_html` links: a scrape archive, not rendered. (The 3 raw_html fee rows *are* applied.)

**Skipped at apply time and listed in `seo_repair_skip_log`:**
- link occurrences inside insurance sentences (13 rows at the snapshot);
- image or nested links that UNLINK cannot unwrap;
- fee anchors that are no longer present exactly once;
- fee fields edited after the pin.

**Fee rows not yet verified unique.** 986 of the 2,843 FIX rows still say `PENDING (PENDING-READS Q1)`. They are
included because apply re-checks Q1's exact condition per row: `old_text` byte-exact and present exactly once, else
skipped. The dry run reports it for every row. To follow fees/README §6 literally, build with `--verified-only`.

## 7. Numbers and dates

| Figure | Source and snapshot |
|---|---|
| Fee anchors | Production extracts 2026-11-15: ~17:30 UTC (run 1), 22:08 UTC (run 2), 01:03–01:18 UTC (audit lines). 1,857 rows verified unique on 2026-11-15 at 23:46/23:49 UTC. |
| Link expected counts | Database recount 2026-11-15 ~22:04 UTC: content + body_markdown + blog_posts rows per target, minus rows where the link sits in an insurance sentence. |
| Live checks | 2026-11-16: the destinations `/p/pool-host-tools`, `/p/host-help`, `/p/faq`, `/p/community-guidelines`, `/p/guest-pool-safety-guidelines`, `/p/pool-safety-for-hosts` and `/p/hosting` answer 200. `/p/free-host-tools` answers 301 to `/p/pool-host-tools`. `/host_help` and `/faq` answer 404. The three seed fee sentences are still live. The four link example pages in section 4 each still carry their old link once. |
| Production dry run | **Not run** (P0). |
| Column types | From `supabase/migrations`. To be confirmed by the dry-run preflight. |
