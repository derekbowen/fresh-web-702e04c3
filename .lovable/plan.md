## What's actually broken vs. already fixed

### Confirmed bug — duplicate `<link rel="canonical">` on every page

Verified live on `https://www.poolrentalnearme.com/p/become-a-swimming-pool-host-austin-tx`:

```
<link rel="canonical" href="https://www.poolrentalnearme.com/"/>
<link rel="canonical" href="https://www.poolrentalnearme.com/p/become-a-swimming-pool-host-austin-tx"/>
```

Cause: `src/routes/__root.tsx` calls `buildMeta({ path: "/" })` in its `head()`, and `src/lib/seo.ts` always returns `{ rel: "canonical", href: ... }` in its `links` array. TanStack Router dedupes `<meta>` tags by `name`/`property` (so `og:url` is correctly overridden by child routes), but it does NOT dedupe `<link>` tags by `rel`. Result: root's `/` canonical and the child route's correct canonical both ship.

### Already fine — `/sitemap.xml`

The audit said sitemap returns `text/html`. That's stale. Verified just now on prod:

```
HTTP/1.1 200 OK
Content-Type: application/xml; charset=utf-8
<?xml version="1.0" encoding="UTF-8"?><sitemapindex …>
```

Same on `fresh-web.lovable.app`. No fix needed.

## Fix (one change)

Stop emitting `<link rel="canonical">` from the root route. Every shareable route already builds its own canonical via `buildMeta({ path })`, and the workspace rule already requires it. Two safe options:

**Option A (preferred): root stops emitting canonical at all.**
Remove the `links: [...meta.links]` spread from `__root.tsx`'s `head()`, keeping only the stylesheet and favicon. `og:url` and `twitter:url` are `<meta>` tags and get correctly overridden by child routes — they can stay (or also be dropped from root for symmetry).

**Option B: leave root canonical but strip canonical from the spread.**
Filter `meta.links` in root to exclude `rel === "canonical"`. Slightly more conservative if we're worried about routes that don't set their own head.

I recommend A. Risk of A: any route missing its own `head()` would have zero canonical. Mitigation: grep all `src/routes/**/*.tsx` for `head: () =>` / `buildMeta` coverage before shipping; any gaps get a `head()` added (this matches workspace rule #6 anyway).

## Implementation steps

1. Edit `src/routes/__root.tsx` — drop the `...meta.links` spread (keep stylesheet + favicon). Also drop `og:url` and `twitter:url` from the root `meta` array if they're sourced from `meta.meta`, since "/" as the default OG URL on every page is misleading; child routes always override these.
2. Quick coverage check: `rg -L "buildMeta\\(|head:\\s*\\(" src/routes/**/*.tsx` to find any shareable route missing `head()`. Add `head()` to any leaf user-facing route that's missing it (skip API routes and admin).
3. Verify after publish: `curl -s --compressed https://www.poolrentalnearme.com/p/become-a-swimming-pool-host-austin-tx | grep -oE 'rel="canonical" href="[^"]*"'` should return exactly one line, pointing at the page itself. Spot-check `/`, `/p/all-locations`, an academy page, a city page.

## Out of scope

- Sitemap content-type (already correct in prod).
- Adding `<meta name="robots">` (default `index,follow` is fine; not blocking).
- Touching `vite.config.ts`, nginx, or `X-Forwarded-Host` logic.

## Files touched

- `src/routes/__root.tsx` — only file changed for the canonical fix.
- Possibly a handful of leaf route files if step 2 finds gaps.
