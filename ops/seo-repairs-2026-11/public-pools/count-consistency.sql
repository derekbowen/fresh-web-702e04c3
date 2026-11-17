-- count-consistency.sql
-- READ-ONLY. SELECT statements only; every execution starts with "set transaction read only;".
-- Supabase project qbzpjsiahqgyoazjurqy. Nothing here updates pp_cities.pool_count or anything else.

set transaction read only;

-- 1. Totals (run 2026-11-15: 647 cities, all published; 244 pool_count NULL; 437 differ from the real
--    published count; 193 lower than real, 0 higher; 7 cities with 0 published pools; sum(pool_count)=1821
--    vs 3381 published pools; 0 orphan pools; 0 duplicate city URLs).
with a as (
  select c.id, c.city_slug, c.state_slug, c.is_published, c.pool_count,
    (select count(*) from pp_pools p where p.city_id=c.id and p.is_published) actual,
    (select count(*) from pp_pools p where p.city_id=c.id) actual_all
  from pp_cities c)
select
  count(*) cities,
  count(*) filter (where is_published) pub,
  count(*) filter (where pool_count is null) pc_null,
  count(*) filter (where pool_count is distinct from actual) differ,
  count(*) filter (where is_published and pool_count is distinct from actual) differ_pub,
  count(*) filter (where actual=0) zero_actual,
  count(*) filter (where actual=0 and is_published) zero_actual_pub,
  count(*) filter (where pool_count is distinct from actual and pool_count > actual) pc_higher,
  count(*) filter (where pool_count is distinct from actual and pool_count < actual) pc_lower,
  count(*) filter (where actual_all<>actual) unpub_present,
  sum(actual) sum_actual, sum(pool_count) sum_pc,
  (select count(*) from pp_pools p where not exists (select 1 from pp_cities c where c.id=p.city_id)) orphan_pools,
  (select count(*) from (select state_slug, city_slug from pp_cities group by 1,2 having count(*)>1) d) dup_city_urls
from a;

-- 2. Rows for count-consistency.csv (444 lines -> raw/cities.txt; each line ends in a 6-char md5 prefix).
-- with a as (
--   select c.state_slug, c.city_slug, c.city_name, c.state_abbr, c.pool_count,
--     (select count(*) from pp_pools p where p.city_id=c.id and p.is_published) actual
--   from pp_cities c where c.is_published)
-- select count(*) n, string_agg(l || '^' || left(md5(l),6), E'\n' order by l) from (
--   select concat_ws('^', state_slug, city_slug, replace(city_name,'^',' '), state_abbr, coalesce(pool_count::text,'NULL'), actual) l
--   from a where pool_count is distinct from actual or actual = 0) x;

-- 3. Which text holds the number the prose states (checked for the three live pages compared).
-- select state_slug, city_slug, pool_count,
--   position('total of five public pools' in coalesce(ai_intro,'')) > 0 as austin_phrase_in_intro,
--   position('one public pool listed' in coalesce(ai_intro,'')) > 0 as fremont_phrase_in_intro,
--   position('nine public pools' in coalesce(ai_intro,'')) > 0 as bronx_phrase_in_intro
-- from pp_cities where (state_slug,city_slug) in (('texas','austin'),('california','fremont'),('new-york','the-bronx'));
