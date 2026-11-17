-- run at 2026-11-15T23:35:06.311Z
set transaction read only;
select p.slug, c.state_slug, c.city_slug, p.ai_best_for from pp_pools p join pp_cities c on c.id=p.city_id where p.ai_best_for like '%''%' order by md5(p.id::text) limit 1;