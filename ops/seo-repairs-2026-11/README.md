# SEO repairs: scheduled jobs (audit fixes F13 and F15)

From `docs/seo-audit-2026-11-14.md`, fix plan items F13 and F15.

## F15: monthly related-links job. Applied 2026-11-15.

**What it was.** pg_cron job 6 (`0 3 1 * *`) runs
`refresh_related_slugs_for_template('host_acq_city')` and `('host_acq_city_es')`.
Each run rewrote `related_slugs` and `updated_at` on every published row,
4,452 rows a month, whether or not anything changed.
`compute_related_city_slugs` could also pick pages that 301 elsewhere (status
`published` with `redirect_to` set). On 2026-11-15, 139 published city pages
linked to one of the 56 such pages.

**What changed.** `supabase/migrations/20261115120000_related_links_skip_redirects_and_unchanged.sql`:
- A page with `redirect_to` is never chosen as a related link.
- A page with `redirect_to` is not refreshed itself. It is never rendered.
- A row is written only when its computed links differ, so `updated_at` moves
  only on a real change.
- The return value is still the number of rows changed.

**Tests.** `related-links-job/test.sh` runs a throwaway local PostgreSQL 16
cluster with the production function definitions and both `content_pages`
triggers. It reproduces the defect, applies the migration, and checks:
- 0 pages link to a redirecting page;
- only changed rows are written;
- `updated_at` is untouched on unchanged rows;
- redirecting rows and drafts are skipped;
- a second run changes nothing;
- the small-state fallback still yields 10 links;
- the status-change trigger still refreshes;
- rollback restores the old behaviour.

Result: ALL PASS.

**Applied to production 2026-11-15**, with the Supabase migration tool. One
refresh was run straight after. It changed 136 rows, and 0 visible pages now
link to a redirecting page. 3 links remain, all on pages that redirect
themselves and are never shown. The job takes about 70 seconds; job 6's
schedule is unchanged.

**Rollback.** Run `related-links-job/rollback.sql`. It restores both functions
byte-for-byte as they were. Links already written stay; the next monthly run
rewrites every row, as before.

## F13: listing mirror sync schedule. Prepared, not installed.

**Why it matters now.** City pages show listing cards from `synced_listings`.
The renter city pages (fix F1/F7, branch `seo/05-intent`) must describe the
inventory accurately. Measured 2026-11-15 (`listing-sync/staleness-check.sql`):

| | |
|---|---|
| Last successful sync | 2026-09-25 05:05 UTC (51 days ago) |
| Runs ever | 6, all started by hand |
| Runs in the last 24 hours | 0 |

**What to install.** These are ready in `listing-sync/` and run the existing,
deployed hook `POST /api/public/hooks/sync-listings`:
- `prnm-listing-sync.sh` (mode 0750, owner ubuntu);
- `prnm-listing-sync.cron`: every 15 minutes, under `flock -n`, logging to
  `/home/ubuntu/logs/listing-sync.log`.

The 15-minute cadence and its measurements are in the September proposal
(`ops/east/pseo-inventory/PROPOSED_SYNC_SCHEDULE.md` in the marketplace repo).
The runner only reads the token from `.env` and never logs it.

**How it is observed:**
1. `listing_sync_log` gets one row per run, with status, counts and error. It
   is the authoritative record.
2. The log file gets one `ok` or `FAIL` line per tick.
3. `staleness-check.sql`, read-only: alert if `last_ok` is older than about 30
   minutes.

**Install on EAST** (needs server access; CLAUDE.md rule 4 requires the new
schedule to be disclosed in the same message that creates it):
```bash
mkdir -p /home/ubuntu/bin /home/ubuntu/logs /home/ubuntu/locks
install -m 0750 -o ubuntu -g ubuntu prnm-listing-sync.sh /home/ubuntu/bin/
sudo -u ubuntu bash -c '(crontab -l 2>/dev/null; cat prnm-listing-sync.cron) | crontab -'
sudo -u ubuntu crontab -l | grep -c listing-sync     # expect 1
```
**Verify:** after one tick, there is a new `listing_sync_log` row with
`status='success'`, and `staleness-check.sql` shows `last_ok` within 15 minutes.

**Rollback:**
- Halt immediately, keeping the entry: `touch /home/ubuntu/locks/LISTING_SYNC_STOP`.
- Remove it:
  `sudo -u ubuntu crontab -l | grep -v prnm-listing-sync | sudo -u ubuntu crontab -`.

Neither touches data; city pages keep the last synced state.

**Sunoblack move.** The marketplace leaves Sharetribe in December
(`docs/SUNOBLACK_MIGRATION_PLAN.md` in the marketplace repo). From cutover, this
hook's source (the Sharetribe Integration API) stops being the truth. Before
the switch, it must read from Sunoblack, through a webhook or API, or be halted
with the stop file. A sync that keeps running against a Sharetribe account that
is no longer updated would silently serve stale cards.
