# Host lifecycle email engine

One engine, hosts only, driven by real marketplace state. It replaces the
Lovable-era host drip (retired 2026-09-17; see
`docs/archive/outbound-comms-legacy/README.md`). Sharetribe's own
transactional emails (booking, payment, messages) are untouched.

**Nothing leaves this engine unless EAST's environment says so.** The kill
switch defaults off, the mode defaults to `dry_run`, and the Derek support
phone is a blocking placeholder until it is configured.

## Where it runs

| piece | location |
|---|---|
| CLI (sync / evaluate / send / tick / report / preview / config) | `ops/host-lifecycle/` → bundled by `npm run lifecycle:build` into `ops/host-lifecycle/dist/run.mjs` |
| shared pure logic (state machine, campaigns, templates, URLs) | `src/lib/host-lifecycle/` (also imported by the admin page) |
| tables + lease RPC | `supabase/migrations/20260917000000_host_lifecycle_engine_and_retire_lovable_workers.sql` |
| admin observability + template preview (read-only, no send button) | `/admin/host-lifecycle` (`src/routes/admin.host-lifecycle.tsx`, `src/server/host-lifecycle.functions.ts`) |
| tests | `npm run lifecycle:test`; `LIFECYCLE_TEST_DB=1 node --env-file=.env --test ops/host-lifecycle/dist/test/lease.integration.test.mjs` |

Run on EAST from the repo checkout, always with the app's env file:

```
cd /home/ubuntu/fresh-web
npm run lifecycle:build
node --env-file=.env ops/host-lifecycle/dist/run.mjs config     # effective, redacted config
node --env-file=.env ops/host-lifecycle/dist/run.mjs sync       # Sharetribe -> host_lifecycle_state
node --env-file=.env ops/host-lifecycle/dist/run.mjs evaluate   # enqueue eligible campaigns
node --env-file=.env ops/host-lifecycle/dist/run.mjs send       # lease due jobs; record or send per mode
node --env-file=.env ops/host-lifecycle/dist/run.mjs report     # counts (read-only)
node --env-file=.env ops/host-lifecycle/dist/run.mjs preview stripe_1 /tmp/stripe_1.html
```

`tick` = sync + evaluate + send. No cron is installed yet; when one is,
it must be disclosed in the same message (CLAUDE.md rule 4) and every run
reported, including no-ops (rule 3).

## Lifecycle states (derived on every sync, never stored as truth)

`SIGNED_UP → LISTING_STARTED → ADDRESS_ADDED → PHOTOS_ADDED → LISTING_READY →
PENDING_APPROVAL → PUBLISHED → STRIPE_CONNECTED → FIRST_BOOKING → ACTIVE_HOST`,
plus `CLOSED` (only closed listings). Derivation lives in
`src/lib/host-lifecycle/state.ts`:

- A host is a Sharetribe user whose `userType` is `provider` or who has any
  listing; deleted and banned users are dropped.
- The primary listing is the published one, else pending approval, else the
  readiest draft, else a closed one.
- Completeness = title, description, geolocation + address, price, ≥ 1 image.
- Stripe = the user's `stripeConnected` attribute.
- Booking = any transaction by that provider with an accept / confirm-payment
  / complete transition.

`host_lifecycle_state` keeps one row per host with the current state,
`state_entered_at` (preserved while the state is unchanged), the primary
listing's facts, and `last_synced_at`.

## Campaigns (one email per campaign per host, ever)

| key | fires when | timing |
|---|---|---|
| `no_listing_1` | provider account, no listing | account ≥ 24 h old, ≤ 90 d old |
| `no_listing_2` | still no listing | ≥ 72 h after `no_listing_1` |
| `incomplete_photos` | draft has address, no photos | ≥ 24 h in state |
| `incomplete_info` | draft missing address / price / description | ≥ 24 h in state |
| `publish_1` | complete draft, not published | ≥ 24 h in state |
| `stripe_1` | published, Stripe not connected | ≥ 24 h in state |
| `stripe_2` | still no Stripe | ≥ 72 h after `stripe_1` |
| `no_booking_1` | published + Stripe, zero bookings | live ≥ 10 d |

At most one campaign per group is queued per evaluation. **State overrides
schedule**: `stillApplies()` runs at enqueue time, again on every sync
(queued jobs whose reason is gone are cancelled), and again immediately
before send. A host who adds photos between enqueue and send never gets the
photos email.

Not implemented on purpose: a dormant-host campaign. There is no reliable
"last active" signal for hosts (no login timestamps in the Integration API),
so any such email would be guessing.

## Send-time gates, in order (`ops/host-lifecycle/src/send.ts`)

1. Lease up to N due `queued` jobs via `lease_communication_jobs()`
   (`FOR UPDATE SKIP LOCKED`; two workers can never take the same job).
