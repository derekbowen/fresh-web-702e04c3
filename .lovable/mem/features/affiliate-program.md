---
name: Affiliate program
description: 5% lifetime commission on referred Sharetribe hosts. Schema, routes, sync cron, attribution flow.
type: feature
---

## Goal
Anyone can apply at /referral/apply. Admin approves at /admin/affiliates. Affiliate gets a unique referral code (`?ref=CODE` link). When a Sharetribe host gets attributed to that affiliate (manual link by admin or future cookie→email match), 5% of every completed booking that host takes is recorded as a commission. Affiliate sees totals at /affiliate. Admin records payouts manually.

## Tables (all FORCE RLS, no anon grants)
- `affiliates` — code (auto, unique), status enum, payout_method/details, user_id auto-linked on signup via trigger `link_affiliate_on_signup`.
- `affiliate_clicks` — every ?ref= landing.
- `affiliate_referrals` — sharetribe_user_id (unique) ↔ affiliate_id.
- `affiliate_commissions` — sharetribe_tx_id (unique), 5% of payinTotal, status pending → approved (7d) → paid.
- `affiliate_payouts` — admin batch record.

Authenticated SELECT policies scope rows to `affiliates.user_id = auth.uid()` OR `has_role(auth.uid(),'admin')`. All writes via supabaseAdmin.

## Routes
- Public: `/referral` (marketing), `/referral/apply` (form).
- Affiliate: `/affiliate` (dashboard, requires auth).
- Admin: `/admin/affiliates` (list, approve/reject/pause, link Sharetribe host, record payout).
- Hook: `/api/public/hooks/sync-affiliate-commissions` — authorized via `authorizeHookRequest` (vault `hooks_admin_token`).

## Server fns
- `src/lib/affiliate-apply.functions.ts` — `applyAsAffiliate`.
- `src/lib/affiliate-click.functions.ts` — `recordAffiliateClick`.
- `src/lib/affiliate-dashboard.functions.ts` — `getAffiliateDashboard`, `updateMyPayoutMethod`.
- `src/lib/affiliate-admin.functions.ts` — `listAffiliatesAdmin`, `setAffiliateStatus`, `linkHostToAffiliate`, `createAffiliatePayout`, `reverseCommission`.
- `src/server/affiliate-sync.server.ts` — `syncAffiliateCommissions()` polls Sharetribe `/transactions/query` with `lastTransition=transition/complete`, upserts by `sharetribe_tx_id`, auto-approves pending older than 7 days.

## Cron
`sync-affiliate-commissions` runs `0 5 * * *` UTC → POST hook with `x-admin-token: get_hooks_admin_token()`.

## Cookie capture
`src/components/affiliate-ref-capture.tsx` mounted in `__root.tsx`. Reads `?ref=`, sets `prnm_ref` cookie (90 days), fires `recordAffiliateClick`. The cookie is captured but not yet wired to host-lead submission — admin manually links hosts via Sharetribe UUID for v1.

## Out of scope (v1)
Stripe Connect payouts, real-time webhooks, renter referrals, 1099s, automated cookie→host email attribution at lead submit (planned, not built).
