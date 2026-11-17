# Academy sitemap: app route vs the WEST static file (2026-11-15)

## What answers `/sitemap-pages-academy.xml` today

| Host | Answer (2026-11-15) | URLs |
|---|---|---:|
| `www.poolrentalnearme.com` | static file on WEST: `content-type: text/xml`, `last-modified: Mon, 20 Jul 2026 04:20:36 GMT`, etag `W/"6a5da214-77e2"`, no `Cache-Control`, no `X-Robots-Tag` | 207 |
| `www.poolrentalnearme.co.uk` (reaches this app without the WEST override) | this app's route, production build | 70 |

WEST nginx serves the file itself (named `/var/www/prnm-tools/sitemap-academy-full.xml`
in the WEST doc `docs/seo/gsc-recovery-2026-09-01.md`) instead of proxying the path to
EAST. The sitemap index on www lists `/sitemap-pages-academy.xml`, so Google reads the
frozen file.

## What the app route emits after this change

`sitemap-pages-academy.xml` group (`src/lib/sitemap-groups.ts`): `template_type =
'elearning'`, plus the reviewed untyped rows `academy-catalog` and
`elearning-academy-*` (see `untyped-pages.md`), body of at least 800 characters, and
every exclusion rule in `src/lib/sitemap-rules.ts`.

Measured against production data (read-only SQL replicating the route filter):

| | URLs |
|---|---:|
| typed `elearning` rows (69 `elearning-academy-*` + `host-training-academy`) | 70 |
| untyped `elearning-academy-*` | 131 |
| `academy-catalog` | 1 |
| **app route after this change** | **202** |

## The two lists compared

| | URLs |
|---|---:|
| WEST file | 207 |
| app route after this change | 202 |
| in both | 202 |
| only in the WEST file | 5 |
| only in the app route | 0 |

The 5 only in the WEST file are typed `resource` rows, owned by
`sitemap-pages-articles.xml`, where they are already listed. In the WEST file they are
listed twice (the "academy + articles" duplicates in the audit):

- `/p/cleanwatermanagementforpoolrentals`
- `/p/fivestarguestcheckin`
- `/p/insuranceandlegalessentialsforpoolhostscourse`
- `/p/pool-rental-signage`
- `/p/taxesforpoolhosts`

`/p/host-training-academy` was in the WEST file and in `sitemap-static.xml`. It is a
typed `elearning` row, so it now appears only in the academy sitemap (the static list
no longer carries it).

All 207 WEST-file URLs answered 200, self-canonical, with no noindex in the audit crawl
of 2026-11-14, so switching to the app route removes no healthy URL from www. It only
removes the 5 duplicates.

## Server step for WEST (not done here; this repository does not touch WEST)

1. In the WEST nginx config, remove the location that serves the static academy file
   for `/sitemap-pages-academy.xml`, so the path falls through to the existing
   `location ~ ^/(sitemap\.xml|sitemap-(static|directory|recent-pages|listings|pages-[a-z-]+)\.xml)$`
   block that proxies to EAST (the regex already matches `pages-academy`).
2. `nginx -t`, reload.
3. Verify on www: `curl -sI https://www.poolrentalnearme.com/sitemap-pages-academy.xml`
   shows `content-type: application/xml; charset=utf-8` and
   `cache-control: public, max-age=300, ...` (the app's headers, not `text/xml` with a
   July `last-modified`), and the body has 202 `<loc>` entries.
4. Keep `/var/www/prnm-tools/sitemap-academy-full.xml` on disk until step 3 passes, so
   the rollback is the same config change reversed.

Order: deploy this branch to EAST first. Before that deploy, EAST's route emits only 70
URLs, and proxying to it would drop 137 healthy pages from www's academy sitemap.
