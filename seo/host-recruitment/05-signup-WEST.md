# HOST RECRUITMENT SPRINT · Page 5 · /signup  (WEST marketplace — not fresh-web)

`/signup` is served by the **WEST Sharetribe marketplace** (apex 301s to www),
not fresh-web. Change staged in the WEST build source `~/build`, **not deployed**.

## Diagnostic (live)
- title: `Sign up | Pool Rental Near Me` — generic
- meta description: `An online marketplace.` — generic default (0-click killer)
- robots: `index, follow` ✓ (NOT noindexed — verified)
- canonical: `https://www.poolrentalnearme.com/signup` ✓ self-referencing HTTPS

## Staged change (WEST `~/build/src/translations/en.json`)
- `AuthenticationPage.schemaTitleSignup`
  - was: `Sign up | {marketplaceName}`
  - now: `List Your Pool Free — 0% Host Fees | {marketplaceName}`  (55 ch)
- `AuthenticationPage.schemaDescriptionSignup`
  - was: `Create an account to {marketplaceName}`
  - now: `List your pool free and earn by the hour — 0% host fees for 2026. No listing fees, liability coverage included. Join hosts on Pool Rental Near Me.`

Applied to WEST on GO via the normal WEST blue-green (rebuild picks up en.json).

## FOLLOW-UP (not done — flagged): crawlable on-page content
Derek's #5 also asks for headline + 3 benefit bullets + social proof on the
signup view (so it isn't "just a bare form"). That's an `AuthenticationPage.js`
UI edit (WEST), heavier than a translation change. Recommend a dedicated small
build: SSR-visible host-benefits block above the signup form —
  - H1: "List your pool free — 0% host fees for 2026"
  - 3 bullets: keep 100% (0% fees) · liability coverage included · get paid in 24h
  - social proof: "Join hundreds of hosts already earning" + ★ rating
Staged separately on GO.
