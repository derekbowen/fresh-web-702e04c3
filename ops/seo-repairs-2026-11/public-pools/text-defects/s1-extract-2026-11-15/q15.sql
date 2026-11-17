-- run at 2026-11-15T22:13:35.266Z
set transaction read only;
select (select count(*) from pp_pools where concat_ws(' ',ai_description,ai_faqs::text,ai_tips::text,ai_best_for) like '%§%') pools_with_mark,
       (select count(*) from pp_cities where concat_ws(' ',ai_intro,ai_faqs::text) like '%§%') cities_with_mark,
       (select count(*) from pp_pools where concat_ws(' ',ai_description,ai_faqs::text,ai_tips::text) ~ E'\n') pools_with_newline,
       (select count(*) from pp_cities where concat_ws(' ',ai_intro,ai_faqs::text) ~ E'\n') cities_with_newline,
       (select count(*) from pp_pools where ai_description ~ E'\n\n') desc_paragraphs,
       (select count(*) from pp_cities where ai_intro ~ E'\n\n') intro_paragraphs;