-- ============================================================================
-- GSC PAGE-2 SPRINT · Page 6 · SAN DIEGO CONSOLIDATION
-- /p/san-diego-ca (pos 19.1) and /p/privatepoolrentalssandiego (pos 19.3) were
-- cannibalizing. san-diego-ca already lists the other in legacy_slugs, but the
-- duplicate has its own live row so the alias never fired. Fix:
--   1) Strengthen san-diego-ca (winner): renter title/meta/FAQ + SD content.
--   2) 301 /p/privatepoolrentalssandiego -> /p/san-diego-ca via status=redirect
--      + redirect_to, and drop it from the sitemap.
-- Internal links pointing at the old slug are updated in the GSC links pass.
-- primary: "pool rental san diego". STAGED — not applied.
-- ============================================================================

-- 1) Winner
UPDATE content_pages SET
  seo_title = 'Pool Rental San Diego, CA — Rent a Private Pool by the Hour',
  seo_description = 'Rent a private pool by the hour in San Diego, CA — no crowds, no membership. Browse San Diego backyard pools with photos, hourly prices, and reviews.',
  og_title = 'Pool Rental San Diego, CA — Private Pools by the Hour',
  og_description = 'Rent a private backyard pool by the hour across San Diego, CA. See photos, hourly prices, and reviews.',
  body_markdown = E'## Pool rental in San Diego, CA — private pools by the hour\n\nRent a private backyard pool by the hour across San Diego — from La Jolla and Pacific Beach to Chula Vista, Escondido, and North County. No crowds, no membership: the pool is yours and your group''s for the hours you book, perfect for a beach-day alternative, a birthday, or a warm SoCal afternoon. Most San Diego pools rent for about $45–$100 per hour depending on size, heating, and amenities, and every booking includes liability coverage.\n\n'
    || COALESCE(body_markdown, ''),
  faq_items = '[
    {"question":"How do I rent a pool in San Diego?","answer":"Browse private backyard pools in San Diego on Pool Rental Near Me, choose your date and hours, and book online — no membership needed. The pool is private to just your group for the time you reserve."},
    {"question":"Are there private pools near me in San Diego?","answer":"Yes. Pool Rental Near Me lists private residential pools you can rent by the hour across San Diego County — La Jolla, Chula Vista, Escondido, North County and more — so you can find a private pool near you without a club or crowds."},
    {"question":"How much does it cost to rent a pool in San Diego?","answer":"Most San Diego pools rent for roughly $45 to $100 per hour depending on size, heating, and amenities like hot tubs or ocean views. You only pay for the hours you book."},
    {"question":"Which San Diego neighborhoods have pools to rent?","answer":"You can find private pools across La Jolla, Pacific Beach, Chula Vista, Escondido, El Cajon, and the North County coast, with more added throughout the season."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'san-diego-ca';

-- 2) 301 the duplicate -> winner, remove from sitemap
UPDATE content_pages SET
  status = 'redirect',
  redirect_to = 'san-diego-ca',
  in_sitemap = false,
  content_refreshed_at = now()
WHERE slug = 'privatepoolrentalssandiego';
