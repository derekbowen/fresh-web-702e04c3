-- duplicate-mapping.sql
-- READ-ONLY candidate-duplicate pair generation for pp_pools (Supabase project qbzpjsiahqgyoazjurqy).
-- Every execution must start with "set transaction read only;" and this file contains SELECTs only.
-- Nothing here merges, deletes, unpublishes or updates anything.
--
-- Usage: prepend the COMMON block to ONE of the final SELECTs (A, B or C) and run it.
--   A = counts per signal      B = records that take part in a candidate pair (paged)
--   C = candidate pairs with per-signal evidence (paged)
-- Lines returned by B and C end in a 6-character md5 prefix of the line, so a copy of the
-- result can be verified offline (build_duplicate_mapping.py refuses lines whose hash is wrong).
-- The text of each call was pasted verbatim into raw/*.txt; every line was re-hashed locally (0 mismatches).
-- Re-verified 2026-11-15 ~20:40 UTC: server-side md5 over the full B and C text equals md5 of raw/records.txt
-- (419 lines) and raw/pairs.txt (291 lines); for C the 7 no-coordinate pairs were rendered as 20015087 to match.
--
-- Signals (independent of each other):
--   pid    same google_place_id
--   namec  same normalised name AND same city_id
--   addr   same normalised street (must contain a house number) AND same 5-digit zip
--   d75    coordinates within 75 m (haversine)            -- candidate only if names are similar
--   phone  same 10-digit phone                             -- candidate only if names are similar
--   web    same website (scheme, www, query, trailing / removed) -- candidate only if names similar
-- "Names similar" = Jaccard >= 0.5 on name tokens after removing generic words (pool, park, ymca ...),
--   or one token set contained in the other; when a name has only generic words: Jaccard >= 0.6 on all tokens.

set transaction read only;

-- ===== COMMON =====
with stop(w) as (select unnest(array['pool','pools','swimming','swim','aquatic','aquatics','center','centre','park','the','of','at','and','community','municipal','city','public','recreation','rec','family','complex','facility','outdoor','indoor','natatorium','splash','pad','waterpark','water','club','ymca','county','area','parks','department','dept','inc','llc'])),
abbr(w,r) as (values ('street','st'),('avenue','ave'),('av','ave'),('boulevard','blvd'),('drive','dr'),('road','rd'),('lane','ln'),('court','ct'),('place','pl'),('parkway','pkwy'),('highway','hwy'),('circle','cir'),('trail','trl'),('terrace','ter'),('square','sq'),('north','n'),('south','s'),('east','e'),('west','w'),('northeast','ne'),('northwest','nw'),('southeast','se'),('southwest','sw'),('suite','ste')),
p0 as (
  select p.id, p.slug, p.name, p.address, p.city_id, p.latitude lat, p.longitude lon, p.rating, p.review_count, p.created_at, p.updated_at,
   c.state_slug, c.city_slug,
   nullif(btrim(p.google_place_id),'') pid,
   nullif(btrim(regexp_replace(lower(p.name),'[^a-z0-9]+',' ','g')),'') nname,
   nullif(btrim(regexp_replace(lower(split_part(p.address,',',1)),'[^a-z0-9]+',' ','g')),'') street0,
   nullif(left(btrim(p.zip),5),'') zip5,
   nullif(right(regexp_replace(coalesce(p.phone,''),'[^0-9]','','g'),10),'') nphone,
   nullif(regexp_replace(regexp_replace(regexp_replace(lower(btrim(coalesce(p.website,''))),'^https?://(www\.)?',''),'[?#].*$',''),'/+$',''),'') nweb,
   case when p.latitude is null or p.longitude is null then -1
        else least(length(split_part(p.latitude::text,'.',2)), length(split_part(p.longitude::text,'.',2))) end coord_dec,
   ( (nullif(btrim(p.address),'') is not null)::int + (nullif(btrim(p.zip),'') is not null)::int + (nullif(btrim(p.phone),'') is not null)::int
   + (nullif(btrim(p.website),'') is not null)::int + (p.latitude is not null and p.longitude is not null)::int + (p.rating is not null)::int
   + (p.review_count is not null)::int + (p.price_adult is not null)::int + (p.price_child is not null)::int + (nullif(btrim(p.price_notes),'') is not null)::int
   + (nullif(btrim(p.pool_type),'') is not null)::int + (p.hours_json is not null and p.hours_json::text not in ('null','{}','[]'))::int
   + (p.amenities is not null and p.amenities::text not in ('null','{}','[]'))::int + (nullif(btrim(p.ai_description),'') is not null)::int
   + (p.ai_faqs is not null and p.ai_faqs::text not in ('null','{}','[]'))::int + (p.ai_tips is not null and p.ai_tips::text not in ('null','{}','[]'))::int
   + (nullif(btrim(p.ai_best_for),'') is not null)::int + (nullif(btrim(p.google_place_id),'') is not null)::int
   + (nullif(btrim(p.google_maps_url),'') is not null)::int + (nullif(btrim(p.image_url),'') is not null)::int + (nullif(btrim(p.hero_image_url),'') is not null)::int ) n_filled
  from pp_pools p join pp_cities c on c.id = p.city_id
  where p.is_published),
t as (
  select p0.*,
   (select string_agg(coalesce(m.r, tk.x), ' ' order by tk.ord) from unnest(string_to_array(street0,' ')) with ordinality tk(x,ord) left join abbr m on m.w = tk.x) nstreet,
   string_to_array(nname,' ') tok,
   array(select x from unnest(string_to_array(nname,' ')) x where x not in (select w from stop)) core
  from p0),
pr as (
  select a.id a_id, b.id b_id, a.slug a_slug, b.slug b_slug,
   case when a.pid is null or b.pid is null then 'm' when a.pid = b.pid then 'a' else 'd' end e_pid,
   (a.nname = b.nname) name_eq, (a.city_id = b.city_id) same_city,
   case when a.nstreet is null or b.nstreet is null or a.nstreet !~ '[0-9]' or b.nstreet !~ '[0-9]' then 'm' when a.nstreet = b.nstreet then 'a' else 'd' end e_street,
   case when a.zip5 is null or b.zip5 is null then 'm' when a.zip5 = b.zip5 then 'a' else 'd' end e_zip,
   case when a.nphone is null or b.nphone is null then 'm' when a.nphone = b.nphone then 'a' else 'd' end e_phone,
   case when a.nweb is null or b.nweb is null then 'm' when a.nweb = b.nweb then 'a' else 'd' end e_web,
   -- NULL when either record has no coordinates. (The 2026-11-15 run used the bare expression; LEAST()
   -- ignores NULLs, so those 7 pairs came back as 20015087 m. build_duplicate_mapping.py treats that value
   -- as "no coordinates". It never reaches the 75 m test, so the candidate set is the same either way.)
   case when a.lat is null or a.lon is null or b.lat is null or b.lon is null then null else
   2*6371000*asin(sqrt(least(1, power(sin(radians(b.lat-a.lat)/2),2) + cos(radians(a.lat))*cos(radians(b.lat))*power(sin(radians(b.lon-a.lon)/2),2)))) end dist_m,
   a.tok atok, b.tok btok, a.core acore, b.core bcore
  from t a join t b on a.slug < b.slug),
ev as (
  select pr.*,
   round(cardinality(array(select unnest(atok) intersect select unnest(btok)))::numeric / nullif(cardinality(array(select unnest(atok) union select unnest(btok))),0), 2) jac_all,
   case when cardinality(acore) > 0 and cardinality(bcore) > 0
        then round(cardinality(array(select unnest(acore) intersect select unnest(bcore)))::numeric / cardinality(array(select unnest(acore) union select unnest(bcore))), 2) end jac_core
  from pr
  where e_pid = 'a' or (name_eq and same_city) or (e_street = 'a' and e_zip = 'a') or coalesce(dist_m <= 75, false) or e_phone = 'a' or e_web = 'a'),
sim as (
  select ev.*,
   (case when jac_core is not null then (jac_core >= 0.5 or acore <@ bcore or bcore <@ acore) else coalesce(jac_all,0) >= 0.6 end) name_sim
  from ev),
cand as (
  select * from sim
  where e_pid = 'a' or (name_eq and same_city) or (e_street = 'a' and e_zip = 'a')
     or (coalesce(dist_m <= 75, false) and name_sim) or ((e_phone = 'a' or e_web = 'a') and name_sim)),
recs as (
  select t.*, row_number() over (order by t.slug) idx
  from t where t.id in (select a_id from cand union select b_id from cand))
-- ===== END COMMON =====

-- ===== A: counts =====
select (select count(*) from cand) candidate_pairs, (select count(*) from recs) records_in_pairs,
 count(*) filter (where e_pid='a') pid_pairs,
 count(*) filter (where name_eq and same_city) name_city_pairs,
 count(*) filter (where e_street='a' and e_zip='a') addr_zip_pairs,
 count(*) filter (where coalesce(dist_m<=75,false)) d75_pairs_any_name,
 count(*) filter (where coalesce(dist_m<=75,false) and name_sim) d75_pairs_similar_name,
 count(*) filter (where e_phone='a') phone_pairs_any_name,
 count(*) filter (where e_phone='a' and name_sim) phone_pairs_similar_name,
 count(*) filter (where e_web='a') web_pairs_any_name,
 count(*) filter (where e_web='a' and name_sim) web_pairs_similar_name,
 count(*) all_signal_pairs,
 count(*) filter (where not (e_pid='a' or (name_eq and same_city) or (e_street='a' and e_zip='a') or name_sim)) weak_pairs_dropped_names_differ
from sim;

-- ===== B: records (run three times: idx 1-110, 111-260, 261-420) -> raw/records.txt =====
-- select string_agg(l || '^' || left(md5(l),6), E'\n' order by idx) from (
--   select idx, concat_ws('^', idx, slug, state_slug, city_slug, replace(name,'^',' '), coalesce(replace(left(address,70),'^',' '),''), coalesce(zip5,''),
--     (pid is not null)::int, (nphone is not null)::int, (nweb is not null)::int, coord_dec, coalesce(rating::text,''), coalesce(review_count::text,''),
--     n_filled, to_char(created_at,'YYYY-MM-DD'), to_char(updated_at,'YYYY-MM-DD')) l
--   from recs) x where idx between 1 and 110;

-- ===== C: pairs (one call, 291 lines) -> raw/pairs.txt =====
-- select string_agg(l || '^' || left(md5(l),6), E'\n' order by ia, ib) from (
--   select ra.idx ia, rb.idx ib, concat_ws('^', ra.idx, rb.idx, e_pid, name_eq::int, same_city::int, name_sim::int, coalesce(jac_all::text,''), coalesce(jac_core::text,''),
--     e_street, e_zip, coalesce(round(dist_m::numeric,0)::text,''), e_phone, e_web) l
--   from cand join recs ra on ra.id = cand.a_id join recs rb on rb.id = cand.b_id) x;
