# F14 pending production reads

The production database tool was unavailable on 2026-11-16 (`execute_sql` calls hung). Everything in this folder was built from data saved earlier, with no new database read. The queries below are what still needs a fresh read. Every one starts with `set transaction read only;`, is SELECT-only, and returns a small result. None of them changes anything.

Run them in order when the tool recovers. Then update `fee-corrections.csv` as described under each query, and only after that prepare any write.

---

## Q1: is each pending `old_text` still present exactly once? (1,228 rows)

Files: `pending/q1_verify_00.sql` … `pending/q1_verify_08.sql` (150 rows each), plus `pending/q1_index.tsv` (`i` → row_id, column, line, slug, md5 of old_text).

Each file embeds the exact `old_text` of its rows, dollar-quoted with the tag `$f14$` (no old text contains that tag). For each row it checks three things: the row id still exists exactly once; the literal arrived intact (`md5(old) = h`); and the number of times `old_text` occurs in that row's column (`(length(f) - length(replace(f, old, ''))) / length(old)`). Output per file is one row: `total`, `ok`, and a JSON list of the failing items only (`i`, `nid`, `n`).

What it confirms: that the `old_text` of every row with `verified = PENDING (PENDING-READS Q1)` is a unique, byte-exact anchor in the current production field. Rows covered:

- 984 run 1/2 rows that sat in batch `w2` of the earlier verification. That query was written on 2026-11-15 at 23:38 UTC but never returned, because the tool hung.
- 1 run 1 row whose anchor was shortened in run 3 so it leaves out a personal name (lees-summit-mo).
- 13 short meta-field rows (`seo_title`, `seo_description`, `og_description`) whose earlier check key used a different column letter.
- All 230 run 3 rows, built from line extracts taken 2026-11-15 between 01:03 and 01:18 UTC and at 22:08 UTC.

The other 2,232 rows were verified on 2026-11-15 at 23:46 and 23:49 UTC (md5-matched, exactly one occurrence each). Their `verified` column says so.

Folding back: for each `i` in `bad`, look it up in `q1_index.tsv`:
- `n = 0`: the text changed after the snapshot. Drop the row, or re-derive it from a fresh read of that field.
- `n > 1`: lengthen the anchor with neighbouring text until it is unique.
- `nid = 0`: the page was deleted. Drop the row.

Set `occurrences_in_field = 1` and `verified = YES <timestamp>` for the rest.

## Q2: text-bearing columns (confirms the sweep covered every column)

```sql
set transaction read only;
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('content_pages', 'blog_posts')
  and data_type in ('text', 'character varying', 'json', 'jsonb', 'ARRAY')
order by table_name, column_name;
```

What it confirms: the column list the sweeps used. Run 1's export (2026-11-15 ~17:30 UTC) read these columns:
- `content_pages`: `title`, `description`, `content`, `seo_title`, `seo_description`, `og_title`, `og_description`, `focus_keyword`, `hero_image_alt`, `body_markdown`, `faq_items` (each object field)
- `blog_posts`: `title`, `excerpt`, `content`, `seo_title`, `seo_description`, `tldr_bullets`

The audit's line extract (2026-11-15 01:03–01:18 UTC) also contained `content_pages.raw_html`, which run 1 missed. Run 3 found PRNM fee errors in it on 2 rows (the CSV has 8 raw_html rows). The original information_schema result for this task was not saved, so this query has to be re-run. Any text column it lists that is not named above must be added to Q3.

## Q3: broad sweep for fee wording without a percentage (catches what run 1's filter missed)

Run 1's filter needed a percentage or a dollar figure near a fee word. It therefore missed sentences such as "Even after platform fees, …", "nets you $300 (minus platform fees)", "$60 (rental) * 0.10 = $6", "our transparent and low host fee" and "solo ganamos una pequeña comisión". Run 3 recovered these from the saved line extracts (230 rows). The crawl shows more on pages that no saved extract covers: `crawl-gap-candidates.csv`, 215 sentences on 165 pages. This query returns their exact database text.

