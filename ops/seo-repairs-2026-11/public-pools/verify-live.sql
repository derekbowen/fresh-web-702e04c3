set transaction read only;
-- Public-pools text cleaner: list what one apply run changed, for checking the live pages (READ ONLY).
-- Run after apply.sql, from this folder:
--   psql "$DATABASE_URL" -X --single-transaction -v ON_ERROR_STOP=1 -v run_id=<the apply run_id> -f verify-live.sql
-- Writes verify-expected.csv (url, tbl, col, rule_id, new_value, old_value) in the current directory. Then:
--   cut -d, -f1 verify-expected.csv | tail -n +2 | sort -u > verify-urls.txt
--   python3 -I text-defects/extract_live.py verify-urls.txt verify-pages.jsonl      (GET only, < 2 requests/s)
--   python3 -I cleaner/verify_live.py verify-expected.csv verify-pages.jsonl
-- Page URLs are built as /public-pools/<pp_cities.state_slug>/<pp_cities.city_slug>/[<pp_pools.slug>/], the
-- pattern of every URL in the saved sitemap (raw/public-pools.xml, 2026-11-15).
\set ON_ERROR_STOP on
\if :{?run_id}
\else
select 'ABORT: pass -v run_id=<the apply run to verify>'::int;   -- fails on purpose: psql exits 3, never 0
\endif
select case when current_setting('transaction_read_only') = 'on' then 'read-only transaction: OK'
            else ('ABORT: this transaction is not read-only (transaction_read_only=' ||
                  current_setting('transaction_read_only') || '); run with psql --single-transaction')::int::text
       end as read_only_check;
\pset format csv
select 'https://www.poolrentalnearme.com/public-pools/' || c.state_slug || '/' || c.city_slug || '/' ||
         case when l.tbl = 'pp_pools' then p.slug || '/' else '' end as url,
       l.tbl, l.col, l.rule_id,
       case l.col when 'ai_best_for' then p.ai_best_for when 'ai_description' then p.ai_description
                  when 'ai_intro' then c.ai_intro
                  when 'ai_faqs' then (case when l.tbl = 'pp_pools' then p.ai_faqs else c.ai_faqs end)::text end as new_value,
       b.old_value
  from public.seo_repair_pp_change_log l
  join public.seo_repair_pp_backup_20261115 b on b.tbl = l.tbl and b.row_id = l.row_id and b.col = l.col and b.old_md5 = l.old_md5
  left join public.pp_pools p on l.tbl = 'pp_pools' and p.id = l.row_id
  left join public.pp_cities c on c.id = case when l.tbl = 'pp_pools' then p.city_id else l.row_id end
 where l.run_id = :'run_id' and l.action = 'applied'
 order by 1, 2, 3
\g verify-expected.csv
\pset format aligned
select count(*) as applied_fields_listed from public.seo_repair_pp_change_log where run_id = :'run_id' and action = 'applied';
