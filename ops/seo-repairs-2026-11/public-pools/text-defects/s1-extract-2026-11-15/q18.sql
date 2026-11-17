-- run at 2026-11-15T22:17:38.040Z
set transaction read only;
with rx as (select '(?<![A-Za-z''’-])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|I''ll|I’ll|[Mm]y|[Mm]e|[Mm]ine|[Mm]yself)(?![A-Za-z''’]|-[0-9])' sing, '(?<![A-Za-z''’])([Ww]e|[Ww]e''re|[Ww]e’re|[Ww]e''ve|[Ww]e’ve|[Ww]e''d|[Ww]e’d|[Ww]e''ll|[Ww]e’ll|[Oo]ur|[Oo]urs|[Uu]s|[Oo]urselves)(?![A-Za-z''’])' plur, '(?<![A-Za-z])([Aa]round here|[Dd]own here|[Uu]p here|[Oo]ut here|[Hh]ere in [A-Z]|[Ff]olks here|[Ff]olks in (this|these|our))(?![A-Za-z])' loc,
 '(?<![A-Za-z])(St|Dr|Mt|Ft|Ave|Blvd|Rd|Jr|Sr|Mr|Mrs|Ms|No|vs|approx|Hwy|Pkwy|Ln|Ct|Co|Inc|Dept|Univ|U\.S|a\.m|p\.m|A\.M|P\.M|e\.g|i\.e|[A-HJ-Z])\.' abbrev, '(?<=[.!?])\s+(?=[A-Z0-9\"“‘''$(])' split),
src as (
  select 'p.desc' col, p.ai_description x from pp_pools p where p.ai_description is not null
  union all select 'p.faq', e->>'a' from pp_pools p, jsonb_array_elements(p.ai_faqs) e where jsonb_typeof(p.ai_faqs) = 'array'
  union all select 'p.tip', e from pp_pools p, jsonb_array_elements_text(p.ai_tips) e where jsonb_typeof(p.ai_tips) = 'array'
  union all select 'c.intro', c.ai_intro from pp_cities c where c.ai_intro is not null
  union all select 'c.faq', e->>'a' from pp_cities c, jsonb_array_elements(c.ai_faqs) e where jsonb_typeof(c.ai_faqs) = 'array'),
sp as (select col, replace(z, '§', '.') s from src, rx, regexp_split_to_table(regexp_replace(src.x, rx.abbrev, '\1' || '§', 'g'), rx.split) z),
nn as (select sp.* from sp, rx where not (s ~ rx.sing or s ~ rx.plur or s ~ rx.loc)),
h as (select col, s, lower((regexp_match(s, '(?i)(?<![a-z])(folks|locals?|here in|in this (area|town|city|part)|this part of|sounds like|seems like|from what|tells (me|you)|honestly|you know|personally|let me|trust me|frankly|to be honest|y''all|i''d|i’d|id|im|i''m|ive|i''ve|i|my|me|we|our|us|ours)(?![a-z])'))[1]) hint from nn)
select hint, count(*) n, count(*) filter (where col like 'p.%') p, count(*) filter (where col like 'c.%') c, min(left(s,160)) example from h where hint is not null group by 1 order by 2 desc limit 30;