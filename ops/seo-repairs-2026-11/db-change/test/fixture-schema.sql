-- Minimal local copy of the production tables the repair touches.
-- Column names and types follow supabase/migrations/*.sql at the production commit (content_pages: id uuid, slug text,
-- content / body_markdown / description / seo_title / seo_description / og_description / raw_html text; blog_posts:
-- id uuid, slug text, content text; both with a BEFORE UPDATE trigger that bumps updated_at). The live column list is
-- re-checked by the preflight in apply.sql / dry-run.sql (and PENDING-READS P2) because information_schema could not be
-- read on 2026-11-16.
create or replace function public.update_updated_at_column() returns trigger language plpgsql as $f$
begin
  new.updated_at = now();
  return new;
end
$f$;

create table public.content_pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,
  url_path        text,
  template_type   text,
  status          text not null default 'published',
  title           text,
  description     text,
  content         text,
  body_markdown   text,
  raw_html        text,
  seo_title       text,
  seo_description text,
  og_title        text,
  og_description  text,
  faq_items       jsonb,
  related_slugs   text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_content_pages_updated_at before update on public.content_pages
  for each row execute function public.update_updated_at_column();

create table public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  content      text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger set_updated_blog before update on public.blog_posts
  for each row execute function public.update_updated_at_column();

-- Supabase API roles, so the REVOKE path in apply.sql is exercised.
do $r$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end
$r$;
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;
