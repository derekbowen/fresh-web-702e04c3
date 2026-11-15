# Tracking the 2026-11 SEO repairs

`track_groups.py` checks, on the live site, the URL groups each repair changes. It runs
read-only GET requests, does not follow redirects, and sends at most about 3 requests a
second. It records what the site does. It does not measure indexing.

```
python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py                 # every group
python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py --only F4,F10   # some groups
BASE=http://127.0.0.1:3000 python3 -I .../track_groups.py --only F11        # a local build
python3 -I ops/seo-repairs-2026-11/tracking/track_groups.py --selftest      # failures must not pass
```

A page that does not load, a missing canonical, or a sitemap that cannot be fetched
is a FAIL, never a pass: an outage must not look like a confirmed repair.

Each run writes `reports/<UTC date>/track-<UTC time>.json` and `.md`.

## Groups

| Group | What the repaired site must do |
|---|---|
| regression | `/`, `/s`, `/login`, `/signup`, host pages, `/p/all-locations`, `/sitemap.xml` and `/robots.txt` answer 200 |
| F11 | `/p` and `/p/` end in a 404 with no loop. Junk slugs 404 instead of 301 to `/`. None of the 451 stored redirects takes more than one hop or ends anywhere but a 200 |
| F6a | The 78 confirmed duplicate comparison URLs 301 once to their state-suffixed twin |
| F14 | Four pages that stated a false fee no longer do |
| F1, F7 | 25 sampled host pages do not open with the empty-inventory notice. 25 sampled renter pages have a renter heading. Host H1s are distinct |
| F4 | No URL appears in two sitemaps. The config listing and noindex `/p/pool-pros` are absent. `/sitemap-directory.xml` is gone. About 150 sampled sitemap URLs are 200, indexable and self-canonical |
| F10 | US pages served on a ccTLD canonicalise to `www.poolrentalnearme.com`. Each ccTLD's robots.txt allows its own `/sitemap-country.xml` |

## Baseline, 2026-11-15, before any repair is deployed

Expected failures: every check of a repair that is not live yet. The baseline is two runs:

- `reports/2026-11-15/track-174730.*` covers every group. Its F4 duplicate figure (2,636) is
  wrong. That version of the tracker added `/public-pools.xml` a second time even though the
  sitemap index already lists it, so all 2,529 of its URLs counted as duplicates.
- `reports/2026-11-15/track-192804.*` re-runs F4 and F10 with the fixed tracker.
  - It counts 107 URLs listed in two sitemaps, the same figure as the audit's own count.
  - It adds an F10 check on a database city page served on each ccTLD. All three
    self-canonicalise to the ccTLD today.

Use the second run for F4 and F10 and the first for every other group.

## How to read later runs

- A PASS here means the site now behaves as the repair intends. It does not mean Google
  has recrawled, re-indexed or ranked anything.
- Index coverage and impressions come only from Search Console exports, per URL group.
  Compare them with these runs by date.
- Run the tracker after each release, then weekly for at least six weeks.
