set transaction read only;
-- PENDING-READS P3 (review 2026-11-16, findings F13 and F18): exact database text of fee sentences seen only in the
-- 2026-11-14 crawl, or only in one body column. Turns crawl-gap-candidates rows into byte-exact FIX rows.
-- run: psql "$DB" -X -1 -v ON_ERROR_STOP=1 -A -F "$(printf '\t')" -f pending/p3_f13_exact_lines.sql > p3-lines.tsv
-- Small result: only lines matching the stale-net / wording patterns on the slugs below (expect about 40 rows).
select c.id, c.slug, v.col, x.lno, x.ln
from public.content_pages c
cross join lateral (values ('content', c.content), ('body_markdown', c.body_markdown)) v(col, val)
cross join lateral regexp_split_to_table(coalesce(v.val, ''), E'\n') with ordinality as x(ln, lno)
where c.slug in (
  'become-a-swimming-pool-host-carlsbad-nm', 'become-a-swimming-pool-host-opelousas-la',
  'become-a-swimming-pool-host-riverview-fl', 'become-a-swimming-pool-host-wilkinsburg-pa',
  'become-a-swimming-pool-host-knightsen-ca', 'huntingtown-md', 'become-a-swimming-pool-host-pataskala-oh',
  'become-a-swimming-pool-host-kearney-ne', 'become-a-swimming-pool-host-gold-canyon-az',
  'become-a-swimming-pool-host-grand-prairie-tx', 'become-a-swimming-pool-host-cameron-park-ca',
  'become-a-swimming-pool-host-elk-city-ok', 'become-a-swimming-pool-host-byhalia-ms',
  'become-a-swimming-pool-host-grosse-pointe-farms-mi', 'become-a-swimming-pool-host-grosse-pointe-park-mi',
  'become-a-swimming-pool-host-reynoldsburg-oh', 'become-a-swimming-pool-host-freehold-nj',
  'conviertete-en-anfitrion-de-alberca-allentown-pa', 'conviertete-en-anfitrion-de-alberca-kennewick-wa',
  'become-a-swimming-pool-host-owensboro', 'become-a-swimming-pool-host-saratoga-springs-ny')
  and x.ln ~* '(\$\s?90\M|\$54\M|\$1,800|\$1,080|of every \$|out of every \$|small cut|its cut|minimal fee|after the fee|small fee covers|our fee at a 0%|Profit:)'
order by c.slug, v.col, x.lno;
