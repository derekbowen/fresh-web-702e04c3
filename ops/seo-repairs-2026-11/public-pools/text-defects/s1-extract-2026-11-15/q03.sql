-- run at 2026-11-15T22:01:03.825Z
set transaction read only;
with a as (select id, ai_best_for::jsonb j, ai_best_for raw from pp_pools where ai_best_for is not null)
select
 count(*) rows_,
 count(*) filter (where jsonb_array_length(j)=0) empty_arr,
 min(jsonb_array_length(j)) minlen, max(jsonb_array_length(j)) maxlen,
 count(*) filter (where exists (select 1 from jsonb_array_elements(j) e where jsonb_typeof(e)<>'string')) nonstring_el,
 count(*) filter (where exists (select 1 from jsonb_array_elements_text(j) e where btrim(e)='')) blank_el,
 count(*) filter (where exists (select 1 from jsonb_array_elements_text(j) e where e ~ '[,;]')) el_with_comma,
 count(*) filter (where exists (select 1 from jsonb_array_elements_text(j) e where e ~ '[<>\[\]{}"\\]')) el_with_markup,
 count(*) filter (where exists (select 1 from jsonb_array_elements_text(j) e where e ~* '\m(i|my|we|our|you)\M')) el_pronoun,
 count(*) filter (where exists (select 1 from jsonb_array_elements_text(j) e where e ~* 'insur|liab|coverag|claim|damag')) el_insurance,
 count(*) filter (where raw <> j::text) raw_differs_from_canonical,
 count(*) filter (where (select count(*) from jsonb_array_elements_text(j))<>(select count(distinct lower(btrim(e))) from jsonb_array_elements_text(j) e)) dup_el,
 max((select max(length(e)) from jsonb_array_elements_text(j) e)) max_el_len
from a;