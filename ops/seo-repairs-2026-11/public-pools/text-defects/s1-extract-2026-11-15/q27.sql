-- run at 2026-11-15T23:33:47.457Z
set transaction read only;
with rx as (select '(?<![A-Za-z])(St|Dr|Mt|Ft|Ave|Blvd|Rd|Jr|Sr|Mr|Mrs|Ms|No|vs|approx|Hwy|Pkwy|Ln|Ct|Co|Inc|Dept|Univ|U\.S|a\.m|p\.m|A\.M|P\.M|e\.g|i\.e|[A-HJ-Z])\.' abbrev, '(?<=[.!?])\s+(?=[A-Z0-9\"“‘''$(])' split,
 '(?i)(?<![a-z0-9.,$])([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|a single|a pair of)(?![a-z0-9])(( (?!of )[a-z-]+){0,3}?) (pools|pool|options|option|facilities|facility|spots|spot|locations|location|aquatic centers|aquatic center|swimming spots)(?![a-z])' cnt,
 '(?i)(?<![a-z0-9.,$])([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|single)(?![a-z0-9])( public)? (listed|in our directory|on our site|we list|we track)(?![a-z])' cnt2,
 '(?i)(?<![a-z])(a couple|a few|a handful|several|a decent number|a good number|plenty)( of)?( [a-z-]+){0,2}? (pools|options|facilities|spots|listed)(?![a-z])' vague),
src as (
  select c.id, c.state_slug, c.city_slug, 'intro' f, 0 ent, c.ai_intro x from pp_cities c where c.ai_intro is not null
  union all select c.id, c.state_slug, c.city_slug, 'faq', o::int, e->>'a' from pp_cities c, jsonb_array_elements(c.ai_faqs) with ordinality a(e,o) where jsonb_typeof(c.ai_faqs)='array'),
sp as (select src.*, t.k, replace(t.z,'§','.') s from src, rx, regexp_split_to_table(regexp_replace(src.x, rx.abbrev, '\1' || '§', 'g'), rx.split) with ordinality t(z,k)),
h as (select sp.*, (regexp_match(s, rx.cnt2))[1] w2, (regexp_match(s, rx.vague))[1] wv, (select count(*) from pp_pools p where p.city_id=sp.id and p.is_published) actual
      from sp, rx where s !~ rx.cnt and (s ~ rx.cnt2 or (s ~ rx.vague and s ~* '(listed|directory|our site|we list|we track|we''ve got|we have|in town|in the city|public)')))
select state_slug||'/'||city_slug city, f, ent, k, coalesce(w2, wv) w, actual, s from h order by (w2 is null), 1 limit 25;