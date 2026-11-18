# F5 + F14 content repair: production run, 2026-11-18 (database-tool mode)

Project `qbzpjsiahqgyoazjurqy` (PostgreSQL 17.6). Mode: `RUNBOOK-dbtool.md`. All times UTC.

## Pre-checks (read-only)

| Check | Result |
|---|---|
| Page writers (P2) | one `pg_cron` job, `refresh-related-slugs-monthly` (03:00 on the 1st); no `content_pages` update since 2026-11-15 19:05, no `blog_posts` update since 2026-10-17 |
| Triggers | `trg_content_pages_updated_at`, `set_updated_blog` (BEFORE UPDATE, `updated_at = now()`), `tg_host_acq_related_refresh` (AFTER; acts only when status / template_type / slug change: read from `pg_get_functiondef`, so a no-op for this change). No webhook, no `pg_net` |
| Column types | all written columns `text`; ids `uuid`; `updated_at` timestamptz |
| Q1 (fees) | full FIX set staged (bundle `dbtool-q1`, sha256 `7d55c01f…`, commit `37824b7`): all 2,724 rules present exactly once, literal intact. 995 PENDING rows marked verified (commit `5644fe0`) |
| Private schema | `anon`, `authenticated`, `service_role`, `authenticator`: no usage of `seo_repair`, no table or function privilege |

## Run

| Step | Time | Result |
|---|---|---|
| Bundle | 10:23:51 | `dbtool/bundle.json`, sha256 `41bd3e20c8b2375e399286698862353e99dc35d329483d980eaa5ff3a13301c6`, commit `5644fe0322591865bcbdecd83cc11951659da05a`; 514 link + 2,724 fee rules; digests `ea56d812…` / `4cca7d1a…` |
| P1 pins | 10:24:15 | 5,176 fields (distinct fields; the runbook's "about 15,000" counted fields once per link target), 0 missing; pin set `53c75642d62b82ff82f6ac59e98a8df0dee409d4c31a563ec47b600a83555dcf` |
| Dry run | 10:25 | link rules: 514/514 `ok`; fields holding a target now 15,030 = 15,030 on 2026-11-15 (no drift); would change 14,929 rule-fields (15,327 links); insurance guard 101; field guard 0; unsupported forms 0. Fee rules: 2,724 on 2,334 fields all `ok` |
| Reviewed mark | 10:26:33 | `reviewed_pin_set_sha256` = the pin set above |
| Apply | 10:26:41 | run `apply-20261118T102641Z-3327571`, committed (the tool's 60 s timeout hit; the run had committed, read back from `stage_meta` and the change log) |

## Result

- **5,142 fields changed on 3,671 rows** (3,643 `content_pages`, the rest `blog_posts`); 5,142 backup rows in
  `seo_repair.seo_repair_backup_20261115`; 17,653 change-log rows.
- **Fees:** all 2,724 fee rules applied, 0 skipped.
- **Links:** all 514 link rules applied: 14,929 rule-field changes, 15,327 links. **101 fields skipped by the insurance
  guard** (left exactly as they were; list in `insurance-held-links-2026-11-18.tsv`, for Derek).
- **Verify (10:28):** 5,142 repaired fields, 5,142 unchanged since the repair, 0 changed.
- **Old fee phrases** (RUNBOOK §4 SQL): 0 left.
- **Live pages (10:30, GET, Cloudflare `DYNAMIC`):** Saratoga Springs "keeps the full $10,800" (old "walk away with
  nearly" gone); Fair Oaks Ranch "15% guest booking fee added at checkout" (old 10% gone); Mount Vernon "Booking fee
  (15% of pool rental, paid by you at checkout)" (old gone); Conway links `/p/host-help` (no `/host_help`); Monroe
  links `/p/faq` (no `/faq`); Addison links `/p/hosting` (no absolute form); Franklin: no `/b/backyard-design-tips`.
- `updated_at` was bumped on the changed rows (decision 2 of RUNBOOK-dbtool.md); the old values are in
  `old_updated_at`.

Rollback (not needed): CALLS.md last row; `seo_repair.run('rollback.sql')` restores a field only while it still holds
what this run wrote.

## Still open

- 101 insurance-held link fields (Derek, CLAUDE.md rule 8).
- 767 NEEDS_DEREK fee rows and 482 NEEDS_DEREK link targets (unchanged; `excluded-pending-derek.csv`).
- P3 (run 10:31): 18 production lines on 11 pages still state stale fee arithmetic or "small fee" wording:
  `p3-lines-2026-11-18.tsv`. They are candidates for a second round (classify, add FIX / NEEDS_DEREK rows, verify,
  new bundle). Not applied.
- verify again in an hour and tomorrow (`seo_repair.q('verify_changed.sql')`, expect 0 rows).
