-- Step 4d, part 3 of 3: stored links in page text. Run after apply.sql and refresh-1..4.sql.
-- 28 markdown links on 27 published pages (read-only count on production, 2026-11-19) point at
-- /p/<dup>. After apply.sql each is an internal link to a 301. This rewrites '/p/<dup>' to
-- '/p/<keeper>' in body_markdown and content of published pages, only where the next character is
-- not [a-z0-9-] (so '.../santa-fe' never touches '.../santa-fe-nm' or '.../santa-fe-new-mexico').
-- It works on the path, so relative links and full URLs on any host are both rewritten.
-- Ordinary triggers fire: updated_at moves on the changed rows; tg_host_acq_related_refresh does
-- nothing (status, slug and template do not change). Backup: seo_repair.content_pages_body_links_20261119.
-- Undo: rollback-body.sql, BEFORE rollback.sql.
begin;
set local statement_timeout = '45s';
set local lock_timeout = '5s';

-- The counts this run must find. If either differs, it stops and changes nothing.
create temp table _expect (pages int not null, links int not null) on commit drop;
insert into _expect values (27, 28); -- EXPECT

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

-- One pattern for all 29 (longest first), so the full scan of published pages runs one regex per field;
-- the per-link counts below run only on the few pages it finds.
create temp table _re on commit drop as
  select '/p/(' || string_agg(dup, '|' order by length(dup) desc, dup) || ')(?![a-z0-9-])' as re from _dups;
create temp table _hits on commit drop as
  with cand as (
    select c.id, coalesce(c.body_markdown, '') as md, coalesce(c.content, '') as html
    from public.content_pages c, _re
    where c.status = 'published'
      and (coalesce(c.body_markdown, '') ~ _re.re or coalesce(c.content, '') ~ _re.re)
  )
  select cand.id,
         (select count(*) from _dups d cross join lateral regexp_matches(cand.md, '/p/' || d.dup || '(?![a-z0-9-])', 'g') m) as md_links,
         (select count(*) from _dups d cross join lateral regexp_matches(cand.html, '/p/' || d.dup || '(?![a-z0-9-])', 'g') m) as html_links,
         (select coalesce(sum(length(d.keeper) - length(d.dup)), 0) from _dups d
            cross join lateral regexp_matches(cand.md || E'\n' || cand.html, '/p/' || d.dup || '(?![a-z0-9-])', 'g') m) as growth
  from cand;

create table seo_repair.content_pages_body_links_20261119 as
  select c.id, c.slug, c.template_type, c.body_markdown, c.content, c.updated_at,
         length(coalesce(c.body_markdown, '')) + length(coalesce(c.content, '')) as old_len,
         null::text as new_body_markdown, null::text as new_content
  from public.content_pages c where c.id in (select id from _hits);
alter table seo_repair.content_pages_body_links_20261119 enable row level security;
revoke all on seo_repair.content_pages_body_links_20261119 from public, anon, authenticated, service_role;

do $$
declare n int; pages int; links int; want_pages int; want_links int; r record;
begin
  select count(*) into n from _dups where dup !~ '^[a-z0-9-]+$' or keeper !~ '^[a-z0-9-]+$';
  if n <> 0 then raise exception '4d body: % slugs are not plain [a-z0-9-]', n; end if;

  select count(*) into n from _dups d join public.content_pages c on c.slug = d.dup
   where c.status = 'redirect' and c.redirect_to = d.keeper;
  if n <> 29 then raise exception '4d body: only % of 29 dups are redirects; run apply.sql first', n; end if;

  select count(*), coalesce(sum(md_links + html_links), 0) into pages, links from _hits;
  select e.pages, e.links into strict want_pages, want_links from _expect e;
  if pages <> want_pages or links <> want_links then
    raise exception '4d body: found % links on % pages, expected % on %', links, pages, want_links, want_pages;
  end if;

  for r in select dup, keeper from _dups order by dup loop
    update public.content_pages c
       set body_markdown = regexp_replace(c.body_markdown, '/p/' || r.dup || '(?![a-z0-9-])', '/p/' || r.keeper, 'g')
     where c.id in (select id from _hits) and c.body_markdown ~ ('/p/' || r.dup || '(?![a-z0-9-])');
    update public.content_pages c
       set content = regexp_replace(c.content, '/p/' || r.dup || '(?![a-z0-9-])', '/p/' || r.keeper, 'g')
     where c.id in (select id from _hits) and c.content ~ ('/p/' || r.dup || '(?![a-z0-9-])');
  end loop;

  -- Nothing left to rewrite on any published page.
  select count(*) into n from public.content_pages c, _re
   where c.status = 'published'
     and (coalesce(c.body_markdown, '') ~ _re.re or coalesce(c.content, '') ~ _re.re);
  if n <> 0 then raise exception '4d body: % published pages still link a dup', n; end if;

  -- The single pattern and the per-dup patterns must agree on every page found.
  select count(*) into n from _hits where md_links + html_links = 0;
  if n <> 0 then raise exception '4d body: % pages matched the combined pattern but no single dup', n; end if;

  -- Each changed page grew by exactly the sum of (keeper length - dup length) over its links,
  -- so no other text moved.
  select count(*) into n from seo_repair.content_pages_body_links_20261119 b
    join public.content_pages c on c.id = b.id join _hits h on h.id = b.id
   where length(coalesce(c.body_markdown, '')) + length(coalesce(c.content, '')) <> b.old_len + h.growth;
  if n <> 0 then raise exception '4d body: % pages changed length unexpectedly', n; end if;

  -- Only the backed-up rows changed.
  select count(*) into n from public.content_pages c
    join seo_repair.content_pages_body_links_20261119 b on b.id = c.id
   where c.body_markdown is not distinct from b.body_markdown and c.content is not distinct from b.content;
  if n <> 0 then raise exception '4d body: % backed-up pages did not change', n; end if;

  -- Keep what was written, so rollback-body.sql can tell if a page was edited after this run.
  update seo_repair.content_pages_body_links_20261119 b
     set new_body_markdown = c.body_markdown, new_content = c.content
    from public.content_pages c where c.id = b.id;
end $$;

select (select count(*) from seo_repair.content_pages_body_links_20261119) as pages_rewritten,
       (select sum(md_links + html_links) from _hits) as links_rewritten,
       (select sum(md_links) from _hits) as in_body_markdown,
       (select sum(html_links) from _hits) as in_content;
commit;
