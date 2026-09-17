-- Host lifecycle: a dry run must never consume production send state.
--
-- Before this migration a record-only outcome was stored as status 'dry_run'
-- on the row that held the PRODUCTION idempotency key (user:campaign), and the
-- evaluator counted 'dry_run' as "already sent". So 21 hosts simulated on
-- 2026-09-17 would never have received no_listing_1 for real.
--
-- Now: simulations are status 'would_send' with a 'sim:' idempotency key,
-- kept for audit; 'sent' is the only status that counts as delivered.

alter table public.communication_jobs drop constraint if exists communication_jobs_status_check;
alter table public.communication_jobs
  add constraint communication_jobs_status_check
  check (status in ('queued','leased','sent','suppressed','cancelled','failed','would_send'));

-- Reset: convert every legacy dry_run row to a would_send audit row and
-- release its production key. sent_at was never set on these rows.
update public.communication_jobs
   set status = 'would_send',
       idempotency_key = 'sim:' || user_id || ':' || campaign_key || ':' || id::text,
       sent_at = null
 where status = 'dry_run';

-- Suppressed rows from a record-only pass are audit too; release their keys so
-- a host who later un-suppresses can be evaluated again for real.
update public.communication_jobs
   set idempotency_key = 'sim:' || user_id || ':' || campaign_key || ':' || id::text
 where status = 'suppressed' and mode = 'dry_run' and idempotency_key not like 'sim:%';

comment on column public.communication_jobs.status is
  'queued|leased|sent|suppressed|cancelled|failed|would_send. Only sent = delivered. would_send = simulated (dry_run / allowlist record-only), audit only.';
comment on column public.communication_jobs.idempotency_key is
  'user:campaign for a real send intent (one per host per campaign ever); sim:user:campaign:<day|id> for simulations.';
