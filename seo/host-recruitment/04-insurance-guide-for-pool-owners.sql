-- ============================================================================
-- HOST RECRUITMENT SPRINT · Page 4 · /p/insurance-guide-for-pool-owners
-- pos 9.1. Capture "pool insurance for renters" (269 imp, 0 clicks) and
-- "pool rental insurance" with dedicated sections + FAQ using those exact
-- phrasings. Add 0%-fees CTA. Terms/host internal links in the links pass.
-- STAGED — not applied. Apply on Derek's GO.
-- ============================================================================

UPDATE content_pages SET
  seo_description = 'Pool insurance for renters and owners: what pool rental insurance covers and what it costs. Hosts get liability coverage included — 0% host fees for 2026.',
  og_title = 'Pool Insurance for Renters & Owners (2026 Guide)',
  og_description = 'What pool rental insurance covers, what it costs, and the coverage hosts get free on Pool Rental Near Me — 0% host fees for 2026.',
  body_markdown = E'> ### 🏊 Host with coverage included — **0% host fees for 2026**\n> Every Pool Rental Near Me booking includes liability coverage, and hosts pay **$0** in fees for 2026. **[List your pool free →](/signup)**\n\n## Pool insurance for renters\n\nRenting a pool by the hour? "Pool insurance for renters" refers to the liability coverage that protects you and the host during a booking — for slips, injuries, or accidental damage while you use the pool. On Pool Rental Near Me, that coverage is included on every booking, so guests are protected without buying a separate policy.\n\n## Pool rental insurance for hosts\n\nStandard homeowners policies often exclude commercial or paid use of your pool, which is exactly what an hourly rental is. "Pool rental insurance" closes that gap. Pool Rental Near Me includes host liability coverage on every booking at no extra cost — one more reason hosts keep more with 0% host fees for 2026.\n\n'
    || body_markdown,
  faq_items = '[
    {"question":"Do I need pool insurance for renters?","answer":"If you rent a pool by the hour, pool insurance for renters means the liability coverage that protects you and the host during your booking. On Pool Rental Near Me it is included on every booking, so you do not need to buy a separate policy to book."},
    {"question":"What is pool rental insurance?","answer":"Pool rental insurance is liability coverage for paid, hourly use of a pool — the kind standard homeowners policies usually exclude. It covers slips, injuries, and accidental damage during a booking. Pool Rental Near Me includes it on every booking at no extra cost."},
    {"question":"Does Pool Rental Near Me include insurance for hosts?","answer":"Yes. Every booking includes host liability coverage at no extra charge, and hosts pay 0% fees for 2026 — so you get coverage and keep everything you earn."},
    {"question":"Does my homeowners policy cover pool rentals?","answer":"Usually not. Most homeowners policies exclude commercial or paid use, which is what an hourly rental is. That is why dedicated pool rental insurance — included on Pool Rental Near Me bookings — matters."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'insurance-guide-for-pool-owners';
