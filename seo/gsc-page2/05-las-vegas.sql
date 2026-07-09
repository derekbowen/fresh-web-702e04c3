-- GSC PAGE-2 SPRINT · Page 5 · /p/las-vegas-search-page
-- primary "pool rental las vegas", variants "rent a pool las vegas",
-- "vegas pool party rental". URL slug is weak — DO NOT change URL; clean the
-- title/H1. title/meta/FAQ + party angle. Links in GSC links pass. STAGED.
UPDATE content_pages SET
  seo_title = 'Pool Rentals in Las Vegas, NV — Private & Party Pools',
  seo_description = 'Rent a private pool in Las Vegas by the hour — perfect for pool parties, no crowds, no membership. Browse Vegas backyard pools with photos and hourly prices.',
  og_title = 'Pool Rentals in Las Vegas, NV — Private & Party Pools',
  og_description = 'Rent a private backyard pool by the hour in Las Vegas — great for pool parties. See photos, hourly prices, and reviews.',
  body_markdown = E'## Pool rentals in Las Vegas, NV — private & party pools by the hour\n\nRent a private backyard pool by the hour across Las Vegas and Henderson — ideal for a pool party, a birthday, or beating the desert heat without the Strip crowds. Book just your group, by the hour, with no membership. Most Las Vegas pools rent for about $50–$150 per hour depending on size, heating, and party amenities, and every booking includes liability coverage.\n\n'
    || COALESCE(body_markdown, ''),
  faq_items = '[
    {"question":"How do I rent a pool in Las Vegas?","answer":"Browse private backyard pools in Las Vegas on Pool Rental Near Me, choose your date and hours, and book online — no membership needed. The pool is private to just your group for the time you reserve."},
    {"question":"Can I rent a pool for a party in Las Vegas?","answer":"Yes — many Las Vegas hosts welcome pool parties. Filter for larger pools and party-friendly amenities, check the guest limit, and book by the hour. Confirm party details with the host before booking."},
    {"question":"How much does it cost to rent a pool in Las Vegas?","answer":"Most Las Vegas pools rent for roughly $50 to $150 per hour depending on size, heating, and party amenities like hot tubs, cabanas, or sound systems. You only pay for the hours you book."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'las-vegas-search-page';
