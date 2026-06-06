## Goal

Let anyone apply to become an affiliate, get a unique referral link, and earn **5% of every booking, for the lifetime of the host**, on any pool host they refer. Build the tracking pipeline, an affiliate-facing dashboard, and an admin payout ledger.

## Data model (new tables, all admin-only via supabaseAdmin)

```text
affiliates
  id (uuid, pk)
  user_id (uuid → auth.users, nullable until they sign in)
  email, full_name, payout_email, phone, notes
  code (text unique, e.g. "BRAD-7K2X")  -- powers /?ref=CODE
  status: pending | approved | rejected | paused
  approved_at, approved_by
  payout_method: paypal | venmo | check | ach
  payout_details (jsonb)
  created_at, updated_at

affiliate_clicks         -- one row per /?ref= landing hit
  id, affiliate_id, ref_code, landing_path, ip_hash, ua, referrer, created_at

affiliate_referrals      -- a host we attribute to an affiliate
  id, affiliate_id
  sharetribe_user_id (uuid, unique)   -- the host on Sharetribe
  email_seen, display_name
  attribution_source: cookie | manual_admin | invite_link
  attributed_at
  first_booking_at

affiliate_commissions    -- one row per qualifying Sharetribe transaction
  id, affiliate_id, referral_id
  sharetribe_tx_id (text, unique)
  booking_gross_cents, commission_cents (5%)
  currency, booking_date, host_user_id, listing_id, listing_title
  status: pending | approved | paid | reversed
  payout_id (nullable → affiliate_payouts.id)
  created_at

affiliate_payouts        -- admin marks a batch paid
  id, affiliate_id, period_start, period_end
  total_cents, method, reference (e.g. PayPal tx id)
  paid_at, paid_by, notes
```

RLS: every table FORCE RLS, no anon/authenticated grants. All reads go through server fns. The affiliate dashboard uses `requireSupabaseAuth` and filters by `affiliates.user_id = auth.uid()`.

## Attribution flow

1. **Click capture** — root route reads `?ref=CODE`, sets a 90-day cookie `prnm_ref=CODE`, inserts an `affiliate_clicks` row (fire-and-forget server fn).
2. **Host signup attribution** — when a new Sharetribe host is detected by the nightly poll (or the existing host-sync flow), if their email matches a recent click cookie email OR if admin manually links them, write an `affiliate_referrals` row. (Cookie→host email match happens at the moment a lead submits the host signup form — we capture `prnm_ref` on host-lead submit and stash it on the lead, then promote to a referral when that email becomes a host.)
3. **Commission computation** — nightly cron polls Sharetribe Integration API for completed transactions, joins `tx.providerId → affiliate_referrals.sharetribe_user_id`, inserts an `affiliate_commissions` row at 5% of gross. Idempotent on `sharetribe_tx_id`.

## Routes & UI

**Public**
- `/referral` — existing marketing page, add "Apply to become an affiliate" form (open signup, status=pending).
- `/referral/apply` — form (name, email, audience description, how they'll promote). Returns "thanks, we'll review".

**Affiliate (under `_authenticated/`)**
- `/affiliate` — dashboard: total earned, pending vs paid, click count, referred hosts list, recent commissions table, copy-link box with their `?ref=CODE` URL, payout method form.

**Admin (under `_authenticated/`, admin role)**
- `/admin/affiliates` — list, approve/reject/pause, manually link a Sharetribe host to an affiliate, view commissions, create a payout batch (selects pending commissions → marks paid).

## Server functions / routes

- `affiliate-apply.functions.ts` — public submit, creates `pending` row.
- `affiliate-dashboard.functions.ts` — `requireSupabaseAuth`, returns own stats + commissions + payouts.
- `affiliate-admin.functions.ts` — admin gated via `has_role('admin')`: approve, reject, pause, manual-link host, create payout batch, mark paid.
- `affiliate-click.functions.ts` — record click, return cookie value to set client-side.
- `src/routes/api/public/hooks/sync-affiliate-commissions.ts` — nightly cron endpoint:
  1. Pull Sharetribe completed transactions since `max(booking_date)`.
  2. For each, if provider has a referral row, upsert commission.
  3. Auto-approve commissions older than 7 days (refund window) → `status='approved'`.
- pg_cron: `0 5 * * *` daily, posts to the sync endpoint with `apikey` header.

## Sharetribe integration (poll model)

Use existing `src/server/sharetribe.server.ts` patterns. Add an Integration API call to list transactions with state `transition/complete` filtered by `lastTransitionedAt`. Map `relationships.provider.data.id` → `sharetribe_user_id`. Wrap in try/catch; on failure log and skip — never throws to cron.

## Payouts

Manual for v1. Admin selects an affiliate, picks all `status='approved'` commissions, clicks "Create payout" → inserts `affiliate_payouts`, updates the selected commissions to `status='paid'` with `payout_id`. Records method + external reference (e.g. PayPal tx id). No Stripe Connect in this pass.

## Out of scope (call out, don't build)

- Stripe Connect automated payouts.
- Real-time Sharetribe webhooks (we're polling).
- Renter-side referrals (host-only attribution).
- 1099 tax form generation.
- Multi-tier / sub-affiliate.

## Build order (one batch per step)

1. Migration: 5 tables + grants + RLS + a `generate_affiliate_code()` helper + trigger to backfill `affiliates.user_id` on first sign-in by email.
2. Server fns: apply, click, dashboard, admin (approve/reject/link/payout), sync cron endpoint.
3. Cookie capture in `__root.tsx` (read `?ref`, set cookie, fire click fn).
4. UI: `/referral/apply` form, `/affiliate` dashboard, `/admin/affiliates` console. Add nav links.
5. pg_cron schedule for nightly sync.
6. Smoke test: apply → admin approves → manually link a real host → run sync endpoint by hand → confirm commission row → create payout → confirm dashboard totals.

## Notes / risks

- **Refund reversals**: Sharetribe transactions can transition to refunded. v1 stamps commissions `pending` for 7 days, then auto-approves. Refunds after that → admin manually marks `reversed` (rare; we can add automated reversal later).
- **Email-to-host matching**: depends on us reliably capturing `?ref` on host-lead submit. Hosts who sign up directly on Sharetribe without going through our `/p/become-a-pool-host-*` funnel can be linked manually by admin in `/admin/affiliates`.
- **Sharetribe API rate limits**: nightly poll with pagination; store `last_sync_at` in a `kv_state` row to avoid re-scanning history.
