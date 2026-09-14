# Phase 1b — own the listing image bytes

The one migration item where **delay destroys the option**.

Every listing photo is a signed URL on Sharetribe's imgix account.
`synced_listings` persists the URL string only — no bytes, and the image UUID is
not even a column. The `s=` parameter is an imgix HMAC keyed on Sharetribe's
secret, so we cannot re-sign it, cannot request a different crop, and cannot
re-fetch the originals once the account is gone. Every photo 404s at cutover and
becomes unrecoverable at the same instant.

This slice moves the bytes onto PRNM-owned storage. Additive and reversible:
nothing serves them until `PRNM_IMAGE_SOURCE=prnm`.

---

## The flag

```
PRNM_IMAGE_SOURCE = sharetribe | prnm        # default: sharetribe
```

| Value | Behaviour |
|---|---|
| `sharetribe` | **Default.** Mirror reads serve `primary_image_url` exactly as today. A PRNM URL is ignored even where one exists. |
| `prnm` | Mirror reads serve `prnm_primary_image_url` **per listing**, falling back to the Sharetribe URL for any listing not yet migrated. |

Unset, empty, or misspelled resolve to `sharetribe` — a typo must never flip the
site onto half-migrated images.

**The fallback is per listing, not global.** That is the whole reason this is
safe to turn on before the migration is complete: a re-hosted listing serves
from PRNM, an un-migrated one keeps its Sharetribe URL, so the site is never
worse than it is today at any point in the run. A global switch would blank
every un-migrated photo the moment it flipped.

Rollback: unset it and
`sudo -u ubuntu PM2_HOME=/home/ubuntu/.pm2 pm2 restart fresh-web`.

## Files

| File | Role |
|---|---|
| `supabase/migrations/20260913094500_listing_image_rehost.sql` | `listing-images` bucket, `listing_image_assets` table, `synced_listings.prnm_*` columns |
| `src/lib/listing-images.ts` | Variant ladder, storage paths, host classification, serving preference. Pure. |
| `src/lib/listing-images.test.ts` | 44 deterministic tests |
| `src/server/listing-image-rehost.server.ts` | Discovery + byte transfer + backfill worker |
| `scripts/rehost-listing-images.ts` | CLI |
| `src/server/sharetribe.server.ts` | Mirror reads honour the flag (2 call sites) |
| `src/lib/listing-parity.ts` | Recognises re-hosted images; durability is now asked of the mirror only |
| `src/integrations/supabase/types.ts` | Hand-extended for the new table/columns/enum — see below |

## Where the bytes go

Supabase Storage, public bucket `listing-images`, same project as the mirror. No
new vendor and no new credential: `cities-hero-fallback.server.ts` already
uploads this way, and `src/lib/hero-image.ts` already rewrites a Supabase
**object** URL to the `/storage/v1/render/image/public/` transform endpoint.

That last part is what makes one stored asset sufficient. We store a single
large original per image and let Supabase derive sizes on request, so imgix is
replaced rather than re-implemented. `heroVariant()` needs no change.

Object path is `<listingId>/<imageId>.<ext>` — deterministic, so a retry
overwrites the same key instead of leaking an orphan (there is no cleanup job),
and the bucket stays greppable by listing. Deliberately *not* timestamped, which
is where the `city-heroes` pattern differs.

## The fidelity ceiling — read this before running it

**Sharetribe serves variants, never originals. There is no API that returns the
bytes a host uploaded.** The best available is `scaled-xlarge` (~2400px,
uncropped), which is what the marketplace app's own gallery already requests.

```
scaled-xlarge → scaled-large → default → scaled-medium → scaled-small
```

Walked in that order, and only if all of those are absent does it fall back to
a crop (`landscape-crop2x`, `landscape-crop`, `square2x`, `square`) with
`isCrop: true` recorded. A crop has permanently lost framing, so re-hosting one
as the canonical asset means we can never render the uncropped image again —
hence last resort, and hence `source_variant` is stored per asset so the ceiling
stays visible rather than becoming folklore.

This ceiling is permanent and it gets worse with time, not better: the variants
are only obtainable while the account is live.

## Schema

`listing_image_assets`, one row per Sharetribe image UUID:

| Column | Purpose |
|---|---|
| `sharetribe_image_id` | PK. The only durable handle; `synced_listings` never stored it. |
| `listing_st_id`, `position` | Ownership and gallery order |
| `source_url`, `source_variant` | What we fetched, and from which rung of the ladder |
| `storage_path`, `public_url`, `content_type`, `bytes`, `sha256` | Where it landed |
| `status` | `pending` \| `stored` \| `failed` \| `unavailable` |
| `attempts`, `last_error`, `stored_at` | Retry budget and audit |

