-- Undo step 4d: the 29 rows get back status, redirect_to, in_sitemap and updated_at from the backup,
-- and every host_acq_city row gets back its related_slugs from before the refresh.
-- Triggers are skipped for this transaction (same reason as apply.sql); restoring the stored
-- related_slugs is exactly the pre-change state, so no refresh is needed afterwards.
begin;
set local statement_timeout = '45s';
set local lock_timeout = '5s';
set local session_replication_role = replica;
do $$
declare n int;
begin
  update public.content_pages c
     set status = b.status, redirect_to = b.redirect_to, in_sitemap = b.in_sitemap, updated_at = b.updated_at
    from seo_repair.content_pages_city_dupes_20261119 b
   where c.id = b.id and c.status = 'redirect';
  get diagnostics n = row_count;
  if n <> 29 then raise exception '4d rollback: restored % rows, expected 29', n; end if;

  update public.content_pages c
     set related_slugs = r.related_slugs, updated_at = r.updated_at
    from seo_repair.content_pages_related_20261119 r
   where c.id = r.id and c.related_slugs is distinct from r.related_slugs;
end $$;
select (select count(*) from public.content_pages where status = 'redirect') as redirect_rows; -- 46
commit;
