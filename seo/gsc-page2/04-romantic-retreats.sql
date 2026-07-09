-- GSC PAGE-2 SPRINT · Page 4 · /p/top-20-romantic-us-retreats-with-pools
-- primary "us resorts with private pools" (pos 17.6) + "romantic retreats with
-- private pools". Earns 53 clicks at pos 13.9 — refresh title w/ 2026, add FAQ.
-- Links from blog hub in GSC links pass. STAGED — not applied.
UPDATE content_pages SET
  seo_title = '20 US Resorts With Private Pools — Romantic Retreats (2026)',
  seo_description = 'The 20 most romantic US resorts and retreats with private pools for 2026 — plunge pools, private villas, and adults-only escapes. Plus how to rent one by the hour.',
  og_title = '20 Romantic US Resorts With Private Pools (2026)',
  og_description = 'The most romantic US resorts and retreats with private pools for 2026 — plunge pools, private villas, and adults-only escapes.',
  faq_items = '[
    {"question":"Which US resorts have private pools?","answer":"Many romantic US resorts offer rooms or villas with private plunge or dipping pools — common in Arizona, California, Florida, Hawaii, and the Texas Hill Country. This guide rounds up 20 of the most romantic options for 2026, from adults-only escapes to secluded villa retreats."},
    {"question":"What are the best romantic retreats with private pools?","answer":"The best romantic retreats with private pools pair seclusion with a pool only you and your partner can use — private villas, casitas, or suites with a walled patio pool. See our 2026 top-20 list for standout picks across the US."},
    {"question":"Can I rent a private pool by the hour instead of booking a resort?","answer":"Yes. If you just want private pool time for a date or celebration, you can rent a private backyard pool by the hour near you on Pool Rental Near Me — no resort stay required."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'top-20-romantic-us-retreats-with-pools';
