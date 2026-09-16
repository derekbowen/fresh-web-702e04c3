-- Applied to production 2026-09-16 23:35Z via Supabase MCP (apply_migration).
-- Host lifecycle engine tables + permanent retirement of the Lovable-era
-- pg_cron -> public-hook workers. See docs/archive/outbound-comms-legacy/.
do $$
declare j record;
begin
  for j in select jobid, jobname from cron.job where jobname in (
    'competitor-radar-daily','daily-seo-digest','auto-generate-content-batch',
    'poll-sharetribe-renters-15m','send-renter-emails-1m','poll-sharetribe-hosts-daily',
    'send-host-drip-emails-5m','auto-outreach-worker',
    'sms-sender-every-minute','sync-sharetribe-listings-hourly','process-email-queue')
  loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

create table if not exists public.host_lifecycle_state (
  user_id text primary key, email text not null, first_name text, user_type text,
  st_created_at timestamptz not null, email_verified boolean not null default false,
  banned boolean not null default false, deleted boolean not null default false,
  stripe_connected boolean not null default false,
  listing_id text, listing_title text, listing_state text, listing_created_at timestamptz,
  has_title boolean not null default false, has_description boolean not null default false,
  has_address boolean not null default false, has_price boolean not null default false,
  photo_count integer not null default 0, listing_ready boolean not null default false,
  published_at timestamptz, booking_count integer not null default 0,
  first_booking_at timestamptz, last_booking_at timestamptz,
  lifecycle_state text not null, state_entered_at timestamptz not null default now(),
  missing text[] not null default '{}', last_synced_at timestamptz not null default now(), raw jsonb
);
create index if not exists host_lifecycle_state_state_idx on public.host_lifecycle_state (lifecycle_state);
create index if not exists host_lifecycle_state_email_idx on public.host_lifecycle_state (lower(email));

create table if not exists public.communication_jobs (
  id uuid primary key default gen_random_uuid(), user_id text not null,
  channel text not null default 'email' check (channel in ('email')),
  campaign_key text not null, template_key text not null, lifecycle_state text not null,
  recipient text not null, scheduled_at timestamptz not null,
  status text not null default 'queued' check (status in ('queued','leased','sent','suppressed','cancelled','failed','dry_run')),
  attempt_count integer not null default 0, idempotency_key text not null unique,
  eligibility_reason text, subject text, cta_url text, leased_at timestamptz, leased_by text,
  sent_at timestamptz, suppressed_at timestamptz, suppressed_reason text, provider_message_id text,
  last_error text, mode text, rendered_html text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists communication_jobs_due_idx on public.communication_jobs (status, scheduled_at);
create index if not exists communication_jobs_user_idx on public.communication_jobs (user_id, created_at desc);
create index if not exists communication_jobs_campaign_idx on public.communication_jobs (campaign_key, status);

create table if not exists public.host_lifecycle_runs (
  id uuid primary key default gen_random_uuid(), started_at timestamptz not null default now(),
  finished_at timestamptz, phase text not null, mode text, enabled boolean, worker text,
  stats jsonb not null default '{}'::jsonb, error text
);

create or replace function public.lease_communication_jobs(p_limit integer, p_worker text)
returns setof public.communication_jobs language plpgsql security definer set search_path = public as $$
begin
  return query
  with picked as (
    select id from public.communication_jobs
    where status = 'queued' and scheduled_at <= now()
    order by scheduled_at for update skip locked
    limit greatest(1, least(p_limit, 100))
  )
  update public.communication_jobs c
     set status = 'leased', leased_at = now(), leased_by = p_worker,
         attempt_count = c.attempt_count + 1, updated_at = now()
    from picked where c.id = picked.id
  returning c.*;
end $$;
revoke all on function public.lease_communication_jobs(integer, text) from public, anon, authenticated;

alter table public.host_lifecycle_state enable row level security;
alter table public.communication_jobs enable row level security;
alter table public.host_lifecycle_runs enable row level security;
revoke all on public.host_lifecycle_state, public.communication_jobs, public.host_lifecycle_runs from anon, authenticated;
