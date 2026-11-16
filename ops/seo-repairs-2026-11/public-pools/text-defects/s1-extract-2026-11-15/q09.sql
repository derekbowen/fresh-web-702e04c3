-- run at 2026-11-15T22:05:38.807Z
set transaction read only;
with t as (
 select 'pool' src, ai_description x from pp_pools where ai_description is not null
 union all select 'pool', e->>'a' from pp_pools, jsonb_array_elements(ai_faqs) e where ai_faqs is not null
 union all select 'pool', e from pp_pools, jsonb_array_elements_text(ai_tips) e where ai_tips is not null
 union all select 'city', ai_intro from pp_cities where ai_intro is not null
 union all select 'city', e->>'a' from pp_cities, jsonb_array_elements(ai_faqs) e where ai_faqs is not null),
m as (select src, lower(mm[1]) w, lower(mm[2]) nxt from t, regexp_matches(x, '(?<![A-Za-z''’])([Ww]e|[Ww]e''re|[Ww]e’re|[Ww]e''ve|[Ww]e’ve|[Ww]e''d|[Ww]e’d|[Ww]e''ll|[Oo]ur|[Oo]urs|[Uu]s|[Ff]olks)(?![A-Za-z''’])\s*([A-Za-z''’]+)?', 'g') mm)
select w, nxt, count(*) n, count(*) filter (where src='pool') p, count(*) filter (where src='city') c from m group by 1,2 order by 3 desc limit 90;