-- run at 2026-11-15T22:06:36.122Z
set transaction read only;
with t as (
 select 'p.desc' col, p.id rid, 0 ent, p.ai_description x from pp_pools p where ai_description is not null
 union all select 'p.faq.a', p.id, o::int, e->>'a' from pp_pools p, jsonb_array_elements(ai_faqs) with ordinality a(e,o) where ai_faqs is not null
 union all select 'p.tips', p.id, o::int, e from pp_pools p, jsonb_array_elements_text(ai_tips) with ordinality a(e,o) where ai_tips is not null
 union all select 'c.intro', c.id, 0, ai_intro from pp_cities c where ai_intro is not null
 union all select 'c.faq.a', c.id, o::int, e->>'a' from pp_cities c, jsonb_array_elements(ai_faqs) with ordinality a(e,o) where ai_faqs is not null),
s as (select col, rid, ent, replace(z,'§','.') s from t, regexp_split_to_table(regexp_replace(x, '(?<![A-Za-z])(St|Dr|Mt|Ft|Ave|Blvd|Rd|Jr|Sr|Mr|Mrs|Ms|No|vs|approx|Hwy|Pkwy|Ln|Ct|Co|Inc|Dept|Univ|U\.S|a\.m|p\.m|e\.g|i\.e|[A-HJ-Z])\.', '\1§', 'g'), '(?<=[.!?])\s+(?=[A-Z0-9"“‘''$(])') z),
c as (select *,
 s ~ '(?<![A-Za-z''’-])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|I''ll|I’ll|[Mm]y|[Mm]e|[Mm]ine|[Mm]yself)(?![A-Za-z''’]|-[0-9])' sing,
 s ~ '(?<![A-Za-z''’])([Ww]e|[Ww]e''re|[Ww]e’re|[Ww]e''ve|[Ww]e’ve|[Ww]e''d|[Ww]e’d|[Ww]e''ll|[Ww]e’ll|[Oo]ur|[Oo]urs|[Uu]s|[Ff]olks)(?![A-Za-z''’])' plur,
 s ~* '[0-9$%]|(?<![a-z])(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|fifty|hundred|dozen)(?![a-z])' num
 from s)
select col, count(*) sents, count(*) filter (where sing) sing, count(*) filter (where plur and not sing) plur_only, count(*) filter (where (sing or plur) and num) narr_with_num, count(distinct rid) filter (where sing or plur) rows_any from c group by rollup(col);