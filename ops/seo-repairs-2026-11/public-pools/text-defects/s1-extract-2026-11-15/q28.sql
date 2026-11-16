-- run at 2026-11-15T23:34:02.865Z
set transaction read only;
select c.state_slug||'/'||c.city_slug city, coalesce(p.pool_type,'(null)') pool_type, count(*) n, string_agg(left(p.name,40), ' | ' order by p.name) names
from pp_cities c join pp_pools p on p.city_id=c.id and p.is_published
where (c.state_slug, c.city_slug) in (('colorado','fort-collins'),('california','huntington-beach'),('california','torrance'),('california','walnut-creek'),('minnesota','edina'),('california','apple-valley'),('south-carolina','mount-pleasant'))
group by 1,2 order by 1,2;