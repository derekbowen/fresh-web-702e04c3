-- Step 4d (RELEASE.md), intent.md §6a: 301 the 29 second copies of a place to their keeper.
-- One transaction. Database tool: paste the whole file as one call.
--
-- Why session_replication_role: tg_host_acq_related_refresh (AFTER ... FOR EACH ROW) re-computes
-- related_slugs for every published host_acq_city page each time one row's status changes.
-- One refresh takes ~69 s for 3,952 rows, so 29 rows would take ~33 min and the first attempt
-- (2026-11-18) hit the tool's timeout and rolled back. 'replica' skips the ordinary triggers for
-- THIS transaction only (SET LOCAL). Their effects are done by hand:
--   trg_content_pages_updated_at -> updated_at = now() in the UPDATE below;
--   tg_host_acq_related_refresh  -> refresh-1.sql .. refresh-4.sql, run right after this commits
--                                   (the same UPDATE as refresh_related_slugs_for_template, in 4 slug ranges).
-- No foreign key involves the written columns (status, redirect_to, in_sitemap, updated_at).
begin;
set local statement_timeout = '45s';
set local lock_timeout = '5s';
set local session_replication_role = replica;

create temp table _dups (dup text primary key, keeper text not null) on commit drop;
insert into _dups (dup, keeper) values
  ('become-a-swimming-pool-host--ofallon-mo', 'become-a-swimming-pool-host-ofallon-mo'),
  ('become-a-swimming-pool-host-boise-idaho', 'become-a-swimming-pool-host-boise-id'),
  ('become-a-swimming-pool-host-buffalo', 'become-a-swimming-pool-host-buffalo-ny'),
  ('become-a-swimming-pool-host-caldwell-idaho', 'become-a-swimming-pool-host-caldwell-id'),
  ('become-a-swimming-pool-host-cambridge', 'become-a-swimming-pool-host-cambridge-ma'),
  ('become-a-swimming-pool-host-eastion-pa', 'become-a-swimming-pool-host-easton-pa'),
  ('become-a-swimming-pool-host-erie', 'become-a-swimming-pool-host-erie-pa'),
  ('become-a-swimming-pool-host-hartford', 'become-a-swimming-pool-host-hartford-ct'),
  ('become-a-swimming-pool-host-huntsville', 'become-a-swimming-pool-host-huntsville-al'),
  ('become-a-swimming-pool-host-idaho-falls-idaho', 'become-a-swimming-pool-host-idaho-falls-id'),
  ('become-a-swimming-pool-host-independence', 'become-a-swimming-pool-host-independence-mo'),
  ('become-a-swimming-pool-host-las-cruces-new-mexico', 'become-a-swimming-pool-host-las-cruces-nm'),
  ('become-a-swimming-pool-host-lawrence', 'become-a-swimming-pool-host-lawrence-ks'),
  ('become-a-swimming-pool-host-lewisville', 'become-a-swimming-pool-host-lewisville-tx'),
  ('become-a-swimming-pool-host-liguna-niguel-ca', 'become-a-swimming-pool-host-laguna-niguel-ca'),
  ('become-a-swimming-pool-host-los-alamintos-ca', 'become-a-swimming-pool-host-los-alamitos-ca'),
  ('become-a-swimming-pool-host-mesquite', 'become-a-swimming-pool-host-mesquite-tx'),
  ('become-a-swimming-pool-host-montgomery', 'become-a-swimming-pool-host-montgomery-al'),
  ('become-a-swimming-pool-host-moore-park-ca', 'become-a-swimming-pool-host-moorpark-ca'),
  ('become-a-swimming-pool-host-nampa-idaho', 'become-a-swimming-pool-host-nampa-id'),
  ('become-a-swimming-pool-host-new-haven', 'become-a-swimming-pool-host-new-haven-ct'),
  ('become-a-swimming-pool-host-northbridge-ca', 'become-a-swimming-pool-host-northridge-ca'),
  ('become-a-swimming-pool-host-pasadena', 'become-a-swimming-pool-host-pasadena-ca'),
  ('become-a-swimming-pool-host-plano', 'become-a-swimming-pool-host-plano-tx'),
  ('become-a-swimming-pool-host-redbluff-ca', 'become-a-swimming-pool-host-red-bluff-ca'),
  ('become-a-swimming-pool-host-rio-rancho-new-mexico', 'become-a-swimming-pool-host-rio-rancho-nm'),
  ('become-a-swimming-pool-host-santa-fe', 'become-a-swimming-pool-host-santa-fe-nm'),
  ('become-a-swimming-pool-host-santa-fe-new-mexico', 'become-a-swimming-pool-host-santa-fe-nm'),
  ('become-a-swimming-pool-host-springfield', 'become-a-swimming-pool-host-springfield-mo');

