---
name: Affiliate program
description: Milestone-trigger commission model with tiered titles. Schema, sync, dashboards, coaching log.
type: feature
---

## Model (post-2026-06-06 redesign)

Per-host milestones drive payouts. Tiers are titles only.

| Trigger | Payout |
|---|---|
| Host signup via `?ref=CODE` | $0 |
| Host's 1st completed booking | **$100 activation bonus** (commission_kind=`activation_bonus`) |
| Host's 2nd booking | nothing (the gap) |
| Host's 3rd+ booking | **5% recurring** of payinTotal (commission_kind=`recurring`) |
| Host dormant 60+ days | recurring stays paused until next booking ends dormancy |

Tiers (auto-computed unless `affiliates.tier_override=true`):
- **starter** — default
- **lead** — 5+ active hosts (3+ bookings AND last booking ≤60d)
- **captain** — lead + crew GMV ≥$10K in last 30d

## Tables (all FORCE RLS, supabaseAdmin writes)
- `affiliates` — adds `tier` enum, `tier_set_at`, `tier_override`.
- `affiliate_referrals` — adds `completed_bookings_count`, `activation_paid_at`, `recurring_unlocked_at`, `last_booking_at`, `total_gross_cents`.
- `affiliate_commissions` — adds `kind` enum (`activation_bonus` | `recurring`).
- `affiliate_coaching_log` — affiliate-writable (own crew), admin-readable.

## Server fns
- `src/server/affiliate-sync.server.ts` — `syncAffiliateCommissions()` walks Sharetribe completed tx chronologically per host, applies milestone logic, calls tier recompute for touched affiliates.
- `src/lib/affiliate-tier.functions.ts` — `recomputeAffiliateTier(id)`, `setAffiliateTierOverride` (admin).
- `src/lib/affiliate-coaching.functions.ts` — `logCoachingActivity`, `listMyCoachingLog`, `listCoachingForAffiliate` (admin).
- `src/lib/affiliate-coaching-templates.ts` — 4 pre-written scripts (Nextdoor, FB group, text-a-friend, IG story).
- `src/lib/affiliate-dashboard.functions.ts` — `getAffiliateDashboard` returns tier, crew (with traffic-light status), tier progress bars, kind-split totals.
- `src/lib/affiliate-admin.functions.ts` — `listAffiliatesAdmin` now returns tier, active_host_count, gmv_30d_cents; supports sort=`gmv_30d`/`approved_cents`.

## UI
- `/p/affiliate-dashboard` — tier block + progress bars, "How you earn" card, crew cards (status dot + Log coaching button → templates modal), commissions split by kind.
- `/admin/affiliates` — top-10 leaderboard by 30d GMV, columns for tier/active/GMV, drawer for coaching log, tier override dialog.

## Out of scope (still)
- Auto-promotion emails on tier change
- Sub-codes per host
- Branded captain landing pages
- Stripe Connect payouts (still manual)
