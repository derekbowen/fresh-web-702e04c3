create table if not exists public.faq_generator_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  endpoint text not null,
  user_id uuid,
  url_path text,
  payload jsonb,
  status text not null,
  error_message text,
  error_stack text,
  duration_ms integer,
  http_status integer,
  meta jsonb
);

create index if not exists faq_generator_logs_created_at_idx
  on public.faq_generator_logs (created_at desc);
create index if not exists faq_generator_logs_status_idx
  on public.faq_generator_logs (status);
create index if not exists faq_generator_logs_endpoint_idx
  on public.faq_generator_logs (endpoint);

alter table public.faq_generator_logs enable row level security;

create policy "Admins can read faq generator logs"
  on public.faq_generator_logs
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

revoke insert, update, delete on public.faq_generator_logs from anon, authenticated;