-- run at 2026-11-15T22:01:17.144Z
set transaction read only;
select 'pools.ai_faqs' col, coalesce(jsonb_typeof(ai_faqs),'sql_null') t, count(*) from pp_pools group by 2
union all select 'pools.ai_tips', coalesce(jsonb_typeof(ai_tips),'sql_null'), count(*) from pp_pools group by 2
union all select 'pools.hours_json', coalesce(jsonb_typeof(hours_json),'sql_null'), count(*) from pp_pools group by 2
union all select 'pools.amenities', coalesce(jsonb_typeof(amenities),'sql_null'), count(*) from pp_pools group by 2
union all select 'pools.image_urls', coalesce(jsonb_typeof(image_urls),'sql_null'), count(*) from pp_pools group by 2
union all select 'cities.ai_faqs', coalesce(jsonb_typeof(ai_faqs),'sql_null'), count(*) from pp_cities group by 2
union all select 'cities.ai_intro', case when ai_intro is null then 'sql_null' when btrim(ai_intro)='' then 'empty' else 'text' end, count(*) from pp_cities group by 2
union all select 'pools.ai_description', case when ai_description is null then 'sql_null' when btrim(ai_description)='' then 'empty' else 'text' end, count(*) from pp_pools group by 2
union all select 'pools.price_notes', case when price_notes is null then 'sql_null' when btrim(price_notes)='' then 'empty' else 'text' end, count(*) from pp_pools group by 2
order by 1,2;