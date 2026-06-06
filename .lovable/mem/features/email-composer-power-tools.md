---
name: Email composer power tools
description: Snippets, AI sequence drafts, A/B subject tests, preview-as-recipient
type: feature
---
Composer at /admin/email-composer has 4 power tools:

- **Snippets** (`composer_snippets` table): reusable body blocks. Save current body with name+category (intro/cta/signoff/general). Insert at cursor or replace whole body.
- **Preview as recipient**: lookup by email across host_subscribers/renter_subscribers/pool_waitlist via `lookupRecipient()`. Renders preview with real first_name + correct unsubscribe URL.
- **AI sequence drafts**: `generateSequenceWithAI({description, touches: 2-7, tone})` → array of {subject, bodyText, dayOffset, intent}. `scheduleSequence()` creates N scheduled campaigns sharing a sequence_id with day-offset spacing.
- **Subject A/B test** (`composer_ab_tests` table): split sample N% each to subject A/B. Cron `/api/public/hooks/ab-auto-winner` (every minute) auto-picks winner by lowest failure rate (no open tracking from Emailit yet) after `winner_after_minutes`. Admin can manually pick A or B from the A/B panel before timer fires. Winner ships to remaining recipients (stored as custom_emails snapshot on a `status='ab_pending'` campaign row tagged `ab_variant='winner'`).

Composer campaigns gained: ab_test_id, ab_variant ('a'|'b'|'winner'), sequence_id, sequence_position. All extras tables are admin-only (service_role grants only, no anon/authenticated).
