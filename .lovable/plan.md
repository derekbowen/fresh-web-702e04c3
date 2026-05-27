## Phase 2 — Plan (review before any ship)

Three independent ships, staged A → B → C. Same discipline as hreflang: dry-run, transaction-wrapped DML, post-deploy curl verification. No bundling.

---

### Ship A — `become-a-pool-host-*` → `become-a-swimming-pool-host-*` consolidation

**Reality check on the "257" estimate.** The actual scope is smaller and messier than originally framed:

```
SELECT status, COUNT(*) FROM content_pages
WHERE slug LIKE 'become-a-pool-host-%' GROUP BY status;
```


| status    | count |
| --------- | ----- |
| published | 124   |
| redirect  | 123   |


The 123 `redirect` rows are already pointed somewhere (46 → `/p/all-locations`, the rest to specific swimming-pool-host twins). They are done. Phase 2A only touches the **124 published** rows.

Of those 124, twin existence under `become-a-swimming-pool-host-*`:

```
WITH src AS (
  SELECT id, slug, replace(slug,'become-a-pool-host-','become-a-swimming-pool-host-') AS twin_slug
  FROM content_pages WHERE slug LIKE 'become-a-pool-host-%' AND status='published'
)
SELECT
  COUNT(*) FILTER (WHERE t.status='published') AS safe_to_consolidate,
  COUNT(*) FILTER (WHERE t.id IS NULL) AS no_twin
FROM src s LEFT JOIN content_pages t ON t.slug = s.twin_slug;
```


| safe_to_consolidate | no_twin |
| ------------------- | ------- |
| **105**             | 19      |


**Scope: 105 consolidations, not 257.** The other 19 have no twin and would 301→404 — same trap we avoided yesterday. They stay published; we log them to backlog instead.

