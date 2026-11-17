-- run at 2026-11-15T22:14:45.130Z
set transaction read only;
with rx as (select '(?<![A-Za-z''’-])(I|I''m|I’m|I''d|I’d|I''ve|I’ve|I''ll|I’ll|[Mm]y|[Mm]e|[Mm]ine|[Mm]yself)(?![A-Za-z''’]|-[0-9])' sing, '(?<![A-Za-z''’])([Ww]e|[Ww]e''re|[Ww]e’re|[Ww]e''ve|[Ww]e’ve|[Ww]e''d|[Ww]e’d|[Ww]e''ll|[Ww]e’ll|[Oo]ur|[Oo]urs|[Uu]s|[Oo]urselves)(?![A-Za-z''’])' plur, '(?<![A-Za-z])([Aa]round here|[Dd]own here|[Uu]p here|[Oo]ut here|[Hh]ere in [A-Z]|[Ff]olks here|[Ff]olks in (this|these|our))(?![A-Za-z])' loc, '(PoolRentalNearMe|Pool Rental Near Me|(?<![A-Za-z])[Oo]ur (directory|site|website|listings?|database|map|platform|records|pages?|list)(?![A-Za-z])|(?<![A-Za-z])[Ww]e (currently |only |also |do |just )?(list|track|show|feature|include|cover|help|connect|offer|built|started|let|make)(?![A-Za-z])|[Ww]e(''|’)ve listed|where we come in|[Ww]e (don''t|don’t|do not) (currently )?(have|list|show|track)[^.]{0,60}(listed|directory|site|track)|[Ww]e(''|’)re (working|adding|building|growing|still adding))' site, '(Phase|Pool|Building|Area|Section|Level|Unit|Part|Title|War|Class|Type|Lot|Zone|Tier|Stage|Chapter|Team|Division|Field|Park|Gate|Court) I(?![A-Za-z''’])' roman, '(?i)((my|our) (information|info|data|records|details|sources|system|notes)|(^|[^a-z])i (don''t|don’t|do not|can''t|can’t|cannot|couldn''t|couldn’t|didn''t|didn’t|haven''t|haven’t|have no|wasn''t able|wasn’t able|was unable|am unable|only have|have only|could not|did not)(?![a-z])|i(''m|’m) (not (sure|aware|certain|able)|unable)|the (information|info|data|details) i (have|found|see|could find)|(isn''t|isn’t|aren''t|aren’t|is not|are not|not) something i|not in my)' gap,
  '(?i)^((yes|no|honestly|personally|again|also|still|so|otherwise|either way|in any case|just|overall|that said|for (details|specifics|more|the most|current|up-to-date|accurate|exact|other|specific|anything)[^,.]{0,80}|(if|when|before|to)[^,.]{0,100}),?\s+)?(i(''d|’d| would)( definitely| still| probably| also| personally| always| really| strongly| just| highly| first)?\s+(suggest|recommend|call|check|give|reach|contact|look|lean|ask|confirm|verify|double-check|visit|plan|try|head|arrive|go|bring|pack|start|scout|stick|search|email|phone|stop by|swing by|get in touch|say give|say call|say check)|i (always |usually |generally |strongly |personally |highly |would |also |just )?(recommend|suggest|tell|advise|encourage)|my (advice|suggestion|recommendation|tip|go-to)|if i were you)(?![a-z])' advice, '(?i)^((yes|no|honestly|personally|again|also|still|so|otherwise|either way|in any case|just|overall|that said|for (details|specifics|more|the most|current|up-to-date|accurate|exact|other|specific|anything)[^,.]{0,80}|(if|when|before|to)[^,.]{0,100}),?\s+)?(your best bet is|it(''s|’s| is) (always |probably |usually |generally )?(best|a good idea|smart|wise|worth|safest|good) to|it never hurts to|you(''ll|’ll)? (should|can|could|might|may|would|will)? ?(want to |need to |also |always |definitely )?(call|check|contact|visit|confirm|ask|refer|look|reach|verify|find|search|try)|(call|check|contact|visit|confirm|ask|look|reach|verify|search|try|give them)(?![a-z])|a quick (call|search|look|check)|calling (ahead|them|the)|checking (their|the|with))' gadv, '(?i)^(the |their )?(listing|information|info|data|details|website|site|source|page)s? (doesn''t|doesn’t|does not|don''t|don’t|didn''t|didn’t|isn''t|isn’t|aren''t|aren’t) (specify|mention|list|include|show|say|have|provide|give)(?![a-z])' ggap, '(?i)((this|that|the|which|each|any|no|every|some|another|other|a good|a great|a solid|a nice|the only|a popular|a fun|a decent) one(?![a-z])|(?<![a-z])one of|someone|anyone|everyone|no one|one-stop)' nmask, '(?i)[0-9$%]|(?<![a-z])(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|dozen|dozens|half|single|couple|pair|once|twice|first|second|third)(?![a-z])' num, '(?i)(www\.|https?://|@|\.(com|org|gov|net|edu|us)(?![a-z]))' url,
  '(?i)(?<![a-z])(but|however|although|though|while|whereas|yet|except|since|because|given|which|unless|so that)(?![a-z])|;|:|—|–| - ' clause, '(?i)(?<![a-z])(free|no charge|no cost|cheap|inexpensive|affordable|pricey|expensive|bucks?|dollars?|admission|fees?|prices?|pricing|costs?|ratings?|rated|stars?|reviews?|reviewers?|reviewed|slides?|waterslides?|diving|dive|boards?|laps?|lanes?|splash|lazy river|wading|kiddie|toddlers?|shallow|deep end|heated|indoor|outdoor|open-air|olympic|competition|hot tub|spa|sauna|jacuzzi|lockers?|locker rooms?|showers?|changing rooms?|restrooms?|concessions?|snack bar|picnic|shade|shaded|cabanas?|lifeguards?|parking|accessible|accessibility|ada|wheelchair|lift|lessons?|aerobics|water polo|fountains?|playground|zero-entry|zero-depth|beach entry|wave pool|grills?|bbq|diving well|water ?park|fitness|gym|tennis|open|opens|opened|closed|closes|closing|hours|daily|weekdays?|weekends?|mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?|year-round|year round|all year|seasonal|memorial day|labor day|january|february|march|april|june|july|august|september|october|november|december|mornings?|evenings?|night|noon|midnight|residents?|members?|membership|passes|day pass|season pass)(?![a-z])' lex, '(?i)(?<![a-z])(insur[a-z]*|liabilit[a-z]*|liable|coverage|covered|covers?|claims?|claimed|damag[a-z]*)(?![a-z])' ins, '^((So|Plus|Also|But|And|Or|Still|However|Though|Although|Otherwise|Then|Yet|Even|That|That''s|That’s|This|These|Those|Which|It|It''s|It’s|Its|They|They''re|They’re|They''ve|They’ve|They''ll|They’ll|Their|Them|There|There''s|There’s|He|She|Both|Either|Neither|Anyway|Besides|Again|Instead|Thus|Hence|Therefore|Because|Since|Too|Such|Same|Other|Another|Others)(?![A-Za-z''’])|[a-z])' dangle, '(?<![A-Za-z])(St|Dr|Mt|Ft|Ave|Blvd|Rd|Jr|Sr|Mr|Mrs|Ms|No|vs|approx|Hwy|Pkwy|Ln|Ct|Co|Inc|Dept|Univ|U\.S|a\.m|p\.m|A\.M|P\.M|e\.g|i\.e|[A-HJ-Z])\.' abbrev, '(?<=[.!?])\s+(?=[A-Z0-9\"“‘''$(])' split,
  '[A-Z][a-z]' cap),
