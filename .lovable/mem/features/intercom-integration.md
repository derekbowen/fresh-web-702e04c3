---
name: Intercom integration (removed)
description: Intercom was removed in Oct 2026 (widget, identity JWT, REST client, contact sync, webhook). Do not re-add. Only legacy DB columns remain.
type: feature
---
# Intercom Integration — REMOVED (Oct 2026)

Intercom is no longer used on this site. The messenger widget, identity-verification JWT,
REST client, 6-hourly contact sync (`/api/public/hooks/intercom-sync`) and webhook receiver
(`/api/public/hooks/intercom`) were all deleted, along with the `@intercom/messenger-js-sdk`
dependency. Public support copy now says "text or email us anytime" instead of promising live chat.

## What remains (DB only — intentionally kept, no migration)
- `host_subscribers` / `renter_subscribers` columns: `intercom_id`, `intercom_paused_at`, `intercom_synced_at`
- `intercom_events_log` table (historical webhook events)

## Drip behaviour now
`sendDueHostEmails` and `sendDueEmails` (renter) still skip a subscriber whose
`intercom_paused_at` is set (reason `intercom paused`), so people paused while Intercom was
live stay paused. Nothing sets or clears that column any more — clear it manually to resume
drips for someone. There is no open-conversation check.

## Unused secrets (safe to delete from the host)
`INTERCOM_ACCESS_TOKEN`, `INTERCOM_IDENTITY_SECRET`, `INTERCOM_APP_ID`
