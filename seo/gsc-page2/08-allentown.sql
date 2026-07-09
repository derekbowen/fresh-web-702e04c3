-- GSC PAGE-2 SPRINT · Page 8 · /p/allentown · primary "pool rental allentown pa"
-- Already converts (35 clicks) — LIGHT touch: title, meta, FAQ. No body edit.
-- Inbound links in GSC links pass. STAGED — not applied.
UPDATE content_pages SET
  seo_title = 'Pool Rental Allentown, PA — Private Pools by the Hour',
  seo_description = 'Rent a private pool by the hour in Allentown, PA — no crowds, no membership. Browse Lehigh Valley backyard pools with photos, hourly prices, and reviews.',
  og_title = 'Pool Rental Allentown, PA — Private Pools by the Hour',
  og_description = 'Rent a private backyard pool by the hour in Allentown, PA. See photos, hourly prices, and reviews.',
  faq_items = '[
    {"question":"How do I rent a pool in Allentown?","answer":"Browse private backyard pools in Allentown, PA on Pool Rental Near Me, choose your date and hours, and book online — no membership needed. The pool is private to just your group for the time you reserve."},
    {"question":"Are there private pools to rent in Allentown, PA?","answer":"Yes. Pool Rental Near Me lists private residential pools you can rent by the hour across Allentown and the Lehigh Valley, so you can find a private pool near you without a club or crowds."},
    {"question":"How much does it cost to rent a pool in Allentown?","answer":"Most Allentown pools rent for roughly $40 to $80 per hour depending on size, heating, and amenities. You only pay for the hours you book."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'allentown';