src as (
  select 'p.desc' col, p.id rid, 0 ent, p.ai_description x, p.name n1, p.city n2,
         initcap(replace(c.state_slug,'-',' ')) n3
    from pp_pools p left join pp_cities c on c.id = p.city_id where p.ai_description is not null
  union all
  select 'p.faq', p.id, o::int, e->>'a', p.name, p.city, initcap(replace(c.state_slug,'-',' '))
    from pp_pools p left join pp_cities c on c.id = p.city_id, jsonb_array_elements(p.ai_faqs) with ordinality a(e,o)
   where jsonb_typeof(p.ai_faqs) = 'array'
  union all
  select 'p.tip', p.id, o::int, e, p.name, p.city, initcap(replace(c.state_slug,'-',' '))
    from pp_pools p left join pp_cities c on c.id = p.city_id, jsonb_array_elements_text(p.ai_tips) with ordinality a(e,o)
   where jsonb_typeof(p.ai_tips) = 'array'
  union all
  select 'c.intro', c.id, 0, c.ai_intro, null, c.city_name, initcap(replace(c.state_slug,'-',' '))
    from pp_cities c where c.ai_intro is not null
  union all
  select 'c.faq', c.id, o::int, e->>'a', null, c.city_name, initcap(replace(c.state_slug,'-',' '))
    from pp_cities c, jsonb_array_elements(c.ai_faqs) with ordinality a(e,o) where jsonb_typeof(c.ai_faqs) = 'array'),
sp as (
  select src.col, src.rid, src.ent, src.n1, src.n2, src.n3, t.k::int k, replace(t.z, '§', '.') s
    from src, rx, regexp_split_to_table(regexp_replace(src.x, rx.abbrev, '\1' || '§', 'g'), rx.split) with ordinality t(z, k)
   where t.z <> ''),
m as (
  select sp.*, regexp_replace(sp.s, rx.roman, '\1 _', 'g') ms from sp, rx),
k as (
  select m.*,
    case when ms ~ rx.sing then 'singular'
         when (ms ~ rx.plur or ms ~ rx.loc) and ms ~ rx.site then null
         when ms ~ rx.plur then 'plural' when ms ~ rx.loc then 'local' end kind,
    regexp_replace(s, rx.nmask, 'X', 'g') ~ rx.num has_num,
    s ~ rx.url has_url, s ~ rx.clause has_clause, s ~ rx.lex has_lex, s ~ rx.ins has_ins,
    s ~ rx.gap is_gap, s ~ rx.advice is_adv, (s ~ rx.gadv or s ~ rx.ggap) is_generic,
    regexp_replace(replace(replace(replace(coalesce(substring(s from ' (.*)$'), ''), coalesce(n1, '\u0001'), ' '),
      coalesce(n2, '\u0001'), ' '), coalesce(n3, '\u0001'), ' '), rx.sing, ' ', 'g') ~ rx.cap has_entity,
    s ~ rx.dangle dangles
  from m, rx),
c as (
  select k.*,
    case when kind is null then null when has_ins then 'insurance' when is_gap then 'gap'
         when is_adv then 'advice' else 'opinion' end cls,
    case when kind is null then null when has_ins then 'insurance' when has_num then 'number'
         when has_url then 'url_or_contact' when has_clause then 'second_clause'
         when not is_gap and not is_adv and has_lex then 'fact_vocabulary' end why
  from k),
d as (
  select c.*, (kind is not null and why is null) del,
    (kind is null and is_generic and not has_num and not has_url and not has_clause) gen_ok
  from c)
select col, coalesce(kind,'-') kind, coalesce(cls,'-') cls, coalesce(why,'deletable') why, count(*) n, count(distinct rid) rows_
from d where kind is not null group by 1,2,3,4 order by 1,5 desc;