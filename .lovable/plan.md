## Root cause

The Sharetribe client in `src/server/sharetribe.server.ts` calls the **Marketplace API** (`flex-api.sharetribe.com`) with `grant_type=client_credentials` and `scope=public-read`. The configured `SHARETRIBE_CLIENT_ID` returns **401 Unauthorized** on that endpoint.

I tested live against Sharetribe with the project's secrets:

- `flex-api.sharetribe.com` + `scope=public-read` (no secret): **401 Unauthorized**
- `flex-integ-api.sharetribe.com` + `client_secret` + `scope=integ`: **200 OK**, returns 72 published listings

The configured app is an **Integration API** application, not a Marketplace API app. That's why every listing query fails silently (the catch in `searchListings` returns `{ listings: [] }`, and the UI falls back to placeholders).

## Fix

Rewrite `src/server/sharetribe.server.ts` to use the Integration API:

1. **Auth** — `POST https://flex-integ-api.sharetribe.com/v1/auth/token` with `client_id` + `client_secret` + `grant_type=client_credentials` + `scope=integ`. Cache token until `expires_in`.
2. **Requests** — `GET https://flex-integ-api.sharetribe.com/v1/integration_api/listings/{query|show}` with `Authorization: Bearer <token>`.
3. **Public filtering** — Integration API returns drafts/pending/closed/published. Add `states=published` to `listings/query` and reject non-`published` results in `fetchListing` so we never leak a draft to a public URL.
4. Keep the existing public surface (`fetchListing`, `searchListings`, `ListingSummary`, `SearchOptions`) so all callers (`index.tsx`, `category.$slug.tsx`, `pool-rental.$city.tsx`, `l.$slug.$id.tsx`, `listing-card.tsx`) keep working without changes.
5. Improve `summarize()` slightly: derive `city` from `publicData.address` (split on `,`) when `publicData.location.city` is missing, since real listings only populate `publicData.address`/`location.lat,lng`.
6. Drop the now-unused `SHARETRIBE_MARKETPLACE_URL` plumbing and the Marketplace-only `getApiBase()` helper.

## Verification

After the swap, retest by hitting one of the routes that calls `searchListings` and confirming the response includes real listing IDs/titles instead of an empty list. I'll also call the function from a quick ad-hoc check after deploy.

## Files touched

- `src/server/sharetribe.server.ts` — rewritten end-to-end (single file).

No DB, no secrets, no other route changes needed. `SHARETRIBE_MARKETPLACE_URL` secret can stay (ignored).