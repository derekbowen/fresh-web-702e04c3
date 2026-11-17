-- run at 2026-11-15T22:08:14.775Z
set transaction read only;
select c.state_abbr, c.city_slug, (select count(*) from pp_pools p where p.city_id=c.id and p.is_published) actual, left(ai_intro, 900) intro from pp_cities c where ai_intro ~ '(?<![A-Za-z''’])(I|I''m|I''d|I’d|[Mm]y|[Mm]e|[Ww]e|[Ww]e''ve|[Ww]e’ve|[Ww]e''re|[Oo]ur|[Uu]s|[Ff]olks)(?![A-Za-z''’])' order by md5(c.id::text||'s3') limit 12;