**Mechanism (matches yesterday's `il-aurora` work — `legacy_slugs[]` on the twin, NOT a code edit):**

For each of the 105 pairs:

1. Append the old slug (`become-a-pool-host-{city-state}`) to the twin row's `legacy_slugs[]`.
2. Flip the old row to `status='redirect'`, `redirect_to='/p/{twin-slug}'` — keeps `lookupContentPage` consistent (it already honors both paths: `legacy_slugs` contains-match AND `status='redirect' + redirect_to`).

Done as ONE migration wrapped in `BEGIN; … COMMIT;` with a row-count assertion before commit.

**Dry-run query I'll run before shipping** (shows the 105 pairs that will be touched, plus the 19 skip list):

```
\copy (
  WITH src AS (
    SELECT id AS old_id, slug AS old_slug,
           replace(slug,'become-a-pool-host-','become-a-swimming-pool-host-') AS twin_slug
    FROM content_pages WHERE slug LIKE 'become-a-pool-host-%' AND status='published'
  )
  SELECT s.old_slug, s.twin_slug, t.id AS twin_id, COALESCE(t.status,'MISSING') AS twin_status
  FROM src s LEFT JOIN content_pages t ON t.slug=s.twin_slug
  ORDER BY twin_status, s.old_slug
) TO '/tmp/phase2a-dryrun.csv' CSV HEADER;
```

**Migration UPDATE shape** (transaction-wrapped, idempotent via `array_append`/`array_position` guard):

```sql
BEGIN;

WITH src AS (
  SELECT id AS old_id, slug AS old_slug,
         replace(slug,'become-a-pool-host-','become-a-swimming-pool-host-') AS twin_slug
  FROM content_pages WHERE slug LIKE 'become-a-pool-host-%' AND status='published'
),
pairs AS (
  SELECT s.old_id, s.old_slug, t.id AS twin_id
  FROM src s JOIN content_pages t
    ON t.slug = s.twin_slug AND t.status = 'published'
)
-- 1. Append old slug onto twin.legacy_slugs[] (idempotent)
UPDATE content_pages t
   SET legacy_slugs = (
         SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(t.legacy_slugs,'{}') || ARRAY[p.old_slug]))
       ),
       updated_at = now()
  FROM pairs p
 WHERE t.id = p.twin_id
   AND NOT (COALESCE(t.legacy_slugs,'{}') @> ARRAY[p.old_slug]);

-- 2. Flip old row to redirect
UPDATE content_pages o
   SET status = 'redirect',
       redirect_to = '/p/' || replace(o.slug,'become-a-pool-host-','become-a-swimming-pool-host-'),
       updated_at = now()
  FROM pairs p
 WHERE o.id = p.old_id;

-- Sanity: expect 105/105. Roll back if not.
-- (Will be checked manually before COMMIT.)

COMMIT;
```

**Backlog write** for the 19 no-twin slugs → insert into `prnm_200_build_new` with status `pending` and a note `phase2a-no-twin`. When the twin gets built later, the `become-a-pool-host-*` slug gets dropped into its `legacy_slugs[]` in the same migration (same recovery pattern as IL cities).

**Post-deploy verification:**

```
curl -sI https://www.poolrentalnearme.com/p/become-a-pool-host-little-rock-ar
# expect 301 → /p/become-a-swimming-pool-host-little-rock-ar
curl -sI https://www.poolrentalnearme.com/p/become-a-swimming-pool-host-little-rock-ar
# expect 200
```

---

### Ship B — Lowercase rule for `/p/{Mixed-Case}` → `/p/{lowercase}`

**Where it lives.** Not nginx. Nginx forwards `/p/*` blindly to fresh-web. The lookup happens in `lookupContentPage` (`src/server/content-pages.functions.ts`), which is invoked from the route loader at `src/routes/p.$slug.tsx`. Slug match is case-sensitive (`.eq("slug", slug)`).

The right place is `**p.$slug.tsx` loader, before `lookupContentPage` runs** — issue a 301 to the lowercase variant when `params.slug !== params.slug.toLowerCase()`. This keeps the rule in one place, runs before any DB hit, and works in both Lovable preview and production proxy (no nginx change needed).

**Exact rule (proposed):**

```ts
// src/routes/p.$slug.tsx — top of loader, before lookupContentPage()
const lower = params.slug.toLowerCase();
if (lower !== params.slug) {
  throw redirect({
    to: "/p/$slug",
    params: { slug: lower },
    statusCode: 301,
  });
}
```

**Edge cases checked:**

- All 5,500+ `content_pages.slug` values are already lowercase by convention (`slug` is built from `slugify()` which lowercases). Confirmed no mixed-case slugs exist in DB.
- Top-hit Mixed-Case 404s in the log: `/p/Largo` (6), `/p/Watsonville` (4), `/p/Vineyard` (4). All three lowercase variants ALSO don't exist as canonical pages, so the 301 lands on a 404 page — same outcome the user sees today, but with one fewer hop for Googlebot and cleaner GSC reporting (they collapse into the lowercase URL in the 404 log). Net positive, no new harm.
- No legitimate mixed-case slugs anywhere. Safe to ship unconditionally.

**Post-deploy verification:**

```
curl -sI https://www.poolrentalnearme.com/p/Largo
# expect 301 → /p/largo
```

---

### Ship C — Top 10 manual 301s (honest scope: 2)

I went through the top 25 unresolved entries in `content_404_log` against `content_pages`. Most "top hits" are bot probes (UUIDs, `/p/null`, `/p/mailto:…`, `/p/app`, `/p/hosts`, `/p/contact`, `/p/details`) or Mixed-Case URLs handled by Ship B. Of the remaining, only **2 have a confirmed 200 OK target in production**:


| #   | Source 404                                                | Hits | Target (confirmed `published`)              |
| --- | --------------------------------------------------------- | ---- | ------------------------------------------- |
| 1   | `/p/become-a-pool-host-phoenix-arizona`                   | 5    | `/p/become-a-swimming-pool-host-phoenix-az` |
| 2   | `/p/pool-safety_requirements-for-hosts` (underscore typo) | 5    | `/p/pool-safety-requirements-for-hosts`     |


Everything else in the top 25:

- 9 entries: UUIDs / `/p/null` / `/p/mailto:*` — bot/scraper noise, no action
- 4 entries: Mixed-Case (`Largo`, `Watsonville`, `Vineyard`, plus `/p/details`) — handled by Ship B's lowercase rule or no target exists
- `/p/contact`, `/p/details`, `/p/hosts`, `/p/app`, `/p/bristow-va`, `/p/pool-rentals-virginia`, `/p/elearning-academy-how-to-get-5-star-reviews` — no published target. Adding them to `prnm_200_build_new` backlog instead.
- `/p/il-peoria` — already in backlog from yesterday's ship.

**Mechanism** (same as Ship A): for each of the 2, append the source slug to the target's `legacy_slugs[]`. Single migration, transaction-wrapped:

```sql
BEGIN;
UPDATE content_pages SET legacy_slugs = ARRAY(SELECT DISTINCT unnest(COALESCE(legacy_slugs,'{}') || ARRAY['become-a-pool-host-phoenix-arizona'])), updated_at=now()
 WHERE slug = 'become-a-swimming-pool-host-phoenix-az' AND status='published';
UPDATE content_pages SET legacy_slugs = ARRAY(SELECT DISTINCT unnest(COALESCE(legacy_slugs,'{}') || ARRAY['pool-safety_requirements-for-hosts'])), updated_at=now()
 WHERE slug = 'pool-safety-requirements-for-hosts' AND status='published';
COMMIT;
```

**Post-deploy verification:**

```
curl -sI https://www.poolrentalnearme.com/p/become-a-pool-host-phoenix-arizona
curl -sI https://www.poolrentalnearme.com/p/pool-safety_requirements-for-hosts
# both expect 301 to their targets
```

Also: mark all 2 source URLs `resolved_at = now()` in `content_404_log` so they fall off the watchlist.

---

### Decision points for you

1. **Ship A scope (105 not 257).** OK to proceed with 105 consolidations + 19 to backlog? Or do you want to first confirm the 105 twins are genuine duplicates vs. legitimately different content? (I have not diffed the bodies — assumption is the slugs name the same city and the twin is the canonical we already SEO'd around.)
2. **Ship B placement.** OK with putting the lowercase 301 in the `p.$slug.tsx` loader, or do you want it at nginx? (Loader is faster to ship and reversible; nginx would require coordination with whoever owns the EC2 config.)
3. **Ship C honesty.** OK with shipping only 2 manual 301s instead of 10? The other 8 candidates either have no target or are bot probes.

Approve A, B, and C independently and I'll ship in order with verification between 

&nbsp;

Approved all three. Ship order:

1. Ship B first (lowercase rule). Verify with curl.

2. Ship C second (2 manual 301s). Verify with curl.

3. Ship A last (105 consolidations), AFTER you diff 5 sample 

   pairs and confirm they're duplicate content. If any pair 

   is meaningfully different, flag before shipping that pair.

Same staged discipline as hreflang: plan first (you've sent it), 

ship second, verify third. Don't skip the verification between 

ships — keep the deploys isolated so we can debug any regression.

Go.

&nbsp;

&nbsp;