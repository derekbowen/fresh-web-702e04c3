## Goal

Replace the flat 5% lifetime model with a milestone-trigger system that rewards affiliates who actually coach their hosts. Build the crew dashboard so affiliates can see each host they recruited and act on them.

## Commission rules (new)

| Trigger | Payout |
|---|---|
| Host signs up via `?ref=CODE` | $0 |
| Host's **1st completed booking** | **$100 one-time activation bonus** |
| Host's **3rd completed booking** | **Unlock 5% recurring** on that host's future bookings (forever, while host stays active) |
| Host has no completed booking for **60 days** | Commissions on that host pause; resume on next booking |
| Affiliate's crew hits **5 active hosts** (3+ bookings each) | Tier auto-promotes to **Lead Host** + badge on dashboard |
| Lead Host's crew hits **$10K/month GMV** | Tier auto-promotes to **Regional Captain** + listed in admin "captains" view |

Tiers are titles only — they don't change commission rate. Commission rate is purely milestone-driven per host.

## Schema changes

- **`affiliates`**: add `tier` enum (`starter` | `lead` | `captain`), default `starter`.
- **`affiliate_referrals`**: add `completed_bookings_count` int, `activation_paid_at` timestamptz, `recurring_unlocked_at` timestamptz, `last_booking_at` timestamptz.
- **`affiliate_commissions`**: add `kind` enum (`activation_bonus` | `recurring`), default `recurring`. Existing rows (zero in prod) get `recurring`.
- New **`affiliate_coaching_log`** table: `affiliate_id`, `referral_id`, `note`, `template_used`, `created_at`. Affiliate-writable for their own crew, admin-readable.

All tables: FORCE RLS, supabaseAdmin for writes, scoped SELECT to `affiliates.user_id = auth.uid()` or admin.

## Server changes

- **`src/server/affiliate-sync.server.ts`** — rewrite commission calc:
  1. On each completed Sharetribe transaction, increment `completed_bookings_count` on the referral.
  2. If count == 1 → insert `activation_bonus` commission row for $100, set `activation_paid_at`.
  3. If count >= 3 → if `recurring_unlocked_at` is null, set it; insert `recurring` commission at 5% of `payinTotal`.
  4. If count == 2 → no commission (gap between activation and unlock).
  5. Update `last_booking_at`. Skip recurring if last booking was >60 days ago at time of sync (pause logic).
- **New `src/lib/affiliate-tier.functions.ts`** — `recomputeAffiliateTier(affiliateId)`: counts active hosts (3+ bookings, booked in last 60d) and last-30d GMV, sets tier. Called by sync after each commission insert.
- **`affiliate-dashboard.functions.ts`** — extend `getAffiliateDashboard` to return: tier, crew array (each host with status traffic light: green if booked <14d, yellow 14-60d, red dormant), progress bars (X/5 active hosts → Lead, $Y/$10K → Captain), activation bonus count.
- **New `src/lib/affiliate-coaching.functions.ts`** — `logCoachingActivity({ referralId, note, templateUsed })`, `listCoachingForCrew()`.

## UI changes

- **`/affiliate` dashboard** (`src/routes/p.affiliate-dashboard.tsx`):
  - Tier badge + next-tier progress bars at top
  - "How you earn" mini-card explaining the 3 milestones
  - Crew section: card per host showing name (display_name only), bookings count, last booking, status dot, "$earned" total, and a "Log coaching" button that opens a modal with 3 pre-written templates (Nextdoor post / Facebook group post / text-a-friend) + free-text
  - Activation bonuses sub-section (separate from recurring)
- **`/admin/affiliates`** (`src/routes/admin.affiliates.tsx`):
  - Tier column + leaderboard tab (top 10 by 30d GMV)
  - Per-affiliate drawer: crew list, coaching log feed, manual tier override
- Coaching templates live in `src/lib/affiliate-coaching-templates.ts` (3 short scripts).

## Out of scope (this batch)

- Auto-promotion emails (tier change just updates DB + dashboard for now)
- Sub-codes per host
- Branded landing pages for Captains
- Stripe Connect payouts (still manual)

## Order of work

1. Migration (schema + enum + RLS + grants)
2. Sync rewrite with milestone logic
3. Tier recompute fn
4. Dashboard server fn + UI
5. Coaching log fn + modal UI
6. Admin crew drawer + leaderboard

Want me to go straight through 1-6, or pause for review after the migration?
