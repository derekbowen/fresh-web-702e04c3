-- CTR SWEEP · Bucket B · /p/how-it-works  (5,916 imp, 0.02% CTR, pos 8.5)
-- Meta was truncated mid-word ("...relaxing getaw"); title was brand-first.
-- Query-first title + complete intent meta. STAGED — not applied.
UPDATE content_pages SET
  seo_title = 'How Does Pool Rental Work? Book a Private Pool by the Hour',
  seo_description = 'How pool rental works: browse private pools near you, book by the hour, and swim — no membership. Or list your pool and earn. Here''s the simple version.',
  og_title = 'How Does Pool Rental Work?',
  og_description = 'Browse private pools near you, book by the hour, and swim — no membership. Or list your pool to earn.',
  content_refreshed_at = now()
WHERE slug = 'how-it-works';
