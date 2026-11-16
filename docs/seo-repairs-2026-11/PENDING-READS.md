# Pending production reads — step 04 (comparison duplicates, canonical host)

The production database tool hung on 2026-11-16, so these read-only queries
could not be run. Everything in this step was built from saved snapshots
(2026-11-15) and live GETs (2026-11-15 and 2026-11-16); each query below
confirms one assumption those snapshots carry. Run each one as written. All are
`SELECT` only, inside a read-only transaction, with small results.

No SQL in this step changes production. The code change does all the work.
If R1 finds database body links, the content-repair step rewrites them with the
guarded template at the end of this file.

## R1 — body links to the 78 bare comparison URLs that now 301

Confirms: no database body links to a URL that now redirects. The 2026-11-14
audit crawl found **0 links** to any of the 156 URLs (bare or state-suffixed)
across all 10,074 sitemap pages, and `src/**` has no literal for any of them.
That crawl covers every rendered sitemap page, but it does not cover rows that
are not in a sitemap, or text that never renders. Expected result: 0 rows.

`(?![a-z0-9-])` stops `/p/...-in-boston` from matching `/p/...-in-boston-ma`.
The pattern matches relative, `www.` and bare-domain absolute links.

```sql
set transaction read only;
with t(path) as (values
  ('/p/giggster-vs-pool-rental-near-me-in-boston'),
  ('/p/giggster-vs-pool-rental-near-me-in-carrollton'),
  ('/p/giggster-vs-pool-rental-near-me-in-charlotte'),
  ('/p/giggster-vs-pool-rental-near-me-in-cincinnati'),
  ('/p/giggster-vs-pool-rental-near-me-in-dallas'),
  ('/p/giggster-vs-pool-rental-near-me-in-denver'),
  ('/p/giggster-vs-pool-rental-near-me-in-el-paso'),
  ('/p/giggster-vs-pool-rental-near-me-in-escondido'),
  ('/p/giggster-vs-pool-rental-near-me-in-fort-worth'),
  ('/p/giggster-vs-pool-rental-near-me-in-franklin'),
  ('/p/giggster-vs-pool-rental-near-me-in-fresno'),
  ('/p/giggster-vs-pool-rental-near-me-in-frisco'),
  ('/p/giggster-vs-pool-rental-near-me-in-glendale'),
  ('/p/giggster-vs-pool-rental-near-me-in-hayward'),
  ('/p/giggster-vs-pool-rental-near-me-in-houston'),
  ('/p/giggster-vs-pool-rental-near-me-in-huntington-beach'),
  ('/p/giggster-vs-pool-rental-near-me-in-indianapolis'),
  ('/p/giggster-vs-pool-rental-near-me-in-lakewood'),
  ('/p/giggster-vs-pool-rental-near-me-in-littleton'),
  ('/p/giggster-vs-pool-rental-near-me-in-louisville'),
  ('/p/giggster-vs-pool-rental-near-me-in-memphis'),
  ('/p/giggster-vs-pool-rental-near-me-in-mesa'),
  ('/p/giggster-vs-pool-rental-near-me-in-murfreesboro'),
  ('/p/giggster-vs-pool-rental-near-me-in-murrieta'),
  ('/p/giggster-vs-pool-rental-near-me-in-nashville'),
  ('/p/giggster-vs-pool-rental-near-me-in-norfolk'),
  ('/p/giggster-vs-pool-rental-near-me-in-north-las-vegas'),
  ('/p/giggster-vs-pool-rental-near-me-in-phoenix'),
  ('/p/giggster-vs-pool-rental-near-me-in-plano'),
  ('/p/giggster-vs-pool-rental-near-me-in-portland'),
  ('/p/giggster-vs-pool-rental-near-me-in-raleigh'),
  ('/p/giggster-vs-pool-rental-near-me-in-richmond'),
  ('/p/giggster-vs-pool-rental-near-me-in-rockville'),
  ('/p/giggster-vs-pool-rental-near-me-in-roseville'),
  ('/p/giggster-vs-pool-rental-near-me-in-san-diego'),
  ('/p/giggster-vs-pool-rental-near-me-in-santa-clara'),
  ('/p/giggster-vs-pool-rental-near-me-in-scottsdale'),
  ('/p/giggster-vs-pool-rental-near-me-in-sunnyvale'),
  ('/p/giggster-vs-pool-rental-near-me-in-tempe'),
  ('/p/giggster-vs-pool-rental-near-me-in-the-woodlands'),
  ('/p/giggster-vs-pool-rental-near-me-in-tulsa'),
  ('/p/peerspace-vs-pool-rental-near-me-in-boston'),
  ('/p/peerspace-vs-pool-rental-near-me-in-carlsbad'),
  ('/p/peerspace-vs-pool-rental-near-me-in-carrollton'),
  ('/p/peerspace-vs-pool-rental-near-me-in-charlotte'),
  ('/p/peerspace-vs-pool-rental-near-me-in-cincinnati'),
  ('/p/peerspace-vs-pool-rental-near-me-in-dallas'),
  ('/p/peerspace-vs-pool-rental-near-me-in-denver'),
  ('/p/peerspace-vs-pool-rental-near-me-in-el-paso'),
  ('/p/peerspace-vs-pool-rental-near-me-in-fort-worth'),
  ('/p/peerspace-vs-pool-rental-near-me-in-franklin'),
  ('/p/peerspace-vs-pool-rental-near-me-in-fresno'),
  ('/p/peerspace-vs-pool-rental-near-me-in-frisco'),
  ('/p/peerspace-vs-pool-rental-near-me-in-glendale'),
  ('/p/peerspace-vs-pool-rental-near-me-in-houston'),
  ('/p/peerspace-vs-pool-rental-near-me-in-huntington-beach'),
  ('/p/peerspace-vs-pool-rental-near-me-in-indianapolis'),
  ('/p/peerspace-vs-pool-rental-near-me-in-lakewood'),
  ('/p/peerspace-vs-pool-rental-near-me-in-littleton'),
  ('/p/peerspace-vs-pool-rental-near-me-in-los-angeles'),
  ('/p/peerspace-vs-pool-rental-near-me-in-louisville'),
  ('/p/peerspace-vs-pool-rental-near-me-in-murfreesboro'),
  ('/p/peerspace-vs-pool-rental-near-me-in-nashville'),
  ('/p/peerspace-vs-pool-rental-near-me-in-new-york'),
  ('/p/peerspace-vs-pool-rental-near-me-in-norfolk'),
  ('/p/peerspace-vs-pool-rental-near-me-in-north-las-vegas'),
  ('/p/peerspace-vs-pool-rental-near-me-in-phoenix'),
  ('/p/peerspace-vs-pool-rental-near-me-in-plano'),
  ('/p/peerspace-vs-pool-rental-near-me-in-portland'),
  ('/p/peerspace-vs-pool-rental-near-me-in-rockville'),
  ('/p/peerspace-vs-pool-rental-near-me-in-round-rock'),
  ('/p/peerspace-vs-pool-rental-near-me-in-san-diego'),
  ('/p/peerspace-vs-pool-rental-near-me-in-santa-clara'),
  ('/p/peerspace-vs-pool-rental-near-me-in-scottsdale'),
  ('/p/peerspace-vs-pool-rental-near-me-in-sunnyvale'),
  ('/p/peerspace-vs-pool-rental-near-me-in-tampa'),
  ('/p/peerspace-vs-pool-rental-near-me-in-tempe'),
  ('/p/peerspace-vs-pool-rental-near-me-in-the-woodlands')
),
src as (
  select 'content_pages.content' col, id::text id, slug, content txt from content_pages where content is not null
  union all
  select 'content_pages.body_markdown', id::text, slug, body_markdown from content_pages where body_markdown is not null
  union all
  select 'content_pages.raw_html (not rendered)', id::text, slug, raw_html from content_pages where raw_html is not null
  union all
  select 'blog_posts.content', id::text, slug, content from blog_posts where content is not null
)
select t.path, s.col, s.id, s.slug, md5(s.txt) md5_now
from t join src s on s.txt ~ (t.path || '(?![a-z0-9-])')
union all
select t.path, 'content_pages.related_slugs', c.id::text, c.slug, md5(array_to_string(c.related_slugs, ','))
from t join content_pages c on substring(t.path from 4) = any(c.related_slugs)
order by 1, 2, 4
limit 500;
```

