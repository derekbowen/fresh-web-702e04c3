## Goal

Fix the conversion bug: the home page header has no Sign up / Log in. Replace the hardcoded nav in `src/components/site-layout.tsx` with the canonical structure that mirrors what Sharetribe Console defines, and surface auth state when a Sharetribe session cookie is present.

## Scope

- Edit only `SiteHeaderInner` (and the mobile drawer inside it) in `src/components/site-layout.tsx`.
- Footer, hero, listings, FAQ, and every other section: untouched.
- Marketplace links stay as relative paths per workspace rule #4.
- The `/l/draft/00000000-0000-0000-0000-000000000000/new/details` URL is preserved verbatim.

## New header structure

Logo (left, → `/`) — unchanged.

Center / left-of-center desktop nav, in this order:
1. Home Page → `/`
2. Find a Pool → `/s`
3. Locations → `/p/all-locations`
4. iOS App → `https://apps.apple.com/us/app/pool-rental-near-me/id6737762373` (`target="_blank" rel="noopener noreferrer"`)
5. Google Play → `https://play.google.com/store/apps/details?id=com.poolrentalnearme.app.prod` (`target="_blank" rel="noopener noreferrer"`)

The current `Public Pools` / `Pool Pros` / `How It Works` / `Search` entries are removed.

Right cluster (desktop):
- Logged out: `Sign up` (→ `/signup`), `Log in` (→ `/login`), then the existing primary pill button relabeled **List your space now** (→ existing `/l/draft/...` URL, same styles).
- Logged in: `Inbox` (→ `/inbox`), an account dropdown (Profile settings → `/profile-settings`, Account settings → `/account`, Manage listings → `/listings`, Logout → `/logout`), then **List your space now** pill.

## Logged-in detection (server-side, ships today)

Sharetribe sets a cookie named `st-{clientId}-token`. The proxy forwards cookies to fresh-web SSR, so we can detect it during render.

Approach:
- Add a tiny helper `isSharetribeAuthed(request)` in `src/server/canonical.server.ts` (or a new `src/server/sharetribe-session.server.ts`) that reads request cookies and returns `true` if any cookie name matches `/^st-[0-9a-f-]{8,}-token$/`. No token validation, no Sharetribe API calls — presence of the cookie is sufficient for header UI state. (If Sharetribe rejects the token later, normal redirects handle it.)
- Expose the boolean to the layout via the root route's `loader` (or a context the existing chrome already consumes) so `SiteHeader` receives `isAuthed` as a prop. No client-side fetch, no hydration mismatch — SSR renders the correct state and hydrates identically.
- Editor preview / no cookie present → renders logged-out (Sign up / Log in). This matches the user's stated acceptable fallback for any case detection misses.

This is the primary path — we are NOT shipping the "default logged-out for everyone" fallback. The server-side cookie sniff is straightforward in the existing TanStack Start request pipeline.

## Mobile drawer

Same data, restructured to match the spec:
- Home, Find a Pool, Locations
- "Get the app" subhead → iOS App, Google Play
- Divider
- Logged out: Sign up, Log in
- Logged in: Inbox, Profile settings, Manage listings, Logout
- Divider
- Full-width primary **List your space now** button at bottom (existing styling)

Existing scroll-lock, escape-to-close, and overlay behavior preserved.

## Files touched

- `src/components/site-layout.tsx` — replace `HEADER_LINKS`, rewrite desktop right cluster + dropdown, rewrite mobile drawer body. Accept `isAuthed?: boolean` prop on `SiteHeader`.
- `src/server/sharetribe-session.server.ts` (new) — `isSharetribeAuthed(request)` cookie sniff.
- Root route (`src/routes/__root.tsx`) — read the cookie in the loader/beforeLoad, pass `isAuthed` to `SiteHeader`. (Will read this file during implementation; if the chrome is wired through context instead of props today, I'll plumb through that context.)

## Out of scope

- No search bar in the header. The spec mentions "keep search bar visible" but no search input exists in the current header — adding one is a separate UX change. Calling this out so it's not silently dropped; happy to add in a follow-up if wanted.
- No Sharetribe SDK calls, no token validation.
- No footer changes.

## Verification

After deploy:
```
curl -s https://www.poolrentalnearme.com/ | grep -oE 'href="[^"]*signup[^"]*"|href="[^"]*login[^"]*"'
```
Both `/signup` and `/login` should appear.

Visual checks at 1101px and mobile widths:
- Sign up / Log in visible top-right when logged out
- Inbox + account dropdown visible top-right when the `st-*-token` cookie is present
- "List your space now" pill present in both states
- Mobile drawer order matches spec, divider placement correct

Run `scripts/test-global-chrome.mjs` to confirm header markers still match across the route set.