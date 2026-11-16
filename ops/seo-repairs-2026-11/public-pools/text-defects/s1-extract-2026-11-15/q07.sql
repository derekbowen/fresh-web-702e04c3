-- run at 2026-11-15T22:02:36.710Z
set transaction read only;
with fp as (select '(^|[^A-Za-z''’])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|I''ll|I’ll|[Mm]y|[Mm]e|[Ww]e|[Ww]e''re|[Ww]e’re|[Ww]e''ve|[Ww]e’ve|[Ww]e''d|[Ww]e’d|[Ww]e''ll|[Oo]ur|[Uu]s|[Ff]olks)([^A-Za-z''’]|$)' r)
select 'pools.ai_description' col, count(*) filter (where ai_description ~ r) hit_rows, count(*) filter (where ai_description is not null) nonnull from pp_pools, fp
union all select 'pools.ai_faqs.a', count(*) filter (where exists (select 1 from jsonb_array_elements(ai_faqs) e where e->>'a' ~ r)), count(*) filter (where ai_faqs is not null) from pp_pools, fp
union all select 'pools.ai_faqs.q', count(*) filter (where exists (select 1 from jsonb_array_elements(ai_faqs) e where e->>'q' ~ r)), count(*) filter (where ai_faqs is not null) from pp_pools, fp
union all select 'pools.ai_tips', count(*) filter (where exists (select 1 from jsonb_array_elements_text(ai_tips) e where e ~ r)), count(*) filter (where ai_tips is not null) from pp_pools, fp
union all select 'pools.price_notes', count(*) filter (where price_notes ~ r), count(*) filter (where price_notes is not null) from pp_pools, fp
union all select 'pools.hours_json', count(*) filter (where hours_json::text ~ r), count(*) filter (where hours_json is not null) from pp_pools, fp
union all select 'pools.amenities', count(*) filter (where amenities::text ~ r), count(*) filter (where amenities is not null) from pp_pools, fp
union all select 'pools.any', count(*) filter (where concat_ws(' ',ai_description,ai_faqs::text,ai_tips::text,price_notes,hours_json::text) ~ r), count(*) from pp_pools, fp
union all select 'cities.ai_intro', count(*) filter (where ai_intro ~ r), count(*) filter (where ai_intro is not null) from pp_cities, fp
union all select 'cities.ai_faqs.a', count(*) filter (where exists (select 1 from jsonb_array_elements(ai_faqs) e where e->>'a' ~ r)), count(*) filter (where ai_faqs is not null) from pp_cities, fp
union all select 'cities.ai_faqs.q', count(*) filter (where exists (select 1 from jsonb_array_elements(ai_faqs) e where e->>'q' ~ r)), count(*) filter (where ai_faqs is not null) from pp_cities, fp
union all select 'cities.meta', count(*) filter (where concat_ws(' ',meta_title,meta_description) ~ r), count(*) from pp_cities, fp
union all select 'cities.any', count(*) filter (where concat_ws(' ',ai_intro,ai_faqs::text) ~ r), count(*) from pp_cities, fp;