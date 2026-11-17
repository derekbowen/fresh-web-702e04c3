-- run at 2026-11-15T23:33:24.820Z
set transaction read only;
with rx as (select '(?<![A-Za-z])(St|Dr|Mt|Ft|Ave|Blvd|Rd|Jr|Sr|Mr|Mrs|Ms|No|vs|approx|Hwy|Pkwy|Ln|Ct|Co|Inc|Dept|Univ|U\.S|a\.m|p\.m|A\.M|P\.M|e\.g|i\.e|[A-HJ-Z])\.' abbrev, '(?<=[.!?])\s+(?=[A-Z0-9\"“‘''$(])' split,
 '(?i)(?<![a-z0-9.,$])([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|a single|a pair of)(?![a-z0-9])(( (?!of )[a-z-]+){0,3}?) (pools|pool|options|option|facilities|facility|spots|spot|locations|location|aquatic centers|aquatic center|swimming spots)(?![a-z])' cnt),
src as (
  select c.id, c.state_slug, c.city_slug, 'intro' f, c.ai_intro x from pp_cities c where c.ai_intro is not null
  union all select c.id, c.state_slug, c.city_slug, 'faq', e->>'a' from pp_cities c, jsonb_array_elements(c.ai_faqs) e where jsonb_typeof(c.ai_faqs)='array'),
sp as (select src.*, replace(t.z,'§','.') s from src, rx, regexp_split_to_table(regexp_replace(src.x, rx.abbrev, '\1' || '§', 'g'), rx.split) t(z)),
miss as (select state_slug||'/'||city_slug city, f, (select count(*) from pp_pools p where p.city_id=sp.id and p.is_published) actual, s
 from sp, rx where s !~ rx.cnt and s ~* '(directory|we list|we track|listed|on our site|our site|in our system|we''ve got)' and s ~* '(?<![a-z])([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|couple|few|handful|several|single)(?![a-z])')
select 'missed' k, city, f, actual, left(s, 220) s from (select * from miss order by md5(s) limit 18) a
union all select 'fffd_counts', null, null, null, (select count(*) from pp_cities where meta_description like '%'||chr(65533)||'%')||' city meta_description; '||(select count(*) from pp_cities where meta_title like '%'||chr(65533)||'%')||' city meta_title; '||(select count(*) from pp_cities where concat(ai_intro,ai_faqs::text) like '%'||chr(65533)||'%')||' city intro/faq; '||(select count(*) from pp_pools where concat(name,ai_description,ai_faqs::text,ai_tips::text,ai_best_for,price_notes) like '%'||chr(65533)||'%')||' pool rows'
union all select 'meta_25hr', null, null, null, (select count(*) from pp_cities where meta_description ~ '\$25/hr')::text;