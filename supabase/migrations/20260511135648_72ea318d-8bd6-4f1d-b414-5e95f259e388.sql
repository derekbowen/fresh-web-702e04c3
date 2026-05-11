
create table if not exists public.auto_outreach_settings (
  id int primary key default 1,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default true,
  dm_drafts_enabled boolean not null default true,
  from_email text not null default 'hello@poolrentalnearme.com',
  from_name text not null default 'Pool Rental Near Me',
  reply_to text,
  max_per_hour int not null default 60,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into public.auto_outreach_settings (id) values (1) on conflict do nothing;
alter table public.auto_outreach_settings enable row level security;
alter table public.auto_outreach_settings force row level security;
create policy "admin manage auto_outreach_settings" on public.auto_outreach_settings
  for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create table if not exists public.auto_outreach_messages (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid references public.lead_followups(id) on delete cascade,
  source public.lead_source not null,
  lead_id uuid not null,
  channel text not null check (channel in ('email','sms','dm')),
  step int not null default 1,
  to_address text,
  subject text,
  body text not null,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped','draft')),
  error text,
  provider_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_aom_status_sched on public.auto_outreach_messages(status, scheduled_at);
create index if not exists idx_aom_followup on public.auto_outreach_messages(followup_id);
create unique index if not exists uq_aom_followup_step_channel on public.auto_outreach_messages(followup_id, channel, step);
alter table public.auto_outreach_messages enable row level security;
alter table public.auto_outreach_messages force row level security;
create policy "admin manage auto_outreach_messages" on public.auto_outreach_messages
  for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- Cron every 5 minutes
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$
declare
  jid int;
begin
  select jobid into jid from cron.job where jobname = 'auto-outreach-worker';
  if jid is not null then perform cron.unschedule(jid); end if;
end $$;
select cron.schedule(
  'auto-outreach-worker',
  '*/5 * * * *',
  $$ select net.http_post(
       url := 'https://fresh-web.lovable.app/api/public/hooks/auto-outreach-worker',
       headers := jsonb_build_object('Content-Type','application/json','x-admin-token', current_setting('app.hooks_admin_token', true)),
       body := '{}'::jsonb
     ) $$
);
