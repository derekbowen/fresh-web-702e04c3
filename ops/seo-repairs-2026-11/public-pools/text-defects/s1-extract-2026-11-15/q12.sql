-- run at 2026-11-15T22:07:18.340Z
set transaction read only;
select p.slug, o, left(e->>'q',90) q, left(e->>'a',420) a from pp_pools p, jsonb_array_elements(ai_faqs) with ordinality a(e,o) where ai_faqs is not null and e->>'a' ~ '(?<![A-Za-z''’-])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|[Mm]y|[Mm]e)(?![A-Za-z''’])' order by md5(p.id::text||o::text||'s2') limit 25;