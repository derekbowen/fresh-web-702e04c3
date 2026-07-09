-- GSC PAGE-2 SPRINT · Page 2 · /p/riverside · primary "pool rental riverside ca"
-- pos 11.0 (closest to page 1) — LIGHT touch: title, meta, FAQ only. No body
-- edit. Inbound links in the GSC links pass. STAGED — not applied.
UPDATE content_pages SET
  seo_title = 'Pool Rental Riverside, CA — Private Pools by the Hour',
  seo_description = 'Rent a private pool by the hour in Riverside, CA — no crowds, no membership. Browse Riverside backyard pools with photos, hourly prices, and reviews.',
  og_title = 'Pool Rental Riverside, CA — Private Pools by the Hour',
  og_description = 'Rent a private backyard pool by the hour in Riverside, CA. See photos, hourly prices, and reviews.',
  faq_items = '[
    {"question":"How do I rent a pool in Riverside?","answer":"Browse private backyard pools in Riverside, CA on Pool Rental Near Me, choose your date and hours, and book online — no membership needed. The pool is private to just your group for the time you reserve."},
    {"question":"Are there private pools to rent in Riverside, CA?","answer":"Yes. Pool Rental Near Me lists private residential pools you can rent by the hour throughout Riverside and the Inland Empire, so you can find a private pool near you without a club or crowds."},
    {"question":"How much does it cost to rent a private pool in Riverside?","answer":"Most Riverside pools rent for roughly $40 to $90 per hour depending on size, heating, and amenities. You only pay for the hours you book."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'riverside';
