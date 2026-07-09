-- HOST RECRUITMENT SPRINT · Page 6 · /p/become-a-swimming-pool-host-san-diego-ca
-- host_acq_city, pos 10.8. Light touch: 0% fees + earnings title/meta, CTA,
-- 3-Q FAQ. Inbound links (from /p/san-diego-ca renter page + CA advocacy) in
-- the links pass. STAGED — not applied.
UPDATE content_pages SET
  seo_title = 'Rent Out Your Pool in San Diego — 0% Host Fees (2026)',
  seo_description = 'Earn by the hour renting your San Diego pool. 0% host fees for 2026 (Swimply charges 15–20%), liability coverage included. See requirements — list free.',
  og_title = 'Rent Out Your Pool in San Diego — 0% Host Fees (2026)',
  og_description = 'Turn your San Diego pool into hourly income. 0% host fees for 2026, coverage included. List your pool free.',
  body_markdown = E'> ### 🏊 Rent out your San Diego pool — **0% host fees for 2026**\n> Swimply takes 15–20%. Pool Rental Near Me charges hosts **$0** for 2026 — you keep every dollar. **[List your pool free →](/signup)**\n\n'
    || COALESCE(body_markdown, ''),
  faq_items = '[
    {"question":"How much can I earn renting my pool in San Diego?","answer":"San Diego pool hosts commonly charge $50–$75 per hour. Because Pool Rental Near Me charges 0% host fees for 2026, you keep the full booking amount instead of losing 15–20% to platform fees."},
    {"question":"Do I pay any fees to host my pool in San Diego?","answer":"No. Host fees are 0% for 2026 — unlike Swimply, which takes 15–20% plus a monthly Premium Pass. Liability coverage is included on every booking."},
    {"question":"What do I need to start hosting my pool in San Diego?","answer":"A clean, safe pool, a few good photos, and your available hours. List free at /signup — no listing fees, no monthly pass, and coverage is included."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'become-a-swimming-pool-host-san-diego-ca';
