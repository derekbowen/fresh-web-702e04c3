# Sharetribe reference (cardbay drop)

Source: `connect-trade-main.zip` (cardbay project), uploaded 2026-06-07.

**Reference only.** Files are `.ts.txt` so the build/typechecker ignores them.
Nothing here is wired into a route or imported anywhere in fresh-web.

## What's in here

- `integrations/sdk.server.ts.txt` — server-side Sharetribe Flex SDK factory
  (HTTP-only cookie token store, per-request instances).
- `auth.functions.ts.txt` — login / signup / logout / current-user via SDK.
- `listings.functions.ts.txt` — listing search + fetch (marketplace browse).
- `transactions.functions.ts.txt` — booking / transaction state machine calls.
- `payments.functions.ts.txt` — Stripe Connect via Sharetribe.
- `users.functions.ts.txt` — profile read/update.
- `listing-config.ts` — example listing-fields / types config mirror.

## Before using any of this in fresh-web

1. **Do NOT claim Sharetribe public routes** (`/s`, `/l/`, `/login`, `/signup`,
   `/inbox`, `/auth/*`, `/account/*`, `/profile/*`, `/messages/*`,
   `/listings/*`, `/saved-listings`). nginx routes those to the live
   Sharetribe frontend — replacing them from fresh-web puts indexed SEO at risk.
2. Safe use cases inside fresh-web: admin-only tools under `/admin/*` that
   need to act on Sharetribe data (e.g. impersonate, refund, edit a listing).
3. If we ever decide to replace the public Sharetribe frontend, do it in a
   **new Lovable project** (not fresh-web) so SEO pages stay untouched.

## To activate any file

1. Rename `*.ts.txt` → `*.ts`.
2. `bun add sharetribe-flex-sdk`
3. Update the `@/integrations/sharetribe/sdk.server` import path to wherever
   you put the SDK factory (recommended: leave it inside `sharetribe-ref/`
   and import from `@/lib/sharetribe-ref/integrations/sdk.server`).
4. Add secrets: `SHARETRIBE_SDK_CLIENT_ID`, `SHARETRIBE_SDK_CLIENT_SECRET`
   (separate from the Integration API creds already in use).
