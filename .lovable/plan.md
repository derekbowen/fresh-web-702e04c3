## Goal

Cut the homepage main bundle (currently 239 KB transferred / ~140 KB unused) and pull TTI down from 7.5 s. Focus only on JavaScript reduction — caching and render-blocking are out of scope per your note.

## Where the bytes are coming from

The Lighthouse trace points at one chunk: `/fw-assets/index-BY_aLCKy.js` (239 KB transferred, 142 KB unused = 60% dead weight on first paint). TanStack auto-code-splits route components by default, so the leakage is from things hoisted into the entry bundle by static imports:

1. **`src/routes/__root.tsx`** statically imports `IntercomWidget`. Intercom's messenger SDK is loaded on every route even though only `/` and admin pages use it.
2. **`src/components/home-page.tsx`** statically imports `PoolWaitlistForm`, `FeatureRequestForm`, `ListingCard`, `DustBanner`, all `ACADEMY_HERO_MAP` images, plus the FAQ block. Everything below the fold ships in the critical chunk.
3. **`src/router.tsx`** has `defaultPreloadStaleTime: 0` but no preload strategy is set — fine, but worth noting it's not over-eagerly fetching.
4. Heavy UI libraries (`recharts`, `embla-carousel`, `react-day-picker`, `react-resizable-panels`, `cmdk`, `vaul`, `react-markdown`) are pulled in by `src/components/ui/*` files. None should be on the homepage path, but if any get pulled transitively, they'll bloat the entry. Need to verify the actual chunk contents after the first pass.

## Plan

### 1. Lazy-load below-the-fold homepage sections

In `src/components/home-page.tsx`, split the page into:

- **Above-the-fold** (stays eager): hero, primary search CTA, "X pools near you" badge.
- **Below-the-fold** (becomes `React.lazy` + `<Suspense>`): featured listings grid, occasions/academy strip, FAQ, `PoolWaitlistForm`, `FeatureRequestForm`, footer extras.

Each below-the-fold block becomes its own small file under `src/components/home/` and is loaded via `React.lazy(() => import('./home/featured-listings'))`. Wrap with `<Suspense fallback={null}>`. This pulls ~80–120 KB out of the entry.

### 2. Defer Intercom

`IntercomWidget` is a pure client component but currently imported statically in `__root.tsx`. Convert to:

```tsx
const IntercomWidget = lazy(() => import('@/components/intercom-widget').then(m => ({ default: m.IntercomWidget })));
```

Wrap render in `<Suspense fallback={null}>`. Additionally, defer the actual `Intercom('boot', …)` call until `requestIdleCallback` (or `setTimeout(…, 2000)` fallback) so the SDK script doesn't compete with hero rendering on slow phones.

### 3. Audit + trim ui/ barrel imports

Spot-check the homepage's transitive import graph for `recharts`, `embla-carousel`, `react-day-picker`, `react-resizable-panels`, `cmdk`, `vaul`. If any sneak into the entry chunk via a shared component, refactor that component to import the heavy bit lazily (e.g., chart.tsx should never be imported from non-admin pages).

I'll use `vite build` output (chunk sizes) as the verification signal after each step.

### 4. Lazy-load `PoolWaitlistForm` / `FeatureRequestForm` everywhere

These forms also appear on a handful of `/p/*` routes (`pool-builders.*`, `pool-rental.$city`, `p.pool-pros.$slug`). Convert each to `React.lazy` so admin/template chunks shrink too. Low risk, mechanical.

### 5. (Optional, only if budget allows) `react-markdown` on resource articles

`resource-article.tsx` pulls `react-markdown` + `remark-gfm`. That template only ships when its route is hit, so it's not a homepage problem — but `React.lazy`-ing the markdown renderer would help that template's TTI too. Mention only; not in scope unless you want it.

## Verification

After each change:
1. Run `vite build` and read the emitted chunk sizes from the build manifest.
2. Re-run Lighthouse mobile against the homepage and confirm `unused-javascript` and `interactive` improve.
3. Spot-check that the lazy boundaries don't cause a visible flash (Suspense fallback={null} for offscreen content is safe; for any in-viewport block use a sized skeleton).

## Out of scope (explicitly)

- Cache-Control headers on `/fw-assets/*`
- Render-blocking CSS (`styles-Btesw3KM.css`)
- Image compression / responsive variants
- Sitemap, SEO, or content changes

## Files I expect to touch

- `src/routes/__root.tsx` — lazy Intercom
- `src/components/home-page.tsx` — split into above-fold + lazy below-fold
- `src/components/home/*` — new small chunks (featured-listings, occasions, faq-block, forms)
- `src/components/intercom-widget.tsx` — defer boot to idle
- `src/routes/pool-builders.*.tsx`, `src/routes/pool-rental.$city.tsx`, `src/routes/p.pool-pros.$slug.tsx`, and `src/routes/p.*` — `React.lazy` for waitlist/feature-request forms

No changes to `vite.config.ts`, no router config changes, no SSR/canonical helpers touched.
