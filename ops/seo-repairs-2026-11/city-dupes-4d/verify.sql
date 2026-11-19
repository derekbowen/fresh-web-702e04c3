-- Read-only checks after apply.sql, refresh-1..4.sql and body-links.sql.
-- The per-range "a full refresh changes nothing" checks are noop-1.sql .. noop-4.sql (expect stale = 0 in each);
-- they are separate calls because one full compute takes ~62 s, over the database tool's limit.
begin;
set transaction read only;
set local statement_timeout = '50s';
with dups as (select array_agg(slug) as s from seo_repair.content_pages_city_dupes_20261119),
re as (select '/p/(' || string_agg(slug, '|' order by length(slug) desc, slug) || ')(?![a-z0-9-])' as re
         from seo_repair.content_pages_city_dupes_20261119)
select
  (select count(*) from seo_repair.content_pages_city_dupes_20261119) as backup_rows,               -- 29
  (select count(*) from public.content_pages where status = 'redirect') as redirect_rows,           -- 75 (46 + 29)
  (select count(*) from public.content_pages c join seo_repair.content_pages_city_dupes_20261119 b on b.id = c.id
    where c.status = 'redirect' and not c.in_sitemap and c.redirect_to like 'become-a-swimming-pool-host-%') as dups_redirected, -- 29
  (select count(*) from public.content_pages c, dups
    where c.template_type = 'host_acq_city' and c.status = 'published'
      and c.related_slugs && dups.s) as pages_linking_a_dup,                                          -- 0
  (select count(*) from public.content_pages c, re
    where c.status = 'published'
      and (coalesce(c.body_markdown, '') ~ re.re or coalesce(c.content, '') ~ re.re)) as pages_with_text_links_to_a_dup, -- 0
  (select count(*) from seo_repair.content_pages_body_links_20261119) as text_link_pages_rewritten, -- 27
  (select count(*) from public.content_pages k
    where k.slug in (select c.redirect_to from public.content_pages c join seo_repair.content_pages_city_dupes_20261119 b on b.id = c.id)
      and k.status = 'published' and k.redirect_to is null and k.in_sitemap) as keepers_live;      -- 28 (santa-fe-nm keeps two)
rollback;
-- Known and expected until fresh-web ships the state-hub filter (README, "Known after this step"):
-- 7 state-hub links still name a dup; each answers one 301 to its keeper.