`unavailable` is terminal (Sharetribe offers no usable variant); `failed` is
retryable up to `MAX_ATTEMPTS` (4). Without this table a partial run is
indistinguishable from a complete one.

On `synced_listings`: `prnm_image_urls text[]`, `prnm_primary_image_url`,
`prnm_images_synced_at`.

> **`runListingSync()` must never include the `prnm_*` columns in its upsert
> payload.** PostgREST builds `ON CONFLICT DO UPDATE` from the columns present in
> the request body, so columns it omits are preserved — that is what keeps a sync
> run from wiping a completed re-host. Adding them to that payload erases this work.

`prnm_image_urls` is rebuilt from `stored` rows only, so a pending or failed
image never leaves a hole or a dead URL in the array, and a failed first image
never becomes the primary.

## Running it

```bash
bun run rehost:images:progress                      # counts, % done, current flag
bun run rehost:images -- --dry-run --limit 20       # fetch + measure, store nothing
bun run rehost:images -- --discover-only            # enumerate without downloading
bun run rehost:images -- --limit 500 --concurrency 4
bun run rehost:images -- --listing <uuid>           # one listing
bun run rehost:images -- --retry-failed --limit 200
```

Suggested order: `--progress`, then `--dry-run --limit 20` to sanity-check the
variant ladder and byte sizes, then work up in batches. There is no reason to do
it in one pass — the job is resumable by design, safe to kill mid-run, and safe
to re-run.

Exit 1 on any recorded error so a wrapper can alert.

## Parity interaction

The parity engine now distinguishes three image states:

| Finding | Severity | Means |
|---|---|---|
| `image-host-dies-with-sharetribe` | blocking | The mirror's URL is still on imgix. The count of these **is** the work remaining. |
| `image-rehosted-to-prnm` | cosmetic | Same picture, now ours. The intended end state — must never block, or the parity gate would refuse to let the migration land. |
| `image-variant-differs` / `image-mismatch` | degraded | Same image different crop, or genuinely different pictures. |

Durability is now asked **only of the mirror's URL**. The Sharetribe read's URL
dying with Sharetribe is a tautology, not a finding — we are leaving. The image
UUID is recovered from the re-hosted path's filename, which is what lets the
diff prove "same picture, now ours" rather than guessing.

`bun run parity:listings` prints PRNM-hosted vs Sharetribe-hosted counts and a
percentage.

## Generated types were hand-extended

`src/integrations/supabase/types.ts` is normally produced by
`supabase gen types typescript`. It could not be regenerated here — the live
project is unreachable from the audit environment (network policy denies
`*.supabase.co`). The new table, the three `synced_listings` columns and the
`listing_image_status` enum were therefore added by hand in the generator's exact
shape, including the `Constants` block.

**Re-run the generator on the next machine that can reach the project** and
confirm the diff is empty. If it is not, the generator wins.

## Not done in this slice

- **No bytes were actually moved.** The live project and Sharetribe are both
  unreachable from here, so the worker has never run. It is written, typechecked
  and unit-tested; its first real run needs a human on EAST.
- **Gallery arrays are written but not yet served.** `prnm_image_urls` is
  populated; only `primary_image_url` is read through the flag so far, because
  the mirror's summary shape exposes a single `imageUrl`.
  `preferredImageUrls()` exists for when the gallery read lands.
- **`fetchShareListing` is untouched** — it requests its own variant set
  (`scaled-large`, `scaled-medium`) directly from Sharetribe and does not read the
  mirror.
- **No scheduled hook.** Deliberately manual and observable for the first pass.
  Wire `/api/public/hooks/` once a full run has been watched end to end.
- **Storage cost is unmeasured.** `--dry-run` reports total bytes; get that
  number before committing to a plan tier.

## Observation, not part of this slice

Migration `20260503071720` revokes `EXECUTE ON FUNCTION public.has_role` from
`authenticated`, and no later migration re-grants it. Every `admins read …` RLS
policy in this database — `st_*`, `listing_image_assets`, and ~170 others —
calls `has_role` in its `USING` clause. The service role bypasses RLS, so the
worker and all server code are unaffected; but admin dashboard reads of these
tables may be failing. Worth checking separately. `listing_image_assets` follows
the same pattern as every other table on purpose rather than quietly diverging.
