-- GSC PAGE-2 SPRINT · Page 7 · /p/atlanta · primary "pool rental atlanta"
-- variants "rent a pool atlanta ga", "private pool atlanta". Current title was
-- HOST-focused ("Host Your Pool") — wrong intent; renter rewrite + intro + FAQ.
-- Inbound links in GSC links pass. STAGED — not applied.
UPDATE content_pages SET
  seo_title = 'Pool Rental Atlanta, GA — Rent a Private Pool by the Hour',
  seo_description = 'Rent a private backyard pool by the hour in Atlanta, GA — no crowds, no membership. Browse Atlanta pools with photos, hourly prices, and reviews.',
  og_title = 'Pool Rental Atlanta, GA — Private Pools by the Hour',
  og_description = 'Rent a private backyard pool by the hour across Atlanta, GA. See photos, hourly prices, and reviews.',
  body_markdown = E'## Pool rental in Atlanta, GA — private pools by the hour\n\nRent a private backyard pool by the hour across Atlanta and the metro — Buckhead, Decatur, Marietta, Sandy Springs and beyond. No crowds, no membership: the pool is yours and your group''s for the hours you book, perfect for a cookout, a birthday, or a hot Georgia afternoon. Most Atlanta pools rent for about $40–$90 per hour, and every booking includes liability coverage.\n\n'
    || COALESCE(body_markdown, ''),
  faq_items = '[
    {"question":"How do I rent a pool in Atlanta, GA?","answer":"Browse private backyard pools in Atlanta on Pool Rental Near Me, choose your date and hours, and book online — no membership required. The pool is private to just your group for the time you reserve."},
    {"question":"Are there private pools to rent in Atlanta?","answer":"Yes. Pool Rental Near Me lists private residential pools you can rent by the hour across Atlanta and the metro, so you can find a private pool near you without a club or crowds."},
    {"question":"How much does it cost to rent a pool in Atlanta?","answer":"Most Atlanta pools rent for roughly $40 to $90 per hour depending on size, heating, and amenities like hot tubs or grills. You only pay for the hours you book."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'atlanta';
