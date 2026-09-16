# Archive — Lovable-era outbound email/SMS automation (retired 2026-09-17)

Forensic record of the host/renter drip, auto-outreach and content-batch workers
that were audited on 2026-09-16 (`poolrentalnearme-web/docs/AUDIT_2026-09-16_outbound-comms.md`)
and retired on 2026-09-17. Nothing in this directory is executed. The templates
under `templates/` are the exact files that shipped, kept for reference only;
they must not be reused (see "why retired").

## Scheduler rows deleted from `cron.job` (Supabase, project qbzpjsiahqgyoazjurqy)

Deactivated 2026-09-16 22:41Z (`cron.alter_job(active := false)`), then
**unscheduled** (deleted) 2026-09-16 23:35Z by migration
`supabase/migrations/20260917000000_host_lifecycle_engine_and_retire_lovable_workers.sql`
so they cannot be re-pointed. Also unscheduled if present: `sms-sender-every-minute`,
`sync-sharetribe-listings-hourly`, `process-email-queue` (defined in older migrations,
already absent from the live table).

| jobid | name | schedule | target (as stored) | auth | outcome since 2026-07-06 |
|---|---|---|---|---|---|
| 1 | competitor-radar-daily | `0 8 * * *` | `https://fresh-web.lovable.app/api/public/hooks/competitor-radar-scan` | `apikey` = anon JWT of deleted project `ptfjspcphskifoseidut` | 401 every run (71 runs) |
| 2 | daily-seo-digest | `0 12 * * *` | `https://project--4831238c-ae4b-468a-bfd8-41cba26ba0b1.lovable.app/api/public/hooks/daily-seo-digest` | same anon key | 401 (71 runs) |
| 5 | auto-generate-content-batch | `* * * * *` | `https://ptfjspcphskifoseidut.supabase.co/functions/v1/generate-content-batch` | `x-admin-token` from `get_hooks_admin_token()` | DNS failure (102,554 runs) |
| 7 | poll-sharetribe-renters-15m | `*/15 * * * *` | `https://fresh-web.lovable.app/api/public/hooks/poll-sharetribe-renters` | vault `hooks_admin_token` | 401 (6,837 runs) |
| 8 | send-renter-emails-1m | `* * * * *` | `…/send-renter-emails` | vault | 401 (102,555 runs) |
| 9 | poll-sharetribe-hosts-daily | `0 14 * * *` | `…/poll-sharetribe-hosts` | vault | 401 (71 runs) |
| 10 | send-host-drip-emails-5m | `*/5 * * * *` | `…/send-host-drip-emails` | vault | 401 (20,509 runs) |
| 11 | auto-outreach-worker | `*/5 * * * *` | `…/auto-outreach-worker` | vault | 401 (20,510 runs) |

`pg_cron` recorded every run as "succeeded" because `net.http_post` only enqueues.
Job 6 `refresh-related-slugs-monthly` (plain SQL) is untouched and still active.

## Code removed from fresh-web (this commit)

Hook routes: `src/routes/api/public/hooks/{send-host-drip-emails,poll-sharetribe-hosts,send-renter-emails,poll-sharetribe-renters,auto-outreach-worker,enroll-host-signups,sms-sender}.ts`.
Servers: `src/server/{host-drip.server.ts (+ .bak, .bak-orfix),renter-drip.server.ts,auto-outreach.server.ts,add-contacts.functions.ts,email-queue.functions.ts}`, `src/lib/{auto-outreach.functions.ts,sms-blast.functions.ts}`.
Admin pages: `src/routes/admin.{host-drip,renter-drip,auto-outreach,drip-subscribers,add-contacts,email-queue,sms-blast}.tsx` and their nav entries.
Orphan templates: `src/lib/email-templates/renter-{welcome,pool-of-the-day,referral}.tsx` (never referenced).
Edge Function source: `supabase/functions/generate-content-batch/` (never deployed on this project; prompts asserted "$2M liability insurance" and "10% flat host fee").
Lovable SMS gateway: `sendSms()` in `src/server/sms.server.ts` now refuses with an explicit error instead of calling `connector-gateway.lovable.dev` (its key was never configured on EAST). `recordOptOut`/`recordOptIn`/`isOptedOut` (Twilio STOP handling) are kept. `scheduleSequence` still writes `sms_messages` for popup leads; nothing drains that table any more.
Templates moved (not deleted) to `templates/host-drip/`, `templates/renter-drip/`, `templates/founder-update-2026-05-28.html`.

## Why each was retired

- **Host drip** (`templates/host-drip/`): every live template signed "**Stephen, Founder**" — a person who does not exist (CLAUDE.md rule 1 incident); "flat 10% fee / keep 90%" (fees are 0%, hosts keep 100%); "covered by the insurance" (rule 8); dead CTA `/l/draft/0000…/new/details`; enrolment was "any author of any listing in any state" with no listing/Stripe/booking awareness; no suppression check against bounces/complaints; one-click unsubscribe header pointed at a page with no POST handler.
- **Renter drip** (`templates/renter-drip/`): never sent one email; poll had no host/renter filter (hosts would get renter copy); no unique on `(subscriber, step)`; renter "pause" violated a CHECK constraint. Renter lifecycle is out of scope for the rebuild (hosts first).
- **Auto-outreach**: AI-written cold email/SMS with no human review, no unsubscribe link, no suppression, no daily cap, and a migration that marked every historical lead as `new`.
- **Content batch**: dead project host; prompts contained forbidden fee and insurance claims; no pending work (`content_plan` pending = 0).
- **Radar / SEO digest**: internal-only, wrong auth header, never ran on EAST; not worth carrying. (The route files `hooks.competitor-radar-scan.ts` and `hooks.daily-seo-digest.ts` remain in the tree but have no scheduler.)

## Database objects that remain (data preserved, nothing reads them for sending)

`host_subscribers` (228 active / 5 unsubscribed / 1 excluded — the new engine honours `unsubscribed`, `paused`, `excluded` and `intercom_paused_at` as suppression), `host_drip_emails` (59 sent, 66 pending — the pending rows are inert; no worker), `host_drip_state`, `renter_subscribers`/`renter_emails`/`renter_drip_state` (empty), `auto_outreach_messages` (empty), `auto_outreach_settings`, `lead_followups`/`lead_touches`, `sms_messages` (5 pending, undrained), `cold_riverside*` (WEST Riverside drip, gated off), pgmq queues `transactional_emails` (13) / `_dlq` (26) with no dispatcher.

## What replaced it

`ops/host-lifecycle/` + `src/lib/host-lifecycle/` (state derived from Sharetribe, one queue `communication_jobs`, `FOR UPDATE SKIP LOCKED` lease, suppression consulted before every send, dry-run/allowlist/production modes, kill switch, daily cap, per-user gap) — see `docs/HOST_LIFECYCLE.md`.
