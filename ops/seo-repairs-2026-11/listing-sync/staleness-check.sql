-- Read-only. Run any time; alert if last_ok is older than about twice the cadence (30 min).
select max(finished_at) filter (where status = 'success') as last_ok,
       count(*) filter (where started_at > now() - interval '24 hours') as runs_24h,
       count(*) filter (where started_at > now() - interval '24 hours' and status <> 'success') as failed_24h,
       (select max(last_synced_at) from synced_listings) as newest_row
from listing_sync_log;
