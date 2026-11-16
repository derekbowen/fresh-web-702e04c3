-- run at 2026-11-15T23:32:30.154Z
set transaction read only;
with rx as (select '(?<![A-Za-z])(St|Dr|Mt|Ft|Ave|Blvd|Rd|Jr|Sr|Mr|Mrs|Ms|No|vs|approx|Hwy|Pkwy|Ln|Ct|Co|Inc|Dept|Univ|U\.S|a\.m|p\.m|A\.M|P\.M|e\.g|i\.e|[A-HJ-Z])\.' abbrev, '(?<=[.!?])\s+(?=[A-Z0-9\"“‘''$(])' split,
 '(?i)(?<![a-z0-9.,$])([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|a single|a pair of)(?![a-z0-9])(( (?!of )[a-z-]+){0,3}?) (pools|pool|options|option|facilities|facility|spots|spot|locations|location|aquatic centers|aquatic center|swimming spots)(?![a-z])' cnt),
src as (
  select c.id, c.state_slug, c.city_slug, 'intro' f, 0 ent, c.ai_intro x from pp_cities c where c.ai_intro is not null
  union all select c.id, c.state_slug, c.city_slug, 'faq', o::int, e->>'a' from pp_cities c, jsonb_array_elements(c.ai_faqs) with ordinality a(e,o) where jsonb_typeof(c.ai_faqs)='array'),
sp as (select src.*, t.k, replace(t.z,'§','.') s from src, rx, regexp_split_to_table(regexp_replace(src.x, rx.abbrev, '\1' || '§', 'g'), rx.split) with ordinality t(z,k)),
hits as (select sp.*, (regexp_match(s, rx.cnt)) mm from sp, rx where s ~ rx.cnt),
v as (select h.*, lower(mm[1]) w, case when mm[1] ~ '^[0-9]+$' then mm[1]::int when lower(mm[1])='a single' then 1 when lower(mm[1])='a pair of' then 2 else (array_position(array['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'], lower(mm[1]))) end stated,
  (select count(*) from pp_pools p where p.city_id=h.id and p.is_published) actual,
  (select count(*) from pp_pools p where p.city_id=h.id and p.is_published and p.pool_type ilike '%indoor%') act_indoor,
  (select count(*) from pp_pools p where p.city_id=h.id and p.is_published and p.pool_type ilike '%outdoor%') act_outdoor from hits h)
select state_slug||'/'||city_slug city, f, ent, k, stated, actual, act_indoor ai, act_outdoor ao, mm[1]||mm[2]||' '||mm[4] phrase, s from v where stated is distinct from actual order by 1, 2, 3, 4 offset 25 limit 25;