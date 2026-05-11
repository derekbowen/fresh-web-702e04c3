-- Unified follow-up tracker for host_leads, ig_leads, social_leads, provider_leads.
-- Purposefully thin: one row per (source, lead_id), plus an append-only touches log.

create type public.lead_source as enum ('host_lead','ig_lead','social_lead','provider_lead');
create type public.followup_status as enum ('new','attempting','connected','no_response','not_interested','converted','do_not_contact');
create type public.touch_channel as enum ('sms','call','email','dm','note','other');
create type public.touch_outcome as enum ('sent','delivered','replied','bounced','no_answer','voicemail','interested','not_interested','meeting_booked','converted');

create table public.lead_followups (
  id uuid primary key default gen_random_uuid(),
  source public.lead_source not null,
  lead_id uuid not null,
  status public.followup_status not null default 'new',
  ai_score smallint,
  ai_score_reason text,
  ai_scored_at timestamptz,
  last_touch_at timestamptz,
  next_action_at timestamptz,
  last_outcome public.touch_outcome,
  touch_count int not null default 0,
  owner_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, lead_id)
);
create index idx_lead_followups_status_next on public.lead_followups(status, next_action_at);
create index idx_lead_followups_score on public.lead_followups(ai_score desc nulls last);
create index idx_lead_followups_source_lead on public.lead_followups(source, lead_id);

create trigger trg_lead_followups_updated_at
before update on public.lead_followups
for each row execute function public.update_updated_at_column();

create table public.lead_touches (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references public.lead_followups(id) on delete cascade,
  channel public.touch_channel not null,
  outcome public.touch_outcome,
  body text,
  by_user_id uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_lead_touches_followup on public.lead_touches(followup_id, occurred_at desc);

alter table public.lead_followups enable row level security;
alter table public.lead_followups force row level security;
alter table public.lead_touches enable row level security;
alter table public.lead_touches force row level security;

create policy "Admins manage lead_followups" on public.lead_followups
  to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create policy "Admins manage lead_touches" on public.lead_touches
  to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

revoke all on public.lead_followups from anon, authenticated;
revoke all on public.lead_touches from anon, authenticated;
grant select, insert, update, delete on public.lead_followups to authenticated;
grant select, insert, update, delete on public.lead_touches to authenticated;

-- Maintain rollups when a touch is logged.
create or replace function public.bump_followup_on_touch()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.lead_followups
     set touch_count = touch_count + 1,
         last_touch_at = NEW.occurred_at,
         last_outcome = NEW.outcome,
         status = case
           when NEW.outcome in ('replied','interested','meeting_booked') then 'connected'::public.followup_status
           when NEW.outcome = 'converted' then 'converted'::public.followup_status
           when NEW.outcome = 'not_interested' then 'not_interested'::public.followup_status
           when status = 'new' then 'attempting'::public.followup_status
           else status
         end,
         updated_at = now()
   where id = NEW.followup_id;
  return NEW;
end $$;

create trigger trg_lead_touch_bump
after insert on public.lead_touches
for each row execute function public.bump_followup_on_touch();

-- Backfill: create a follow-up row for every existing lead so the inbox is populated.
insert into public.lead_followups (source, lead_id)
  select 'host_lead'::public.lead_source, id from public.host_leads
  on conflict do nothing;

insert into public.lead_followups (source, lead_id, status, last_touch_at)
  select 'ig_lead'::public.lead_source, id,
         case when contacted then 'attempting'::public.followup_status else 'new'::public.followup_status end,
         contacted_at
  from public.ig_leads
  on conflict do nothing;

-- Auto-create a follow-up whenever a new lead lands.
create or replace function public.create_followup_for_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare src public.lead_source;
begin
  src := case TG_TABLE_NAME
    when 'host_leads' then 'host_lead'::public.lead_source
    when 'ig_leads' then 'ig_lead'::public.lead_source
    when 'social_leads' then 'social_lead'::public.lead_source
    when 'provider_leads' then 'provider_lead'::public.lead_source
  end;
  insert into public.lead_followups (source, lead_id) values (src, NEW.id)
    on conflict do nothing;
  return NEW;
end $$;

create trigger trg_host_leads_followup after insert on public.host_leads
  for each row execute function public.create_followup_for_lead();
create trigger trg_ig_leads_followup after insert on public.ig_leads
  for each row execute function public.create_followup_for_lead();