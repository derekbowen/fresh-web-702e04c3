# Pending production reads for the F5 + F14 database change

The production database tool was unavailable on 2026-11-16 (`execute_sql` calls hung for hours). Nothing in this folder
was run against production: not the dry run, not the column check, not the pin reads. The SQL is built from saved data
only:

- fee anchors: `fees/fee-corrections.csv`, from `content_pages` extracts taken 2026-11-15 (~17:30 UTC run 1, 22:08 UTC
  run 2, 01:03–01:18 UTC audit lines; the review of 2026-11-16 added 31 rows from the 01:03–01:18 and 22:09 UTC lines);
- link counts: `links/link-mapping.csv`, database recount 2026-11-15 ~22:04 UTC;
- live page checks: GET requests to www.poolrentalnearme.com on 2026-11-16.

Every read below is read-only. Each file starts with `set transaction read only;` and contains SELECTs only. Run them
with `psql -1` so that first line takes effect (without `-1` each statement runs on its own and the line does nothing).

Order: P2, P1, then P0 built from the P1 pins (RUNBOOK §3). P3 can run any time.

## P1: md5 pins of every field the change may write (13 files)

`apply.sql` refuses to run until it is regenerated with these pins. The pins are the field guard's reference: apply
changes a field only while its md5 still equals its pin. Read them **once**, build the dry run from them (P0), have
Derek review that dry run, and apply the script built from the same pins. A new pin read means a new dry run and a new
review; never re-read pins between review and apply.

```
mkdir -p pins
for f in pending/p1_*_pins_*.sql; do
  psql "$DB" -X -q -A -t -F "$(printf '\t')" -1 -f "$f" > "pins/$(basename "$f" .sql).tsv"
done
cat pins/p1_fee_*.tsv | wc -l      # must print 2334
cat pins/p1_link_*.tsv | wc -l     # about 15,000
python3 generate.py --pins pins/ --out build/
```

- `p1_fee_field_pins_0[1-5].sql`: one line per field a fee rule changes (2,334 fields): `table, row_id, column, md5`
  (md5 empty when the row or field is gone).
- `p1_link_field_pins_0[1-8].sql`: one line per `content` / `body_markdown` / `blog_posts.content` field that holds a
  link to one of the 514 link-rule targets, sharded by the first hex digit of the row id (about 2,000 lines each).

What it confirms: the exact value each field has at the reviewed moment. A field changed later, or a field that gained
a target link later, is skipped and logged by apply.

Why not the 2026-11-15 snapshot: the saved extracts hold sentences (fee rows) and counts (link rows), not whole field
values, so a whole-field md5 from 2026-11-15 does not exist. The 2026-11-15 snapshot still guards the change through
the byte-exact fee anchors and the per-rule count guard. Derek decides whether the reviewed P1 read is an acceptable
reference (RUNBOOK §0.1).

## P0: the dry run (`build/dry-run.sql`, built with the P1 pins)

```
psql "$DB" -X -1 -v ON_ERROR_STOP=1 -f build/dry-run.sql > dry-run-$(date -u +%F).txt
```

The task asked for this output as `dry-run-2026-11-15.txt`. It does not exist, because the database could not be read.
`dry-run-local-fixture.txt` is the same script run on the local test database: it shows the format only; its numbers
are fixture numbers.

What the production run confirms:
- **Pin set**: the sha256 of the pins it was built with; the apply script built from the same pins shows the same one.
- **Preflight**: every column the change writes exists and is `text` (`content`, `body_markdown`, `description`,
  `seo_title`, `seo_description`, `og_description` on `content_pages`; `content` on `blog_posts`); both `id` columns
  are `uuid`; `updated_at` exists. Types were read from `supabase/migrations/*.sql`; production is not checked yet.
- **Triggers that fire on update.** The migrations show only `updated_at` bumps, a related-slugs refresh that runs only
  when slug, status or template changes, and a 404 resolver that runs only when `url_path` changes. If production lists
  anything else, such as a webhook or `pg_net` call, stop and ask Derek.
- **Per link rule:** fields holding the target today, fields it would change, fields the field guard would skip,
  fields the insurance guard leaves for Derek, already applied, unsupported forms, and the count-guard verdict.
- **Fields for Derek:** every link field the insurance guard leaves alone, and every field the field guard will skip.
- **Per fee rule:** whether `old_text` is still present exactly once (fees/PENDING-READS Q1 for every row, the 995
  still-pending rows included), and whether the pin matches.

## P2: scheduled page writers (`pending/p2_page_writers.sql`, review 2026-11-16)

```
psql "$DB" -X -1 -v ON_ERROR_STOP=1 -f pending/p2_page_writers.sql
```

One row per `pg_cron` job: name, schedule, active, and whether its command looks like a page writer (the command text
itself is not selected). Confirms which jobs must be paused before apply (RUNBOOK §3 step 0). The migrations show
`auto-generate-content-batch` every 5 minutes; the HTTP hooks under `/api/public/hooks/` (link-auto-fix,
seo-fix-worker, gen-host-pages, host-city-tail-fix, blog-autogen, alias-backfill) are called from outside the database
and must be checked where they are scheduled.

## P3: exact text of fee sentences seen only in the crawl (`pending/p3_f13_exact_lines.sql`, review 2026-11-16)

```
psql "$DB" -X -1 -v ON_ERROR_STOP=1 -A -F "$(printf '\t')" -f pending/p3_f13_exact_lines.sql > p3-lines.tsv
```

About 40 lines on 21 pages: the stale "$90 of every $100" / "$54 on a $60 session" sentences and the "small cut" /
"minimal fee" wording on the 8 pages added to `fees/crawl-gap-candidates.csv` (Carlsbad NM, Opelousas LA, Riverview FL,
Wilkinsburg PA, Knightsen CA, Huntingtown MD, Pataskala OH, Kearney NE); the second body column of pages where only one
column's text was saved (Gold Canyon AZ, Grand Prairie TX, Cameron Park CA, Elk City OK, Byhalia MS, Grosse Pointe
Farms and Park MI, Reynoldsburg OH, Freehold NJ, Allentown PA and Kennewick WA in Spanish, Owensboro); and Saratoga
Springs' "Profit: $1,500+" line, which was computed from the old $10,000 (now $10,800; "$1,500+" is still true, so it
is optional). What it confirms: byte-exact `old_text` for new FIX rows. Add them to `fees/fee-corrections.csv`,
regenerate, re-run the test.

## Still open from earlier packages (not needed to apply this change)

- fees/PENDING-READS **Q3**: broad sweep for the 215 earlier crawl-only fee sentences.
- fees/PENDING-READS **Q4**: two context reads.

These can only add new CSV rows. Add them to `fee-corrections.csv`, regenerate, and re-run the test.