2. Re-read the host's state row; defer if the last sync is > 3 h old.
3. `stillApplies()` → cancel if the state moved on.
4. Suppression: `suppressed_emails` (bounce / complaint / unsubscribe), used
   `email_unsubscribe_tokens`, `composer_unsubscribes`, and
   `host_subscribers` rows that are unsubscribed / paused / excluded /
   Intercom-paused.
5. Email must be verified in Sharetribe.
6. Per-user gap: no lifecycle email within `HOST_LIFECYCLE_USER_GAP_HOURS`
   (default 24) of the previous one.
7. Render; the rendered HTML is stored on the job for every outcome.
8. `decideDelivery()`: `send` only if `HOST_LIFECYCLE_EMAILS_ENABLED=true`
   **and** (`HOST_EMAIL_MODE=production`, or `allowlist` with the recipient
   in `HOST_EMAIL_ALLOWLIST`). Anything else is recorded as `dry_run`.
9. Template must be production-ready (no `{{DEREK_SUPPORT_PHONE}}` placeholder).
10. Daily cap (`HOST_LIFECYCLE_DAILY_CAP`, default 25 sends per UTC day).
11. CTA URL must answer a GET without a 4xx/5xx.
12. Kill switch is read once more from the environment, then Emailit sends
    with `List-Unsubscribe`, `List-Unsubscribe-Post` and `X-PRNM-Campaign`
    headers. Failures retry up to 3 times, then `failed`.

Job statuses: `queued → leased → sent | dry_run | suppressed | cancelled | failed`.

## Configuration (EAST `.env`; `pm2 restart fresh-web --update-env && pm2 save` after changes)

| var | default | meaning |
|---|---|---|
| `HOST_LIFECYCLE_EMAILS_ENABLED` | `false` | kill switch; anything but `true` records only |
| `HOST_EMAIL_MODE` | `dry_run` | `dry_run` \| `allowlist` \| `production` |
| `HOST_EMAIL_ALLOWLIST` | empty | comma-separated recipients allowed in `allowlist` mode |
| `HOST_LIFECYCLE_DAILY_CAP` | `25` | max real sends per UTC day |
| `HOST_LIFECYCLE_USER_GAP_HOURS` | `24` | min hours between emails to one host |
| `HOST_LIFECYCLE_SUPPORT_PHONE` | unset | Derek's support number shown in every email; **unset blocks production** |
| `HOST_LIFECYCLE_FROM` | `Pool Rental Near Me <support@poolrentalnearme.com>` | From header |
| `HOST_LIFECYCLE_REPLY_TO` | `support@poolrentalnearme.com` | Reply-To |
| `HOST_LIFECYCLE_POSTAL_ADDRESS` | unset | optional footer line |
| `HOST_LIFECYCLE_NO_LISTING_MAX_DAYS` | `90` | onboarding window for the no-listing campaign |
| `HOST_LIFECYCLE_NO_BOOKING_MIN_DAYS` | `10` | days live before the no-booking email |
| `SITE_ORIGIN` | `https://www.poolrentalnearme.com` | base for CTA / unsubscribe links |

Also read from the same file: `EMAILIT_API_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SHARETRIBE_INTEG_CLIENT_ID/SECRET`.

## Templates

`src/lib/host-lifecycle/templates.ts`: branded responsive shell (logo at
`/fw-assets/email/prnm-logo-240.png`, brand blue `#0EA5E9` / `#0B4A6F`),
one CTA per email, a support block from Derek ("Call or text Derek: …" or
"just reply"), footer with unsubscribe link (`/unsubscribe?token=`) and the
one-click endpoint (`/email/unsubscribe`). Every email is signed by Derek or
by nobody. Forbidden language is unit-tested: no invented people, no "90%" /
"10% fee", no insurance, coverage or guarantee claims, no made-up
statistics. Hosts keep 100%; the guest pays a 15% service fee.

## Rollout gates (each needs Derek's explicit GO)

1. **dry_run** (current): every eligible email is rendered and recorded as
   `dry_run`; nothing leaves.
2. **allowlist**: `HOST_EMAIL_MODE=allowlist`, `HOST_EMAIL_ALLOWLIST=<Derek's
   test addresses>`, `HOST_LIFECYCLE_EMAILS_ENABLED=true`. Only allowlisted
   recipients receive mail; everyone else is still recorded as `dry_run`.
3. **production**: `HOST_EMAIL_MODE=production`, support phone set, cap
   confirmed. Emails go to real hosts, ≤ cap per day, one per host per day.

To stop everything at any time: set `HOST_LIFECYCLE_EMAILS_ENABLED=false`
(or remove the cron). Jobs already leased re-read the switch before sending.
