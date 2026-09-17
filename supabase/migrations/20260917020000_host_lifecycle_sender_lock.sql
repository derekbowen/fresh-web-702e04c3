-- Host lifecycle: one globally serialized sender.
--
-- Emailit allows 2 messages/second. The engine paces provider calls inside
-- one process (600 ms apart); this lock guarantees there is never more than
-- one sender process in the provider loop anywhere (cron overlap, a second
-- box, a hand run next to a scheduled run), so the per-process pacing is the
-- provider-wide rate. TTL-guarded so a crashed holder cannot wedge sending.

create table if not exists public.host_lifecycle_locks (
  name text primary key,
  holder text,
  acquired_at timestamptz,
  expires_at timestamptz
);
alter table public.host_lifecycle_locks enable row level security;
revoke all on public.host_lifecycle_locks from anon, authenticated;

create or replace function public.acquire_lifecycle_lock(p_name text, p_holder text, p_ttl_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  got integer;
begin
  insert into public.host_lifecycle_locks (name, holder, acquired_at, expires_at)
  values (p_name, p_holder, now(), now() + make_interval(secs => p_ttl_seconds))
  on conflict (name) do update
    set holder = excluded.holder, acquired_at = excluded.acquired_at, expires_at = excluded.expires_at
    where public.host_lifecycle_locks.expires_at is null
       or public.host_lifecycle_locks.expires_at < now()
       or public.host_lifecycle_locks.holder = excluded.holder;
  get diagnostics got = row_count;
  return got = 1;
end;
$$;

create or replace function public.release_lifecycle_lock(p_name text, p_holder text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  got integer;
begin
  update public.host_lifecycle_locks
     set holder = null, expires_at = null
   where name = p_name and holder = p_holder;
  get diagnostics got = row_count;
  return got = 1;
end;
$$;

revoke all on function public.acquire_lifecycle_lock(text, text, integer) from public, anon, authenticated;
revoke all on function public.release_lifecycle_lock(text, text) from public, anon, authenticated;