## R2 — the cities rows behind the 78 pairs are unchanged

Confirms: both rows of every pair still describe the same place. Compare the
result with `ops/seo-repairs-2026-11/comparison-duplicates/cities-2026-11-15.psv`
(96 rows). If any row differs, put the result in a new
`cities-<date>.psv`, point `generate.mjs` at it and re-run the generator.
A pair that no longer passes drops out of `src/lib/comparison-duplicates.ts`.

```sql
set transaction read only;
select slug, name, state, state_code, latitude, longitude, is_published
from cities
where slug in ('boston', 'boston-ma', 'carlsbad', 'carlsbad-ca', 'carrollton', 'carrollton-tx', 'charlotte', 'charlotte-nc', 'cincinnati', 'cincinnati-oh', 'dallas', 'dallas-tx', 'denver', 'denver-co', 'el-paso', 'el-paso-tx', 'escondido', 'escondido-ca', 'fort-worth', 'fort-worth-tx', 'franklin', 'franklin-tn', 'fresno', 'fresno-ca', 'frisco', 'frisco-tx', 'glendale', 'glendale-az', 'hayward', 'hayward-ca', 'houston', 'houston-tx', 'huntington-beach', 'huntington-beach-ca', 'indianapolis', 'indianapolis-in', 'lakewood', 'lakewood-co', 'littleton', 'littleton-co', 'los-angeles', 'los-angeles-ca', 'louisville', 'louisville-ky', 'memphis', 'memphis-tn', 'mesa', 'mesa-az', 'murfreesboro', 'murfreesboro-tn', 'murrieta', 'murrieta-ca', 'nashville', 'nashville-tn', 'new-york', 'new-york-ny', 'norfolk', 'norfolk-va', 'north-las-vegas', 'north-las-vegas-nv', 'phoenix', 'phoenix-az', 'plano', 'plano-tx', 'portland', 'portland-or', 'raleigh', 'raleigh-nc', 'richmond', 'richmond-va', 'rockville', 'rockville-md', 'roseville', 'roseville-ca', 'round-rock', 'round-rock-tx', 'san-diego', 'san-diego-ca', 'santa-clara', 'santa-clara-ca', 'scottsdale', 'scottsdale-az', 'sunnyvale', 'sunnyvale-ca', 'tampa', 'tampa-fl', 'tempe', 'tempe-az', 'the-woodlands', 'the-woodlands-tx', 'tulsa', 'tulsa-ok')
   or slug ~ ('^(' || array_to_string(array['boston', 'boston-ma', 'carlsbad', 'carlsbad-ca', 'carrollton', 'carrollton-tx', 'charlotte', 'charlotte-nc', 'cincinnati', 'cincinnati-oh', 'dallas', 'dallas-tx', 'denver', 'denver-co', 'el-paso', 'el-paso-tx', 'escondido', 'escondido-ca', 'fort-worth', 'fort-worth-tx', 'franklin', 'franklin-tn', 'fresno', 'fresno-ca', 'frisco', 'frisco-tx', 'glendale', 'glendale-az', 'hayward', 'hayward-ca', 'houston', 'houston-tx', 'huntington-beach', 'huntington-beach-ca', 'indianapolis', 'indianapolis-in', 'lakewood', 'lakewood-co', 'littleton', 'littleton-co', 'los-angeles', 'los-angeles-ca', 'louisville', 'louisville-ky', 'memphis', 'memphis-tn', 'mesa', 'mesa-az', 'murfreesboro', 'murfreesboro-tn', 'murrieta', 'murrieta-ca', 'nashville', 'nashville-tn', 'new-york', 'new-york-ny', 'norfolk', 'norfolk-va', 'north-las-vegas', 'north-las-vegas-nv', 'phoenix', 'phoenix-az', 'plano', 'plano-tx', 'portland', 'portland-or', 'raleigh', 'raleigh-nc', 'richmond', 'richmond-va', 'rockville', 'rockville-md', 'roseville', 'roseville-ca', 'round-rock', 'round-rock-tx', 'san-diego', 'san-diego-ca', 'santa-clara', 'santa-clara-ca', 'scottsdale', 'scottsdale-az', 'sunnyvale', 'sunnyvale-ca', 'tampa', 'tampa-fl', 'tempe', 'tempe-az', 'the-woodlands', 'the-woodlands-tx', 'tulsa', 'tulsa-ok'], '|') || ')-[a-z]{2}$')
order by slug
limit 300;
```

