## Email Composer — admin tool

A single-page admin email tool to compose, AI-generate, preview, and send branded emails to chosen audiences (or individual addresses) with built-in unsubscribe compliance.

### Where it lives
- Route: `/admin/email-composer` (admin-gated, same as other `/admin/*` pages)
- Top-nav button: add an **"Email Composer"** button to `src/components/admin-layout.tsx` so it's one click from every admin page

### Compose UI (single page)
1. **Audience** — choose one:
   - Sharetribe hosts (existing `host_subscribers`, active only)
   - Sharetribe renters/customers (existing `renter_subscribers`, active only)
   - Pool waitlist (`pool_waitlist` table — people who requested a pool)
   - Custom: paste comma/newline-separated emails
   - Single recipient (one email box)
   - Live count shown ("Will send to 767 active renters")
2. **From** — locked to `Pool Rental Near Me <hello@notify.poolfriends.poolrentalnearme.com>` (proven sender)
3. **Subject** — text input
4. **Body** — three tabs:
   - **AI Generate**: short description → calls Lovable AI Gateway (`google/gemini-3-flash-preview`) → fills branded HTML template
   - **Templates**: pick a starter (Announcement, Tips, Reminder, Promo, Plain text) → loads into the editor
   - **Custom HTML / Paste**: textarea for raw paste; rich preview toggle
5. **Preview** — right-side live HTML preview (renders the final template with brand header + unsubscribe footer)
6. **Send** — buttons: "Send test to me", "Send to N recipients" (confirm dialog showing audience count)

### Compliance (every send)
- Brand header with logo top
- Per-recipient `{{unsubscribe_url}}` substitution using the recipient's existing unsubscribe token (renter_subscribers / host_subscribers already store one; for waitlist + custom we mint a token in `email_unsubscribe_tokens`)
- `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers
- Suppression check against `suppressed_emails` before each send
- Skips any recipient with `status = 'unsubscribed'` in their source table
- Paced at ~1.5/sec to stay under Emailit's 2/sec limit
- Every send logged to a new `composer_email_log` table (campaign id, recipient, status, error, sent_at)

### Backend pieces
- New server functions in `src/server/email-composer.server.ts`:
  - `getAudienceCount(audience)` — count active recipients
  - `generateEmailWithAI({ description, tone })` — calls Lovable AI Gateway, returns HTML body wrapped in the shared branded shell
  - `sendComposerEmail({ audience, customEmails, subject, htmlBody, testOnly })` — resolves recipients, renders per-recipient HTML with unsub URL, queues + sends via Emailit with pacing, writes to `composer_email_log`
- All wrapped with `requireSupabaseAuth` + admin role check (same pattern as `admin.renter-drip.tsx`)

### Database
New migration:
- `composer_campaigns` (subject, audience, body_html, sent_count, status, created_by, created_at)
- `composer_email_log` (campaign_id, recipient_email, status, error, sent_at)
- Grants + RLS: admin-only via `has_role()`; `service_role` full access for server fns

### Branded shell
Shared HTML wrapper in `src/lib/email-static/composer/_shell.ts` (logo header + blue accent + footer with company address + unsubscribe link). The AI/template/custom body is injected into the shell's `{{body}}` slot so every email is on-brand and compliant.

### AI prompt
System prompt instructs the model to:
- Write in our brand voice (founder-mentor, sentence case, no banned words from project knowledge)
- Return only the inner body HTML (no `<html>`/`<head>`)
- Use simple inline-styled `<p>`, `<h2>`, `<a>` matching blue accent `#0ea5e9`
- Include a clear CTA when the description implies one

### Files to add / edit
- `src/routes/admin.email-composer.tsx` (new, the UI)
- `src/server/email-composer.server.ts` (new, send + AI logic)
- `src/lib/email-static/composer/_shell.ts` (new, branded shell)
- `src/components/admin-layout.tsx` (edit — add nav button)
- Migration: create `composer_campaigns` + `composer_email_log` with grants + RLS

### What I will NOT change
- Existing renter-drip / host-drip systems stay as-is
- Sender domain, Emailit integration, unsubscribe routes — reuse what already works

Approve and I'll build it.