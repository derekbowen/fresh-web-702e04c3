# Public-pools duplicate-record mapping and count consistency (2026-11-15)

**Mapping only. Nothing was merged, deleted, unpublished or updated.** Every database call was
`set transaction read only;` followed by SELECT statements against Supabase project
`qbzpjsiahqgyoazjurqy` (tables `pp_pools`, `pp_cities`). The only network requests besides those
were read-only GETs to `https://www.poolrentalnearme.com/public-pools/...` at about one per second.

**Rendering caveat.** The public-pools pages are rendered by the `pp-ssr` service, whose source is in
no repository and was not read. One pool row was earlier compared with its live page and matched byte for
byte, so the pages are rendered from this data or an identical copy. **Whether pp-ssr reads this
database live is UNVERIFIED.** Everything below that says "the page shows" was observed on the live
site, not inferred from code.

## Files

| File | What it is |
|---|---|
| `duplicate-mapping.csv` | One row per candidate pair (291 rows): evidence per signal, classification, proposed keeper, sitemap and live-page flags, both URLs. |
| `count-consistency.csv` | One row per published city whose `pool_count` differs from its real published-pool count, or that has zero published pools (444 rows). |
| `duplicate-mapping.sql` | The read-only queries for the candidate pairs (signal counts, records, pairs). |
| `count-consistency.sql` | The read-only queries for the count checks. |
| `build_duplicate_mapping.py` | Builds both CSVs from `raw/`. It reads local files only: no database, no network. |
| `fetch_live_status.py` | One GET per record URL; records HTTP status, redirect, canonical and robots noindex. |
| `raw/records.txt`, `raw/pairs.txt`, `raw/cities.txt` | Query output. Each line ends in a 6-character md5 prefix of the line, and the build refuses a line whose hash is wrong. |
| `raw/public-pools.xml` | The live sitemap `https://www.poolrentalnearme.com/public-pools.xml`, fetched **once** on 2026-11-15 (file time 19:27 UTC, md5 `029de5a60c76925edd96864f161c0d38`): 2,529 URLs, of which 2,000 are pool pages and 476 are city pages. |
| `raw/live-status.tsv` | GET of each of the 419 record URLs, 2026-11-15 22:02–22:10 UTC. |

Rebuild: `python3 -I build_duplicate_mapping.py raw/public-pools.xml` (run from this folder).

### Freshness check (re-run 2026-11-15 ~20:40 UTC)
The same queries were run again, with md5 computed on the server over the full text. All three files
match production byte for byte: records 419 lines (`78cd394c…`), pairs 291 lines (`0b2b1ebd…`),
cities 444 lines (`b60b37cc…`). The newest `pp_pools.updated_at` is 2026-07-30, so the table had not
changed since the first run. The headline numbers from the audit also re-check exactly:

- 3,381 published pools; 0 unpublished rows.
- 28 `google_place_id` values shared by more than one published pool (57 rows).
- 65 groups sharing an exact (lower-cased) name within one city (144 rows).
- 695 published pools with no address.
- 437 cities where `pool_count` differs from the real published count.

## Method

### Candidate signals (computed on the server, published pools only)
| Signal | Rule | Pairs |
|---|---|---|
| `place_id` | same non-empty `google_place_id` | 30 |
| name + city | same normalised name (lower case, non-alphanumerics to spaces) **and** same `city_id` | 131 |
| address + zip | same normalised street (first comma part, common suffixes abbreviated, must contain a house number) **and** same 5-digit zip | 130 |
| within 75 m | haversine distance ≤ 75 m **and** similar names | 73 (197 regardless of name) |
| phone | same last-10-digit phone **and** similar names | 38 (102 regardless of name) |
| website | same website after removing scheme, `www.`, query and trailing `/`, **and** similar names | 16 (137 regardless of name) |

"Similar names" means Jaccard ≥ 0.5 on name tokens after removing generic words (pool, park, ymca, center …), or one token set
contained in the other. When a name has only generic words, the test is Jaccard ≥ 0.6 on all tokens.

Any pair meeting at least one signal is a candidate. That gives **291 pairs over 419 records**. 245 pairs that
shared only a location, phone or website, with dissimilar names, were dropped. These are mostly
operators with many sites, such as a city parks department phone number.

Pairs are joined into groups (connected components). That gives **193 groups**: 176 of 2 records, 12 of 3, 1 each of 4 and 7, 2 of 5, and 1 of 10.
The 7- and 10-record groups are records literally named "Swimming pool" in one city, all classified DIFFERENT.

For every pair the CSV records each signal as `agree` / `differ` / `missing`, the distance in metres, the
name similarity scores, a near-match street flag and the coordinate precision. It also has `signals_agree`,
`signals_disagree` and `signals_missing` lists, and a plain-language `notes` column.

`street_near` is a separate, weaker label for streets that almost match. It means house numbers within
50 of each other with near-identical street names, or the same number with a suite suffix. Examples:
1597/1599 City Park Dr, Wisseman/Wissemann Dr.

### Classification
- **SAME_FACILITY**: identical place id; or identical address + zip, within 75 m, and only one
  record has a place id.
