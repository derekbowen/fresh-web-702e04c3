# RUNBOOK (database-tool mode): F5 internal links + F14 fee statements

`RUNBOOK.md` runs this change with `psql` and a direct connection string. The operator's session has neither: the only
way into the production database is the Supabase database tool, which takes one SQL text per call (about 2 MB at
most) and understands no psql meta-commands. This mode runs **the same change** through that tool. Everything that reads
or writes page text is the SQL of `generate.py`, unchanged; `test/test_dbtool.py` proves the two modes give
byte-identical results.

## How it works

1. `dbtool.py` writes `bundle.json`: every rule from the two reviewed CSVs and every SQL script, as ASCII JSON, with
   the sha256 of each script and a field-by-field digest of the rules.
2. The bundle is committed to fresh-web. **Call 1** (`call-1-bootstrap.sql`, about 1 KB, typed into the tool with the
   commit SHA and the bundle's sha256) creates the private schema `seo_repair` and asks `pg_net` to fetch the bundle
   from `raw.githubusercontent.com` at that exact commit.
3. **Call 2** (`call-2-unpack.sql`) refuses unless the fetched file has exactly that sha256. It then runs the bundle's
   loader. The loader creates the stage tables and two runner functions, unpacks the rules and scripts, and re-checks
   the digests in SQL.
4. Every later call is one line (`CALLS.md`). `seo_repair.run('<script>')` executes a staged script after
   re-checking its sha256. `seo_repair.q('<query>')` returns a staged read-only query's rows as JSON.

| | psql mode (`RUNBOOK.md`) | database-tool mode (this file) |
|---|---|---|
| Rules | inline `VALUES` in each script | `seo_repair.stage_link_rules`, `seo_repair.stage_fee_rules` (digest-checked) |
| P1 pin read | 13 read-only files, TSV on the operator's disk, `generate.py --pins` | `pins.sql`, in the database, one transaction; sha256 in `seo_repair.stage_meta` |
| Dry run | `build/dry-run.sql` (psql sections) | `dry_*.sql`, one query per section, same SQL text except the rule/pin sources |
| Review gate | apply built from the reviewed pins | apply refuses unless `stage_meta.reviewed_pin_set_sha256` equals the pin set, and the staged rules still match the bundle |
| Backup + logs | `public.seo_repair_*` (RLS on) | `seo_repair.seo_repair_*`, outside the schema the API exposes (RELEASE.md step 4 rule) |
| Rollback run id | `psql -v only_run=…` | `stage_meta.rollback_only_run` |

`seo_repair` is usable only by the role that created it: `PUBLIC`, `anon`, `authenticated` and `service_role` hold no
usage on the schema and no privilege on its tables or functions (checked by the test, and on production in step 2).

## Decisions taken for the 2026-11-18 run (RUNBOOK.md §0)

1. **Field-guard reference:** the in-database P1 read (`pins.sql`). The 2026-11-15 snapshot still guards the change
   through the byte-exact fee anchors and the per-rule link count guard.
2. **`updated_at`:** accepted. Every changed row gets `updated_at = now()` from the existing trigger. The changes are
   real text corrections; the main sitemaps use `content_refreshed_at` (not touched); the old value is kept in the
   backup's `old_updated_at`.
3. **Fee rows:** only `verified = YES` rows (`dbtool.py --verified-only`). The `PENDING` rows were verified first with
   this mode's own check (Q1, step 2 below). **Result, 2026-11-18 03:46 UTC:** the full FIX set (bundle
   `dbtool-q1/bundle.json`, sha256 `7d55c01f…`, fetched at commit `37824b7`) staged on production;
   `dry_fees_summary` without pins returned one status for all **2,724 rules on 2,334 fields: old text present exactly
   once, row found, literal intact**. The 995 `PENDING` FIX rows are now `YES 2026-11-18 03:46 UTC (...)` in
   `fees/fee-corrections.csv` (nothing else in the CSV changed), so `--verified-only` now selects all 2,724.
   `dbtool-q1/` is kept unchanged as the record of the bundle that was fetched for that check.
4. **Page writers (RUNBOOK.md §3 step 0):** P2 on 2026-11-18 showed one `pg_cron` job (`refresh-related-slugs-monthly`,
   03:00 UTC on the 1st; not a text writer for these columns). No `content_pages` row had been updated since
   2026-11-15 19:05 UTC and no `blog_posts` row since 2026-10-17, so no writer was active. The HTTP hooks on EAST/WEST
   could not be paused from this session; `verify` (step 8) would show any later overwrite.

## Steps

```text
0. Local tests on this machine: bash test/test.sh   (test_repair.py 94 checks + test_dbtool.py)
1. Call 1 (commit SHA + bundle sha256 filled in), then call 2 a few seconds later.
   Check: staged_link_rules / staged_fee_rules / staged_rules_digest in the returned stage_meta rows;
   select has_schema_privilege(r, 'seo_repair', 'usage') for anon/authenticated/service_role -> all false.
2. (3a, once) Q1 for every fee rule: stage the full FIX set (dbtool-q1/), run dry_fees_summary + dry_fees_not_applying
   without pins. Rows that occur exactly once become verified = YES in fees/fee-corrections.csv; regenerate.
3. Pin read:  begin; set local statement_timeout = '30min'; select seo_repair.run('pins.sql'); commit;
4. Dry run: every dry_*.sql via seo_repair.q (read-only transaction). Every link verdict 'ok'; read the insurance and
   field-guard lists; fee summary and the fee rules that would not apply.
5. Mark the reviewed pin set:
   insert into seo_repair.stage_meta (k, v) values ('reviewed_pin_set_sha256', '<pin_set_sha256 from dry_pins>')
   on conflict (k) do update set v = excluded.v, at = now();
6. Apply:  begin; set local statement_timeout = '60min'; select seo_repair.run('apply.sql'); commit;
   If the tool times out, the transaction may still be running: read stage_meta 'last_apply_run' and the change log
   before doing anything else. The apply is one transaction: it either committed whole or changed nothing.
7. apply_totals.sql, apply_skips.sql, apply_rules.sql.
8. verify_totals.sql and verify_changed.sql (0 rows) right after, an hour later, and the next day.
9. Live checks (RUNBOOK.md §4 table), at most 2 requests per second, after the 600 s edge cache.
Rollback: CALLS.md last row.
```
