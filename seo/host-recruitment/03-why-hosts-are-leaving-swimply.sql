-- ============================================================================
-- HOST RECRUITMENT SPRINT · Page 3 · /p/why-hosts-are-leaving-swimply
-- pos 10.3 — one nudge from page 1. Also fixes a STALE-FEE bug: page still
-- said "10% flat host fee" (pre-0%-launch). Refresh with 2026 developments
-- (fee increases, ~$29/mo Premium Pass paywall, the "Daisy" AI score), fix
-- fees to 0%, add CTA + FAQ. Inbound internal links added in the links pass.
-- STAGED — not applied. Apply on Derek's GO.
-- ============================================================================

UPDATE content_pages SET
  seo_title = 'Why Hosts Are Leaving Swimply in 2026 — Fees, AI Score, Pass',
  seo_description = 'Swimply raised host fees, added a ~$29/mo Premium Pass, and ranks hosts by an AI score. See why hosts switch to Pool Rental Near Me — 0% fees for 2026.',
  og_title = 'Why Hosts Are Leaving Swimply in 2026',
  og_description = 'Rising fees, a ~$29/mo Premium Pass, and an opaque AI score. See why pool hosts are switching to 0% host fees for 2026.',
  description = 'Hosts are leaving Swimply over rising 15–20% fees, a ~$29/mo Premium Pass paywall, and an opaque AI score. Pool Rental Near Me charges 0% host fees for 2026.',
  body_markdown = E'> ### 🏊 Keep 100% of what you earn — **0% host fees for 2026**\n> Tired of Swimply''s rising cut? Pool Rental Near Me charges hosts **$0** for 2026.\n>\n> **[List your pool free →](/signup)**\n\n## What changed at Swimply in 2026\n\n- **Higher host fees.** Host commissions have climbed to roughly 15–20% per booking.\n- **The Premium Pass paywall.** Better search placement now sits behind a ~$29/month Premium Pass — pay monthly or get buried.\n- **The "Daisy" AI score.** An opaque AI score increasingly decides which listings guests see, leaving many established hosts with fewer bookings and no clear way to recover ranking.\n\nHosts are leaving because the math stopped working. Here is how Pool Rental Near Me compares — and why switching is free.\n\n'
    || replace(replace(body_markdown, '10% flat host fee', '0% host fees for 2026'), '10% flat fee', '0% host fees'),
  faq_items = '[
    {"question":"Why are hosts leaving Swimply?","answer":"Rising host commissions (now roughly 15–20% per booking), a new ~$29/month Premium Pass required for good placement, and an opaque AI score that quietly decides which listings guests see. Many hosts want to keep more of what they earn, so they switch to Pool Rental Near Me and its 0% host fees for 2026."},
    {"question":"Does Swimply charge a monthly fee now?","answer":"Swimply promotes a ~$29/month Premium Pass for better search placement and features. Pool Rental Near Me has no monthly fee and 0% host fees for 2026."},
    {"question":"Is there a Swimply alternative with no host fees?","answer":"Yes. Pool Rental Near Me charges hosts 0% for 2026 — no commission, no monthly pass — and includes liability coverage. You keep everything you earn."},
    {"question":"How do I switch from Swimply to Pool Rental Near Me?","answer":"List your pool free at /signup, add your photos and availability, and start taking bookings. There is no fee to join and no monthly pass."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'why-hosts-are-leaving-swimply';