-- Backup 1 (RELEASE.md 4d): the 29 rows, whole, before the change.
create table seo_repair.content_pages_city_dupes_20261119 as
  select c.* from public.content_pages c
  where c.template_type = 'host_acq_city' and c.slug in (select dup from _dups);

-- Backup 2: related_slugs and updated_at of every host_acq_city row, before the refresh changes them.
create table seo_repair.content_pages_related_20261119 as
  select c.id, c.slug, c.status, c.related_slugs, c.updated_at from public.content_pages c
  where c.template_type = 'host_acq_city';

alter table seo_repair.content_pages_city_dupes_20261119 enable row level security;
alter table seo_repair.content_pages_related_20261119 enable row level security;
revoke all on seo_repair.content_pages_city_dupes_20261119 from public, anon, authenticated, service_role;
revoke all on seo_repair.content_pages_related_20261119 from public, anon, authenticated, service_role;

do $$
declare n int;
begin
  select count(*) into n from seo_repair.content_pages_city_dupes_20261119;
  if n <> 29 then raise exception '4d: backup holds % rows, expected 29', n; end if;

  select count(*) into n from _dups d join public.content_pages c on c.slug = d.dup
   where c.template_type = 'host_acq_city' and c.status = 'published' and c.redirect_to is null
     and c.url_path = '/p/' || c.slug;
  if n <> 29 then raise exception '4d: % of 29 dups are published host pages at /p/<slug>', n; end if;

  select count(*) into n from _dups d join public.content_pages k on k.slug = d.keeper
   where k.template_type = 'host_acq_city' and k.status = 'published' and k.redirect_to is null
     and k.in_sitemap and k.url_path = '/p/' || k.slug;
  if n <> 29 then raise exception '4d: % of 29 pairs have a live, sitemapped keeper', n; end if;

  select count(*) into n from _dups where keeper in (select dup from _dups);
  if n <> 0 then raise exception '4d: % keepers are themselves dups', n; end if;

  -- redirect_to is stored as a bare slug, '/p/<slug>' or a full URL; strip host and '/p/' before comparing.
  select count(*) into n from public.content_pages
   where regexp_replace(redirect_to, '^(https?://[^/]+)?/p/', '') in (select dup from _dups);
  if n <> 0 then raise exception '4d: % rows already redirect to a dup (would chain)', n; end if;

  update public.content_pages c
     set status = 'redirect', redirect_to = d.keeper, in_sitemap = false, updated_at = now()
    from _dups d
   where c.slug = d.dup and c.template_type = 'host_acq_city' and c.status = 'published'
     and c.redirect_to is null and c.url_path = '/p/' || c.slug;
  get diagnostics n = row_count;
  if n <> 29 then raise exception '4d: updated % rows, expected 29', n; end if;
end $$;

select
  (select count(*) from seo_repair.content_pages_city_dupes_20261119) as backup_rows,
  (select count(*) from seo_repair.content_pages_related_20261119) as related_backup_rows,
  (select count(*) from public.content_pages where status = 'redirect') as redirect_rows_now,
  (select count(*) from public.content_pages c join _dups d on d.dup = c.slug
    where c.status = 'redirect' and c.redirect_to = d.keeper and not c.in_sitemap) as dups_redirected;
commit;