```sql
set transaction read only;
with f as (
  select p.id, p.slug, c.col, c.val
  from content_pages p,
  lateral (values ('content', p.content), ('body_markdown', p.body_markdown), ('raw_html', p.raw_html),
                  ('description', p.description), ('title', p.title), ('seo_title', p.seo_title),
                  ('seo_description', p.seo_description), ('og_title', p.og_title), ('og_description', p.og_description),
                  ('faq_items', p.faq_items::text)) c(col, val)
  where c.val is not null
),
l as (select id, slug, col, x.ln, x.n from f, lateral unnest(string_to_array(f.val, E'\n')) with ordinality x(ln, n))
select id, slug, col, n, left(ln, 400) as ln
from l
where ln ~* '(after|minus|less|net of|subtract[a-z]*|deduct[a-z]*)\s+(the |our |a |all |any )?((0%|small|minor|low|platform|service|host|prnm|booking|industry-low)\s+)*(fees?|commission|cut)\M'
   or ln ~* '(small|minor|minimal|modest|tiny|low|lowest)\s+([a-z-]+\s+){0,2}(platform |service |host |flat )?(fee|commission|cut)\M'
   or ln ~* '(keep|keeps|keeping|retain)\s+(the\s+)?(majority|most|vast majority|bulk|lion.s share)'
   or ln ~* '([x×*]\s?0?\.(10|1|9|90)\M|0\.10\M)'
   or ln ~* '(pequeña|baja|reducida)\s+(comisi|tarifa)|(comisi[oó]n|tarifa)\s+(baja|reducida|promocional)|menos comisiones|después de (la |nuestra )?(comisi|tarifa)'
   or ln ~* '(through|in|for|durante)\s+2026'
order by slug, col, n
limit 400 offset 0;   -- repeat with offset 400, 800, … until fewer than 400 rows come back
```

What it confirms: the exact database line (id, column, line number) for every crawl-only candidate, plus any page neither the saved extracts nor the crawl covered. Folding back:
1. Drop lines whose sentence already overlaps a CSV row for the same id and column.
2. Classify the rest with the README §2 rules. Most `small … fee` hits are host add-ons (cleaning, towels, grill): NOT_A_FEE.
3. Add FIX or NEEDS_DEREK rows built the same way as the `run3_gap` rows, then verify them with a Q1-style query.

## Q4: page context for two figures that could not be checked

```sql
set transaction read only;
select p.slug, x.n, left(x.ln, 300) as ln
from content_pages p,
lateral unnest(string_to_array(p.content, E'\n')) with ordinality x(ln, n)
where p.slug in ('wayne-nj', 'become-a-swimming-pool-host-robinson-tx')
  and x.n between 40 and 62
  and x.ln ~ '\$'
order by p.slug, x.n;
```

What it confirms: whether "With 0% host fees, you are left with $9,000." (wayne-nj, `content` line 59) and "…over $1,000 in monthly take-home pay." (robinson-tx, `content` line 51) are still 90% of a gross stated earlier on the page. The rendered page shows the other column, so the crawl has no context. If they are 90%, add `arith_stale_net` rows like the others. If not, they are OK.

---

## Before any write (not part of this task)

No write SQL is included here. Whoever applies `fee-corrections.csv` must guard every update by the exact old value, so a row that changed after the snapshot is skipped and logged rather than overwritten. For example, per row:

```sql
update content_pages
set <column> = replace(<column>, <old_text>, <new_text>)
where id = <row_id>
  and (length(<column>) - length(replace(<column>, <old_text>, ''))) / length(<old_text>) = 1
returning id;   -- zero rows returned = skipped; log it
```

Apply only `action = FIX` rows that Q1 marked `YES`. Apply rows touching the same field in one transaction, and write a before-image (id, column, md5 of the old field) to a log first.
