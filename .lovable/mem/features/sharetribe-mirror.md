---
name: Sharetribe mirror + security alerts
description: Local mirror of Sharetribe users, listings, transactions, messages; 15-min sync; regex security scanner; admin dashboard at /admin/sharetribe.
type: feature
---

## Goal
Local read-only mirror of marketplace data so we never have to use the Sharetribe console. 15-min cron pulls fresh data, runs a regex security scanner on new messages, surfaces everything at /admin/sharetribe.

## Tables (all FORCE RLS, admin-only SELECT, no anon)
- `st_users` — sharetribe_id unique, email, display/first/last, banned/deleted/verified, profile + raw jsonb
- `st_listings` — sharetribe_id unique, author_st_id, title, state, geo, city/region/country, price_amount/currency, photos_count, public_data + raw
- `st_transactions` — sharetribe_id unique, customer/provider/listing ids, payin/payout/commission cents, booking_start/end, last_transition + state, transitions jsonb + raw
- `st_messages` — sharetribe_id unique, transaction_st_id, sender_st_id, content, created_at_st, scanned bool
- `st_sync_state` — per-resource cursor (resource PK, last_synced_at, last_run_*)
- `st_security_alerts` — UNIQUE(message_st_id, category); enums security_alert_category/severity/status

## Server fns / routes
- `src/server/sharetribe-mirror.server.ts` — `syncSharetribeMirror()` pulls users (createdAtStart), listings (createdAtStart), transactions (lastTransitionedAtStart + include=customer,provider,listing,booking,messages). Cursor stored per-resource with 2-min safety overlap; first run 30-day lookback.
- `src/server/security-scanner.server.ts` — `scanMessagesForAlerts()` regex-scans unscanned messages. Categories: off_platform (phone/email/Venmo/CashApp/Zelle/"text me"), harassment (threats/slurs), fraud (refund/chargeback/dispute/scam), safety (minors unsupervised, alcohol+minors, weapons, drugs).
- `src/routes/api/public/hooks/sync-sharetribe-mirror.ts` — hook authorized via `authorizeHookRequest` (vault `hooks_admin_token`).
- `src/lib/sharetribe-mirror-admin.functions.ts` — `getSharetribeDashboard`, `setAlertStatus`, `triggerSharetribeSyncNow`.

## Cron
`sync-sharetribe-mirror` every 15 min → POST hook with `x-admin-token: get_hooks_admin_token()`.

## Admin UI
`/admin/sharetribe` (in nav under "Marketplace") — counts, sync state, funnel (message→booking conversion), open security alerts inbox with Mark reviewed / Dismiss, recent transactions table, recent messages feed, manual "Sync now" button.

## Out of scope (v1)
- SMS / email alert delivery (in-dashboard only per user)
- Host leaderboard, anomaly feed, revenue trend charts (funnel-first)
- Per-message attachments / images
