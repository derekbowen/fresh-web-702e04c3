# Renter pool-match email drip

## What it does

1. **Every 15 min**: poll Sharetribe Integration API for new renters. Pull `email`, `displayName`, and the ZIP code from signup extended data (profile.protectedData.zip or publicData.zip — I'll detect which). Upsert into `renter_subscribers`.
2. **On new subscriber**: queue a welcome email + a 14-day daily sequence of "pool of the day" emails (one pool near their ZIP, with photo, price, link to listing).
3. **Cron every 5 min**: drains the queue and sends due emails via Emailit (same client we already use).
4. **Day 7 and Day 14**: replace the daily pool with a "know someone with a pool? refer them" email.
5. **One-click unsubscribe** in every email (reuses existing `email_unsubscribe_tokens` table).

## Pool matching

ZIP → lat/lng via a free ZIP lookup table I'll seed from a CSV (US ZIPs only, ~42k rows, ~3MB). Then query Sharetribe `listings/query` with `origin=lat,lng` and a 50-mile radius, filter to ones with photos, rotate so the same renter doesn't get the same pool twice (track in `renter_email_sends`).

## Files

```text
supabase/migrations/<ts>_renter_drip.sql
  - renter_subscribers (id, st_user_id unique, email, name, zip, lat, lng, status, created_at)
  - renter_emails (id, subscriber_id, step, kind, scheduled_at, status, listing_id, sent_at, emailit_id)
  - us_zips (zip pk, lat, lng, city, state)  -- seeded from public CSV
  - cron: poll-sharetribe-renters-15m, send-renter-emails-5m

src/server/sharetribe-renter-poll.server.ts
  - listNewRenters(sinceISO): hits ST Integration API users/query, returns {st_user_id, email, name, zip}

src/server/renter-pool-matcher.server.ts
  - pickPoolForSubscriber(subscriberId): returns a listing not yet sent

src/lib/email-templates/renter-welcome.tsx
src/lib/email-templates/renter-pool-of-the-day.tsx
src/lib/email-templates/renter-referral.tsx

src/routes/api/public/hooks/poll-sharetribe-renters.ts
  - GET (apikey auth) → run poller, upsert subscribers, schedule 14-day sequence
src/routes/api/public/hooks/send-renter-emails.ts
  - GET (apikey auth) → pick due rows, render template, send via emailit, mark sent

src/routes/api/public/unsubscribe-renter.ts
  - GET ?token=... → mark subscriber unsubscribed, cancel pending emails

src/routes/admin.renter-drip.tsx
  - Subscriber list, send log, manual "send next now" button
```

## Sequence (14 days)

```text
Day 0  Welcome + 3 nearby pools
Day 1  Pool of the day
Day 2  Pool of the day
Day 3  Pool of the day
Day 5  Pool of the day
Day 7  "Know anyone with a pool? Refer them" (referral CTA)
Day 9  Pool of the day
Day 11 Pool of the day
Day 14 Final referral push, then sequence ends
```

User can change cadence later — it's all rows in `renter_emails`.

## Deliverability note

Daily sends to people who signed up to *use* the marketplace (not opted into newsletter) is aggressive. I'll honor unsubscribe instantly, suppress on bounce, and cap at 1 email/day. If complaint rates climb, we throttle to 2-3x/week — easy config change.

## Secrets needed

- `SHARETRIBE_INTEG_CLIENT_ID` ✅ already set
- `SHARETRIBE_INTEG_CLIENT_SECRET` ✅ already set
- `EMAILIT_API_KEY` ✅ already set
- `HOOKS_ADMIN_TOKEN` (or anon key) for cron auth — already wired

No new secrets required.

## Out of scope (ask if you want them)

- SMS to renters (you said you're done with SMS)
- Host-side recommendations (this is renter-side only)
- Re-engaging dormant renters (>30 days inactive) — separate job

## Open question

Where exactly does ZIP live on the Sharetribe user object? I'll inspect the first few users when the poller runs and adjust if it's `publicData.zip` vs `protectedData.zip` vs `address.postal`. If ZIP is missing on a user, I'll fall back to city/state and skip them if neither is present.