- **LIKELY_SAME**: strong but incomplete evidence. The `notes` column says what is missing, for example
  "missing: place id on one record; coordinate agreement", or what conflicts.
- **DIFFERENT**: affirmative evidence of two locations. That means different place ids and a different street,
  or coordinates far apart beyond their rounding error, with no address agreement. Branches of a chain land here.
- **UNDETERMINED**: everything else, including every pair whose only shared signal is the name.

A shared name alone is never SAME_FACILITY. Coordinates with fewer than 3 decimals (about ±100 m) are
flagged `coords_low_precision`. Their distance is never read as disagreement.

**Revised 2026-11-16 after a content review** (all changes make a merge proposal less likely; the CSV was
regenerated by `build_duplicate_mapping.py` from the same raw files, nothing was re-queried):

- *A shared place id is not enough* when the two records were evidently filled from two different Google
  listings: both carry a review count, they were created on the same day, and the counts differ by more than
  20 % (a listing really shared by two records gives 4087/4087, 10765/10761, 944/944). With a name qualifier on
  one side only or on both sides (indoor / outdoor / kiddie / diving ...) such a pair is **DIFFERENT** ("different
  pools at one site": Welles Park Pool 634 reviews vs Welles Park Pool (Indoor) 143, G188; Holstein Park Pool 389
  vs Holstein Park Public Pool (Outdoor) 159, G090); without a qualifier it is **UNDETERMINED** (Hamilton Fish
  Pool 1205 vs 193, G086; Deep Eddy 878 vs 5432, G052; La Mesa Municipal Pool 89 vs 19, G102). A shared place
  id with equal review counts but names that point to different pools (McMillen diving / kiddie / main, G113,
  3 pairs) is **UNDETERMINED** too. None of these has a proposed keeper any more. The saved live page text of
  2026-11-16 is quoted in the notes of G188, G090 and G086; for Holstein both pages call the pool outdoor, so
  one record's data is probably attached to the wrong pool (a content fix, not a merge).
- *Distance alone is not evidence of two sites* when one record has low-precision coordinates (fewer than 3
  decimals), the place ids do not disagree, and nothing else contradicts one site (no conflicting street name).
  Hamilton Aquatic Center, Chandler (G084: same name, same city, same street "S Arizona Ave", one record with no
  place id and 2 coordinate decimals) is now **LIKELY_SAME** (no keeper: LIKELY_SAME never gets one). Precise
  coordinates still count as evidence: the generic-name pairs "hot tub" (G091, 21 km apart) and "Pool" (G134,
  4.4 km apart), both with 7-decimal coordinates, stay **DIFFERENT**.
- *Same name and phone, same city, under 2 km* (Take Me to the Water Swim School, Queens, 949 m, G177): one
  listing that moved or two branches, now **UNDETERMINED** instead of DIFFERENT.

**Deliberate deviation from the literal rule.** The task's rule ("address+zip identical and
coordinates within 75 m") is met by 89 pairs. In 59 of them the two records carry **different** Google
place ids. Google treats them as two places at one address. Examples:

- Bachman *Indoor* Pool vs Bachman *Outdoor* Pool
- a YMCA branch vs its association office
- a recreation center vs its splash pad
- a nudist resort vs a sun club

Labelling these SAME_FACILITY would invite merging distinct listings. So they are LIKELY_SAME (6 pairs,
where name, address and coordinates agree and only the place id conflicts) or UNDETERMINED (53 pairs).
Since the 2026-11-16 revision 8 more literal-rule pairs (identical place id, but review counts or names
point to two listings) are UNDETERMINED (6) or DIFFERENT (2); see above.
The column `literal_rule_same_facility` keeps the literal result for every pair, so the owner can apply
the literal rule instead.

### Proposed keeper (SAME_FACILITY only; a proposal, not an action)
The records are compared on these criteria, in order; the first difference decides:

1. listed in the live sitemap
2. the live page is indexable
3. has a place id
4. more filled fields (out of 21 content fields)
5. has a street address with a house number
6. more precise coordinates
7. shorter slug (no `-2` or city suffix)

`keeper_reason` gives the deciding criterion. It also names any data that only the other record holds
(phone, website, full postal address, more precise coordinates), which a merge would have to carry over.
No keeper is proposed when a group contains names that point to different pools at one site. No keeper is
proposed either when the pairwise winners in a group do not agree on one record. Since the 2026-11-16
revision every one of the 22 SAME_FACILITY pairs has a proposal.

## Totals

| Class | Pairs | Records | Both in sitemap | One in sitemap | Neither | Groups (strongest class) |
|---|---|---|---|---|---|---|
| SAME_FACILITY | 22 | 44 | 20 | 0 | 2 | 22 |
| LIKELY_SAME | 53 | 105 | 27 | 25 | 1 | 51 |
| UNDETERMINED | 129 | 234 | 68 | 45 | 16 | 108 |
| DIFFERENT | 87 | 54 | 10 | 3 | 74 | 12 |
| **All** | **291** | **419** | 125 | 73 | 93 | 193 |

(A record can sit in pairs of more than one class, so the record column does not add up to 419.)

