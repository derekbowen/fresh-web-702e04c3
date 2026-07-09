-- HOST RECRUITMENT SPRINT · Page 7 · /p/become-a-swimming-pool-host-sacramento-ca
-- host_acq_city, pos 10.0. Light touch. Inbound links (from
-- /p/sacramentobestprivatepools + CA advocacy) in the links pass. STAGED.
UPDATE content_pages SET
  seo_title = 'Rent Out Your Pool in Sacramento — 0% Host Fees (2026)',
  seo_description = 'Earn by the hour renting your Sacramento pool. 0% host fees for 2026 (Swimply charges 15–20%), liability coverage included. See requirements — list free.',
  og_title = 'Rent Out Your Pool in Sacramento — 0% Host Fees (2026)',
  og_description = 'Turn your Sacramento pool into hourly income. 0% host fees for 2026, coverage included. List your pool free.',
  body_markdown = E'> ### 🏊 Rent out your Sacramento pool — **0% host fees for 2026**\n> Swimply takes 15–20%. Pool Rental Near Me charges hosts **$0** for 2026 — you keep every dollar. **[List your pool free →](/signup)**\n\n'
    || COALESCE(body_markdown, ''),
  faq_items = '[
    {"question":"How much can I earn renting my pool in Sacramento?","answer":"Sacramento pool hosts commonly charge $45–$70 per hour. Because Pool Rental Near Me charges 0% host fees for 2026, you keep the full booking amount instead of losing 15–20% to platform fees."},
    {"question":"Do I pay any fees to host my pool in Sacramento?","answer":"No. Host fees are 0% for 2026 — unlike Swimply, which takes 15–20% plus a monthly Premium Pass. Liability coverage is included on every booking."},
    {"question":"What do I need to start hosting my pool in Sacramento?","answer":"A clean, safe pool, a few good photos, and your available hours. List free at /signup — no listing fees, no monthly pass, and coverage is included."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'become-a-swimming-pool-host-sacramento-ca';
