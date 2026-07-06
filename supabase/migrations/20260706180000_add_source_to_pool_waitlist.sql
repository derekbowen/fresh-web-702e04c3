-- Add a `source` column to pool_waitlist to distinguish lead origin
-- (e.g. 'zero_results_search' from the marketplace no-results block, vs
-- 'pool_waitlist_form' from the fresh-web signup form). Baked into the
-- prnm-content-production schema from day one so lead attribution works
-- immediately after the migration cutover.
alter table public.pool_waitlist
  add column if not exists source text;

create index if not exists pool_waitlist_source_idx
  on public.pool_waitlist (source);
