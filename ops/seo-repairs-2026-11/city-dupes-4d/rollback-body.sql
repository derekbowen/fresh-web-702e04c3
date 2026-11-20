-- Undo body-links.sql: body_markdown, content and updated_at come back from the backup.
-- Run this BEFORE rollback.sql (which then puts back related_slugs and the remaining updated_at values).
-- Triggers are skipped for this transaction so updated_at is restored as stored (same reason as apply.sql).
-- It refuses, changing nothing, if any page's text is no longer what body-links.sql wrote (someone
-- edited it in between), so that later edit is never silently overwritten.
begin;
set local statement_timeout = '45s';
set local lock_timeout = '5s';
set local session_replication_role = replica;
do $$
declare n int; total int;
begin
  -- Order: this file first, then rollback.sql. If rollback.sql already ran, pages changed by both the
  -- refresh and the text rewrite would get the wrong updated_at back, so refuse.
  select count(*) into n from seo_repair.content_pages_city_dupes_20261119 b
    join public.content_pages c on c.id = b.id where c.status = 'redirect';
  if n <> 29 then raise exception '4d body rollback: only % of 29 dups are still redirects; run this before rollback.sql', n; end if;

  select count(*) into total from seo_repair.content_pages_body_links_20261119;
  select count(*) into n
    from seo_repair.content_pages_body_links_20261119 b join public.content_pages c on c.id = b.id
   where c.body_markdown is distinct from b.new_body_markdown or c.content is distinct from b.new_content;
  if n <> 0 then raise exception '4d body rollback: % pages were edited after body-links.sql; restore them by hand', n; end if;

  update public.content_pages c
     set body_markdown = b.body_markdown, content = b.content, updated_at = b.updated_at
    from seo_repair.content_pages_body_links_20261119 b
   where c.id = b.id;
  get diagnostics n = row_count;
  if n <> total then raise exception '4d body rollback: restored % of % pages', n, total; end if;
end $$;
select (select count(*) from seo_repair.content_pages_body_links_20261119) as pages_restored;
commit;
