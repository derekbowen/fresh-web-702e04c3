## What's actually happening

I reproduced the crash on production at 414x896 (iPhone-sized viewport) and inspected the network traffic. The picture is different from what we thought.

When you tap "Water chemistry basics" on `/p/pool-maintenance`:

1. TanStack Router intercepts the click and does a client-side navigation to `/p/water-chemistry-basics` (the `forceDocumentNavigation` workaround we shipped earlier is being bypassed — the router's own link/preload handlers fire first on touch).
2. The client calls `https://www.poolrentalnearme.com/_serverFn/<hash>` to run the page loader.
3. **That request returns HTTP 200 with an HTML body that says "Page not found"** — it's the Sharetribe marketplace's 404 HTML, not the fresh-web server function response. Confirmed in the response headers (`Content-Type: text/html`, body `<title>Page not found</title>`).
4. The loader returns `undefined`, the dispatcher reads `page.template_type` on undefined, and the error boundary shows `Cannot read properties of undefined (reading 'template_type')`.

A direct `curl` of `/p/water-chemistry-basics` returns the full SSR'd page correctly (200, real content). The problem is exclusively on client-side transitions, because the nginx proxy is not forwarding `/_serverFn/*` to fresh-web — that path falls through to Sharetribe.

## Root cause

The nginx route table for `poolrentalnearme.com` does not include `/_serverFn/*`, so every TanStack server-function RPC from the browser ends up at Sharetribe. There are two correct fixes — one infra, one app.

## Recommended fix (app-side, ships from Lovable today)

Stop calling `/_serverFn` from the browser at all. Two changes together cover every entry point so a stray Link or prefetch can't trigger it:

### 1. Disable client-side navigation/preloading on `/p/*` content pages

In `src/router.tsx`, set:

- `defaultPreload: false` (currently undefined — defaults to off, but make it explicit)
- `defaultPreloadStaleTime` stays `0`

Then in `src/routes/p.$slug.tsx`, replace the remaining two `<Link>` usages in the `errorComponent` and `notFoundComponent` with plain `<a href="/">` so even the error UI never re-enters the router.

### 2. Add a global anchor-click interceptor on every `/p/*` page

In `src/routes/p.$slug.tsx`'s component (`ContentPageDispatcher`), add a single `useEffect` that:

- Attaches a `click` listener at the document root
- For any left-click on an `<a>` whose `href` starts with `/p/`, `/`, or any same-origin path that isn't `/s`, `/l/`, `/login`, `/signup`, `/inbox`, `/auth/`, `/account/`, `/profile/`, `/messages/`, `/listings/` (those need to remain regular browser nav too — but they already are)
- Calls `event.preventDefault()` + `window.location.assign(href)`

This makes the existing per-component `forceDocumentNavigation` helpers redundant, but they stay as belt-and-braces. The interceptor catches all the cases we missed (related cards, body markdown links rendered by `ReactMarkdown`, breadcrumbs, etc.) without having to hunt down each one.

### 3. Defensive loader fallback

In `lookupContentPage` calls, we already guard `if (!page)` in the dispatcher. Keep that. No change needed beyond what's already there.

## Why not the infra fix

The proper fix is one line in your EC2 nginx config: add `location /_serverFn/ { proxy_pass http://fresh-web; }` (with whatever upstream name you're using). That makes client-side navigation work everywhere on the site and improves performance. Per the workspace rules I won't touch nginx from Lovable, but if you want, I can write you the exact nginx snippet to paste in — it's much cleaner than the app-side workaround.

## Files changed

- `src/router.tsx` — explicit `defaultPreload: false`
- `src/routes/p.$slug.tsx` — global click interceptor in dispatcher + two `<Link>` → `<a>` swaps in error/notFound components

## After the change

I'll publish and re-test on the mobile-sized browser by clicking through 3 hub links in a row to confirm hard navigation fires every time and no `_serverFn` requests are made.
