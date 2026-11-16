-- run at 2026-11-15T22:02:54.407Z
set transaction read only;
with fp as (select '(^|[^A-Za-z''’])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|I''ll|I’ll|[Mm]y|[Mm]e|[Ww]e|[Ww]e''re|[Ww]e’re|[Ww]e''ve|[Ww]e’ve|[Ww]e''d|[Ww]e’d|[Ww]e''ll|[Oo]ur|[Uu]s|[Ff]olks)([^A-Za-z''’]|$)' r),
s as (
 select 'desc' src, x s from pp_pools, regexp_split_to_table(ai_description, '(?<=[.!?])\s+') x where ai_description is not null
 union all select 'pfaq', x from pp_pools, jsonb_array_elements(ai_faqs) e, regexp_split_to_table(e->>'a', '(?<=[.!?])\s+') x where ai_faqs is not null
 union all select 'cintro', x from pp_cities, regexp_split_to_table(ai_intro, '(?<=[.!?])\s+') x where ai_intro is not null
 union all select 'cfaq', x from pp_cities, jsonb_array_elements(ai_faqs) e, regexp_split_to_table(e->>'a', '(?<=[.!?])\s+') x where ai_faqs is not null)
select lower(array_to_string((regexp_split_to_array(regexp_replace(s,'[^A-Za-z''’ ]','','g'),'\s+'))[1:3],' ')) pre, count(*) n,
 count(*) filter (where src='desc') d, count(*) filter (where src='pfaq') pf, count(*) filter (where src='cintro') ci, count(*) filter (where src='cfaq') cf
from s, fp where s ~ r group by 1 order by 2 desc limit 120;