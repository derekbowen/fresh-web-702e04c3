---
name: Intercom integration
description: Two-way contact sync, drip suppression on open conversation, and webhook auto-pause on user reply
type: feature
---
# Intercom Integration

## Secrets
- `INTERCOM_ACCESS_TOKEN` — Bearer token for REST API (Settings → Developer Hub → Authentication)
- `INTERCOM_IDENTITY_SECRET` — used as HMAC-SHA1 key to verify incoming webhooks (header `X-Hub-Signature`)
- `INTERCOM_APP_ID` — for in-app messenger (existing)

## Files
- `src/lib/intercom.server.ts` — REST client (`upsertContact`, `findContactByEmail`, `hasOpenConversation`). Version header `Intercom-Version: 2.11`.
- `src/server/intercom-sync.server.ts` — `syncHostSubscribersToIntercom`, `syncRenterSubscribersToIntercom`, `syncAllToIntercom`. Pushes active subscribers with custom attrs `prnm_audience`, `prnm_status`, `prnm_city`, `prnm_state`, `prnm_sharetribe_id`. Writes back `intercom_id` + `intercom_synced_at`.
- `src/routes/api/public/hooks/intercom-sync.ts` — POST runs full sync (called by pg_cron every 6h, job `intercom-sync-6h`).
- `src/routes/api/public/hooks/intercom.ts` — webhook receiver. Verifies `X-Hub-Signature` via HMAC-SHA1 with `INTERCOM_IDENTITY_SECRET`. Handles `conversation.user.replied` (sets `intercom_paused_at` and cancels pending drip rows) and `conversation.admin.closed` (clears pause). Every event logged to `intercom_events_log`.

## DB
- `host_subscribers` / `renter_subscribers` columns: `intercom_id`, `intercom_paused_at`, `intercom_synced_at`
- `intercom_events_log` (admin-only, RLS forced, service_role only): topic, email, intercom_contact_id, payload, received_at, processed_at, result

## Drip suppression
Both `sendDueHostEmails` and `sendDueEmails` (renter) check before each send:
1. If `sub.intercom_paused_at` is set → mark `skipped` reason `intercom paused`
2. Else call `hasOpenConversation(email)` → if true, set `intercom_paused_at` and mark `skipped` reason `intercom open conversation`
Intercom errors are swallowed (never block send loop).

## Webhook setup (manual in Intercom Developer Hub)
URL: `https://www.poolrentalnearme.com/api/public/hooks/intercom`
Topics: `conversation.user.replied`, `conversation.admin.closed`
