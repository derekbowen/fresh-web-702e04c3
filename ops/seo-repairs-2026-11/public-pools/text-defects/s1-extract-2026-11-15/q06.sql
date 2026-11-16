-- run at 2026-11-15T22:01:42.729Z
set transaction read only;
select 'pool' t, p.slug, left(e::text, 400) e from pp_pools p, jsonb_array_elements(p.ai_faqs) e where jsonb_typeof(p.ai_faqs)='array' and jsonb_typeof(e)='object' and exists (select 1 from jsonb_object_keys(e) k where k not in ('q','a'))
union all
select 'city', c.state_slug||'/'||c.city_slug, left(e::text, 400) from pp_cities c, jsonb_array_elements(c.ai_faqs) e where jsonb_typeof(c.ai_faqs)='array' and exists (select 1 from jsonb_object_keys(e) k where k not in ('q','a'))
limit 25;