-- run at 2026-11-15T22:06:50.494Z
set transaction read only;
select slug, rating, review_count, price_adult, left(ai_description, 1100) d from pp_pools where ai_description ~ '(?<![A-Za-z''’-])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|[Mm]y|[Mm]e)(?![A-Za-z''’])' order by md5(id::text||'s1') limit 12;