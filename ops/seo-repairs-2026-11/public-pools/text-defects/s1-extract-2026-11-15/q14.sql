-- run at 2026-11-15T22:09:10.798Z
set transaction read only;
(select 'tip' k, p.slug, left(e,300) x from pp_pools p, jsonb_array_elements_text(ai_tips) e where ai_tips is not null and e ~ '(?<![A-Za-z''’-])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|[Mm]y|[Mm]e|[Ww]e|[Oo]ur|[Ff]olks)(?![A-Za-z''’])' order by md5(e||'s4') limit 12)
union all
(select 'pq', p.slug, left(e->>'q',200) from pp_pools p, jsonb_array_elements(ai_faqs) e where ai_faqs is not null and e->>'q' ~ '(?<![A-Za-z''’-])(I|I''m|I''d|[Mm]y|[Mm]e|[Ww]e|[Oo]ur|[Uu]s)(?![A-Za-z''’])' order by md5(e::text||'s4') limit 7)
union all
(select 'cq', c.city_slug, left(e->>'q',200) from pp_cities c, jsonb_array_elements(ai_faqs) e where ai_faqs is not null and e->>'q' ~ '(?<![A-Za-z''’-])(I|I''m|I''d|[Mm]y|[Mm]e|[Ww]e|[Oo]ur|[Uu]s)(?![A-Za-z''’])' order by md5(e::text||'s4') limit 6);