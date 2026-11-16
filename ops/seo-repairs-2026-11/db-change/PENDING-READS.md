# Pending production reads for the F5 + F14 database change

The production database tool was unavailable on 2026-11-16 (`execute_sql` calls hung for hours). Nothing in this folder
was run against production: not the dry run, not the column check, not the md5 pins. The SQL is built from saved data
only:

- fee anchors: `fees/fee-corrections.csv`, from `content_pages` extracts taken 2026-11-15 (~17:30 UTC run 1, 22:08 UTC
  run 2, 01:03–01:18 UTC audit lines);
- link counts: `links/link-mapping.csv`, database recount 2026-11-15 ~22:04 UTC;
- live page checks: GET requests to www.poolrentalnearme.com on 2026-11-16.

Every read below is read-only. Each file starts with `set transaction read only;` and contains SELECTs only. Run them
with `psql -1` so that first line takes effect. Without `-1`, psql runs each statement on its own and the
`set transaction` line does nothing.

## P0: the dry run (`dry-run.sql`): one row per link rule (562), a short fee summary, the fee rules that would not apply, and two small preflight tables

```
psql "$DB" -X -1 -v ON_ERROR_STOP=1 -f build/dry-run.sql > dry-run-$(date -u +%F).txt
```

The task asked for this output as `dry-run-2026-11-15.txt`. That file does not exist, because the database could not be
read. The file `dry-run-local-fixture.txt` is the same query run on the local test database. It shows the format of the
output only. Its numbers are fixture numbers, not production numbers.

What the production run confirms:
- **Preflight:** every column the change writes exists and is `text` (`content`, `body_markdown`, `description`,
  `seo_title`, `seo_description`, `og_description`, `raw_html` on `content_pages`, and `content` on `blog_posts`), and
  both `id` columns are `uuid`. The types were read from `supabase/migrations/*.sql`; production is not checked yet.
  This also covers the column half of fees/PENDING-READS Q2.
- **Triggers that fire on update.** The migrations show only `updated_at` bumps, a related-slugs refresh that runs only
  when slug, status or template changes, and a 404 resolver that runs only when `url_path` changes. If production lists
  anything else, such as a webhook or `pg_net` call, stop and ask Derek before applying.
- **Per link rule:** the rows present today, the rows it would change, insurance-sentence skips, link forms it cannot
  unlink, and the verdict of the same count guard `apply.sql` uses.
- **Per fee rule:** whether `old_text` is still present exactly once. This is fees/PENDING-READS Q1 for every row, the
  986 still-pending rows included. It also reports whether the pin matches.

## P1: md5 pins of every field a fee rule changes (2,416 fields, 5 files)

`apply.sql` refuses to run until these pins are in it. Read them immediately before applying, because a pin is only
as fresh as the read that produced it.

```
mkdir -p pins
for i in 01 02 03 04 05; do
  psql "$DB" -X -q -A -t -F "$(printf '\t')" -1 -f pending/p1_fee_field_pins_$i.sql > pins/field-pins-$i.tsv
done
cat pins/*.tsv | wc -l                          # must print 2416
python3 generate.py --fee-pins pins/ --out build/
```

Each output line is `table, row_id, column, md5 of the current field value`, empty when the row or field is gone.

What it confirms: the exact field value each fee correction will be applied to. During apply, each fee rule changes its
field only when all of these hold:
- the field's md5 still equals the pin;
- the embedded `old_text` arrived intact (its md5 is checked);
- `old_text` occurs exactly once in the field.

If any of these fails, the rule is skipped and logged in `seo_repair_skip_log`. The field is never overwritten.

## Still open from earlier packages (not needed to apply this change)

- fees/PENDING-READS **Q3**: broad sweep for 215 crawl-only fee sentences.
- fees/PENDING-READS **Q4**: two context reads.

These can only add new CSV rows. Add them to `fee-corrections.csv`, regenerate, and re-run the test.
