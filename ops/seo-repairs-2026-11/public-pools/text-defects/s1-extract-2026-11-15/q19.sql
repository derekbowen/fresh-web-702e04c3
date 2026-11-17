-- run at 2026-11-15T22:19:09.295Z
set transaction read only;
with rx as (select '(?<![A-Za-z])(St|Dr|Mt|Ft|Ave|Blvd|Rd|Jr|Sr|Mr|Mrs|Ms|No|vs|approx|Hwy|Pkwy|Ln|Ct|Co|Inc|Dept|Univ|U\.S|a\.m|p\.m|A\.M|P\.M|e\.g|i\.e|[A-HJ-Z])\.' abbrev, '(?<=[.!?])\s+(?=[A-Z0-9\"“‘''$(])' split),
src as (
  select 'p.desc' col, p.slug ref, p.ai_description x from pp_pools p where p.ai_description is not null
  union all select 'p.faq', p.slug, e->>'a' from pp_pools p, jsonb_array_elements(p.ai_faqs) e where jsonb_typeof(p.ai_faqs) = 'array'
  union all select 'c.intro', c.state_slug||'/'||c.city_slug, c.ai_intro from pp_cities c where c.ai_intro is not null
  union all select 'c.faq', c.state_slug||'/'||c.city_slug, e->>'a' from pp_cities c, jsonb_array_elements(c.ai_faqs) e where jsonb_typeof(c.ai_faqs) = 'array'),
sp as (select col, ref, replace(z, '§', '.') s from src, rx, regexp_split_to_table(regexp_replace(src.x, rx.abbrev, '\1' || '§', 'g'), rx.split) z)
select col, ref, s from sp where s ~* '(poolrentalnearme|pool rental near me|this site|this website|our site|our platform|my (site|company|business|platform))' and s ~ '(?<![A-Za-z''’-])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|[Mm]y|[Mm]e)(?![A-Za-z]|[''’][A-Za-z])' order by 1,2 limit 25;