**Live and indexed.** All 419 record URLs answered HTTP 200 with no redirect. Every one carries a
self-referencing canonical. "In the sitemap" and "indexable" coincide exactly:

- The 284 records listed in the sitemap have no `noindex`.
- The 135 records not listed are all served with `<meta name="robots" content="noindex, follow">`.

So for 20 of the 22 SAME_FACILITY pairs (revised 2026-11-16; it was 28 of 30), **both** copies are live, indexable, self-canonical and in the
sitemap. That is duplicate content as far as a search engine can see.

SAME_FACILITY details worth reading before any decision:
- In 7 pairs the place id is identical but the coordinates are more than 75 m apart (up to 741 m). In
  4 of these, one record has only 2 coordinate decimals. In the rest, one record's coordinates or place id is wrong.
- 8 pairs are filed under different city pages, for example North Las Vegas vs Las Vegas, or Hialeah vs Miami.
- 1 pair has dissimilar names despite the shared place id (IU Natatorium / Physical Education & Natatorium);
  La Mesa and McMillen, listed here before the 2026-11-16 revision, are now UNDETERMINED.

## What a merge would involve, and why it is not done here

Merging one SAME_FACILITY pair would mean:

1. Choose the keeper (owner decision, using the proposal above).
2. Carry over fields only the other record holds (`keeper_reason` lists them). This would be a data
   copy of an existing value from the same table, not new text.
3. Unpublish the other record.
4. **301-redirect the retired URL to the keeper's URL.** Otherwise a page that is indexed and in the
   sitemap turns into a 404, and its links and ranking are lost.
5. Regenerate the sitemap and the city page lists, and correct `pp_cities.pool_count` for the affected cities.

Step 4 has to be served by the pp-ssr service, which owns the `/public-pools/...` URLs. The
`public-pools.xml` sitemap is not generated by this repository either: no route here produces it. Its source is not under version control and is out
of reach from here, so the redirect can't be built, tested or reviewed. Unpublishing without a redirect
would do more harm than the duplicate does. This deliverable therefore stops at the mapping. The owner's
own instructions also say not to merge on a name match, and the classification above keeps that rule.

## Count consistency (`count-consistency.csv`)

647 cities, all published. `pool_count` vs the real number of published pools in the city:

| Situation | Cities | In city sitemap |
|---|---|---|
| `pool_count` agrees | 210 | (not listed in the CSV) |
| `pool_count` is NULL | 244 (206 of them have exactly 1 published pool) | 86 |
| `pool_count` lower than real by 1 | 21 | 20 |
| lower by 2–3 | 41 | 41 |
| lower by 4–9 | 79 | 79 |
| lower by 10 or more | 52 | 52 |
| `pool_count` higher than real | 0 | 0 |
| **zero published pools** (`pool_count` 0, agrees) | 7 | 0 |

That makes 437 cities with a differing count: 244 NULL plus 193 too low.

- `sum(pool_count)` is 1,821, against 3,381 published pools.
- No pool points at a missing city.
- No two cities share one URL.

The 7 zero-pool cities are Dover DE, Hilo HI, Kahului HI, Idaho Falls ID, Davidsonville MD, Tulsa OK and The Woodlands TX.
None of them is in the sitemap, but the audit found state pages that link to them.

**Which number the page shows: three live pages, 2026-11-15 22:10 UTC.**

| Page | `pool_count` | Real published | Title / description / heading / list | Prose in `ai_intro` |
|---|---|---|---|---|
| /public-pools/texas/austin/ | 45 | 47 | "(47)", "all 47", "There are 47", 47 pool links | "We've got a total of five public pools listed in our directory" |
| /public-pools/california/fremont/ | 1 | 12 | "(12)", "all 12", "There are 12", 12 pool links | "We've got one public pool listed, Aqua Adventure" |
| /public-pools/new-york/the-bronx/ | NULL | 9 | "(9)", "all 9", "There are 9", 9 pool links | "The Bronx offers nine public pools" |

Findings from these three pages:

- The pages show the **real published count**, computed when the page is rendered. The
  `pool_count` column is not shown on any of the three.
- The title and description on the page are also not the stored `pp_cities.meta_title` /
  `meta_description`. Austin's stored title is "Public Pools in Austin, TX | PoolRentalNearMe.com", but the page
  title is "Public Pools in Austin, Texas (47) — Hours, Prices & Map".
- The contradiction a visitor sees comes from the **prose**: `ai_intro` is printed verbatim, and its
  number was written once and never updated.
- Correcting `pool_count` alone would not change these pages. Whether anything else reads
  `pool_count` (state pages, internal tools) can't be seen without the pp-ssr source.

## Caveats
- The sitemap was fetched once by the first run (19:27 UTC) and was not fetched again. The live-status
  check two and a half hours later found indexability matching it exactly, record for record.
- Name similarity and street normalisation are heuristics for finding *candidates*. They never
  produce SAME_FACILITY on their own.
- Records without coordinates (7 pairs) or without an address (695 published pools overall) cannot be
  compared on those signals. They show as `missing`, not `differ`.