## R3 — the country-page row set is what the mapping assumes

Confirms: the 69 rows in
`ops/seo-repairs-2026-11/country-mapping/content-pages-2026-11-15.psv` are still
every row that any country test selects (the mapping's suffixes and exact slugs,
the old robots prefixes, country locales, `country_launch`, any
`canonical_override`). It also confirms that none has `redirect_to` set. The
snapshot did not record `redirect_to`. Indirect evidence says it was empty:
all 66 in-sitemap rows answered 200 with no redirect in the 2026-11-14 crawl.
Expected result: the same 69 rows, `redirect_to` null on all.
Any new row is mapped by `countryForSlug()`; check it lands where intended.

```sql
set transaction read only;
select slug, status, in_sitemap, template_type, locale, canonical_override,
       hreflang_group, redirect_to
from content_pages
where slug ~ '-(uk|united-kingdom|canada|australia)$'
   or slug ~ '^(australian|canadian|british|uk)-'
   or slug in ('rent-out-your-pool-london','rent-out-your-pool-manchester','pool-rental-london',
               'pool-rental-manchester','uk-cities-with-pools','canadian-cities-with-pools',
               'rent-out-your-pool-toronto','rent-out-your-pool-vancouver','pool-rental-toronto',
               'pool-rental-vancouver','australian-cities-with-pools','rent-out-your-pool-sydney',
               'rent-out-your-pool-melbourne','pool-rental-sydney','pool-rental-melbourne')
   or locale in ('en-GB','en-CA','en-AU')
   or template_type = 'country_launch'
   or nullif(trim(canonical_override), '') is not null
order by slug
limit 300;
```

