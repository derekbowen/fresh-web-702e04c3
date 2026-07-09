-- ============================================================================
-- GSC PAGE-2 SPRINT · Page 1 · /p/new-york-ny
-- primary: "pool rental new york" — 6,965 imp, pos 11.6 (highest page-2 URL).
-- variants: "rent a pool nyc", "private pools near me nyc".
-- Keyword-first title + hook, renter FAQ, borough/pricing content.
-- Inbound links (homepage, /p/all-locations) in the GSC links pass.
-- STAGED — not applied. Apply on Derek's GO.
-- ============================================================================

UPDATE content_pages SET
  seo_title = 'Pool Rental New York, NY — Rent a Private Pool by the Hour',
  seo_description = 'Rent a private backyard pool by the hour in New York, NY — no crowds, no membership. Browse pools across Brooklyn, Queens & the boroughs with hourly pricing.',
  og_title = 'Pool Rental New York, NY — Private Pools by the Hour',
  og_description = 'Rent a private pool by the hour across NYC — Brooklyn, Queens, the Bronx and beyond. See photos, hourly prices, and reviews.',
  body_markdown = E'## Pool rental in New York, NY — private pools by the hour\n\nSkip the crowded public pools and book a private backyard pool by the hour across New York City. Pool Rental Near Me lists private pools in **Brooklyn, Queens, the Bronx, Staten Island, and the wider NYC metro** — perfect for a family afternoon, a birthday, or a quiet swim with no strangers and no membership.\n\nMost NYC pools rent in the **$50–$150 per hour** range depending on size, heating, and amenities, and you only pay for the hours you book. Every booking includes liability coverage.\n\n'
    || COALESCE(body_markdown, ''),
  faq_items = '[
    {"question":"How do I rent a pool in NYC?","answer":"Browse private backyard pools near you on Pool Rental Near Me, pick your date and hours, and book online — no membership required. You get a private pool for just your group, by the hour, across Brooklyn, Queens, the Bronx and the rest of New York City."},
    {"question":"Are there private pools near me in NYC?","answer":"Yes. Pool Rental Near Me lists private residential pools you can rent by the hour throughout New York City and the surrounding metro, so you can find a private pool near you without a club membership or crowds."},
    {"question":"How much does it cost to rent a pool in New York?","answer":"Most New York pools rent for about $50 to $150 per hour, depending on pool size, heating, and amenities like hot tubs or cabanas. You only pay for the hours you reserve."},
    {"question":"Which NYC boroughs have pools to rent?","answer":"You can find private pools to rent across Brooklyn, Queens, the Bronx, Staten Island, and nearby Long Island and New Jersey suburbs — with more added throughout the season."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'new-york-ny';
