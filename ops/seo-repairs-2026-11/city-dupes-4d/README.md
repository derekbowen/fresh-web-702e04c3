# Step 4d: 301 the 29 second copies of a city page to their keeper

RELEASE.md step 4d; the pairs are intent.md §6a (`pairs.sql`, identical). Data only: no code, no deploy.
Each file below is one database-tool call (Supabase `execute_sql`), pasted whole. None uses psql variables.

## Run order

| # | File | What it does | Expect |
|---|---|---|---|
| 1 | `apply.sql` | One transaction. Backs up the 29 rows and every host page's `related_slugs` to `seo_repair` (no API role can read it), then sets the 29 to `status='redirect'`, `redirect_to=<keeper>`, `in_sitemap=false`. Refuses, writing nothing, unless all 29 are published host pages at `/p/<slug>`, all 29 keepers are live and sitemapped, and no row already redirects to a dup (bare slug, `/p/<dup>` or a full URL). | `29 | 4008 | 75 | 29` |
| 2 | `refresh-1.sql` … `refresh-4.sql` | Recomputes `related_slugs` for the host pages in 4 slug ranges (the work the per-row trigger would have done 29 times; apply.sql skips that trigger for its own transaction only). Any order; a second run changes nothing. | about 980 computed each; ~15 s each |
| 3 | `noop-1.sql` … `noop-4.sql` | Read-only: rows whose stored `related_slugs` differ from a fresh compute. | `stale = 0` in all 4 |
| 4 | `body-links.sql` | Rewrites `/p/<dup>` to `/p/<keeper>` in `body_markdown` and `content` of published pages, only where the next character is not `[a-z0-9-]`. Backs up each page's text before and after. Refuses unless apply.sql has run and it finds exactly the counts it expects. | 27 pages, 28 links |
| 5 | `verify.sql` | Read-only summary. | `29 | 75 | 29 | 0 | 0 | 27 | 28` |
| 6 | `live-check.sh` | After the 600 s edge cache: each dup URL answers one 301 to `/p/<keeper>`, each keeper 200. | `checked 29 pairs, 0 failed` |

The counts in steps 1 and 4 are from read-only production reads on 2026-11-19 (two independent reviews).
If `body-links.sql` stops with "found X links on Y pages, expected 28 on 27", nothing was written: read why
before changing the expected line.

Slug boundaries of the 4 ranges (`make-chunks.py`): `…-encino-ca`, `…-manville-nj`, `…-santa-maria-ca`,
quartiles of the 3,923 host pages still published after apply, computed in the database's own collation.
The ranges are contiguous by construction (each ends where the next starts; the first has no lower bound,
the last no upper bound), so they cover every row whatever the boundaries.

## Undo

`rollback-body.sql`, then `rollback.sql` (`rollback-body.sql` refuses if run second). Together they put back status, redirect, sitemap flag, page text,
`related_slugs` and `updated_at` exactly (tested). `rollback-body.sql` refuses if a page's text was edited
after step 4, so a later edit is never overwritten silently.

`rollback.sql` restores the 2026-11-19 `related_slugs` snapshot. That is exact only until something else
rewrites them: the monthly job `refresh-related-slugs-monthly` (03:00 UTC on the 1st; next 2026-12-01) or any
host page's status or slug changing. After either, run `refresh-1..4.sql` after the rollback (normal
triggers) and check with `noop-1..4.sql`.

## Known after this step

- 7 state-hub links still name a dup until fresh-web ships the state-hub filter (`fetchAllHostAcqSlugs`
  reads every host slug with no status filter; fix on branch `seo/08-state-hub-live`, 4230121, not in
  `seo/release-2026-11`): `/p/pool-rentals-california` (redbluff-ca, northbridge-ca,
  liguna-niguel-ca, los-alamintos-ca, moore-park-ca), `/p/pool-rentals-pennsylvania` (eastion-pa),
  `/p/pool-rentals-missouri` (--ofallon-mo). Each answers one 301 to its keeper.
- The `all-locations` resource row's `raw_html` names 8 dups; `/p/all-locations` is served by its own route
  from sitemap rows, so that HTML is never shown. Not touched.

## Test

Timing of `body-links.sql` on a 11,508-page synthetic copy (208 MB of page text, ICU en-US): 2.7 s to find the
pages, 1.9 s to rewrite them. Before it updated by page id, the same file took ~42 s there (two reviews, 2026-11-19).


`bash test/run_test.sh` (PostgreSQL 16, throwaway cluster): runs the literal production files against a
synthetic seed and compares with the ordinary path (all triggers on), checks the text rewrite against an
independent Python implementation, exercises every guard on a copy, and checks the undo restores the seed
exactly. Output: `test/test-output.txt`.
