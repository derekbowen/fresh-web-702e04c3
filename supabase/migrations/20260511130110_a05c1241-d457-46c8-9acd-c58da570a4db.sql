
create table if not exists public.refresh_jobs (
  id uuid primary key default gen_random_uuid(),
  url_path text not null,
  triggered_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending', -- pending | running | success | error
  reason text, -- why it was queued (decaying, stale, zero-click, manual)
  model text,
  before_word_count integer,
  after_word_count integer,
  before_seo_title text,
  after_seo_title text,
  before_seo_description text,
  after_seo_description text,
  diff_summary text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists refresh_jobs_url_path_idx on public.refresh_jobs(url_path);
create index if not exists refresh_jobs_created_at_idx on public.refresh_jobs(created_at desc);

alter table public.refresh_jobs enable row level security;
alter table public.refresh_jobs force row level security;

revoke all on public.refresh_jobs from anon, authenticated;

create policy "Admins can view refresh_jobs"
  on public.refresh_jobs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));