## R4 — hreflang groups that hold country pages

Confirms: which non-country rows share a group with country pages. Those rows'
EN↔ES twin lookup now skips country rows (`getHreflangSibling`). Expected
result: the group-key .com articles (no hreflang of their own in the
2026-11-14 crawl) and no Spanish row. If a Spanish row appears, its page keeps
its EN↔ES pair under the new code. Before, the pair depended on which row the
unordered `limit(1)` returned.

```sql
set transaction read only;
select hreflang_group, slug, locale, status
from content_pages
where hreflang_group in (
  select hreflang_group from content_pages
  where hreflang_group is not null
    and (slug ~ '-(uk|united-kingdom|canada|australia)$' or locale in ('en-GB','en-CA','en-AU'))
)
order by 1, 2
limit 300;
```

## Template, only if R1 returns rows (content-repair step)

One statement per row R1 returns. The `md5(...) = '<md5_now from R1>'` guard
skips any row edited after R1 ran; the `returning` clause logs what changed.
Rows that come back missing were skipped and need a fresh R1.

```sql
update content_pages
set body_markdown = regexp_replace(body_markdown, '<bare path>(?![a-z0-9-])', '<state-suffixed path>', 'g')
where id = '<id from R1>' and md5(body_markdown) = '<md5_now from R1>'
returning id, slug, md5(body_markdown);
-- same shape for content_pages.content and blog_posts.content;
-- raw_html is not rendered: leave it.
```
