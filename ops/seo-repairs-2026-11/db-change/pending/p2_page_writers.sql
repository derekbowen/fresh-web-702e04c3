set transaction read only;
-- PENDING-READS P2 (review 2026-11-16, finding F2): scheduled jobs that may write content_pages while apply.sql runs.
-- run: psql "$DB" -X -1 -v ON_ERROR_STOP=1 -f pending/p2_page_writers.sql
-- Small result (one row per pg_cron job). The command text itself is not selected; only whether it looks like a page writer.
select jobid, jobname, schedule, active,
       (command ~* 'content|generate|link|seo|blog|host-pages|alias|tail-fix|related') as may_write_pages
from cron.job
order by jobname;
