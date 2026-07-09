-- ============================================================================
-- HOST RECRUITMENT SPRINT · Page 1 · /p/learningacademy
-- CRITICAL CTR failure: 5,878 impressions, 0 clicks (pos 8.5).
-- Root cause found: meta description was truncated mid-word ("...maximiz")
--   and the title sold features ("Free Courses & Guides") not the outcome.
-- Fix: outcome-first title, complete keyword-rich meta (142 courses / free /
--   0% fees), 0%-fees + host-signup CTA block prepended to body, and a
--   host-training FAQ (renders visible block + FAQPage JSON-LD via faq_items).
-- STAGED — not applied. Apply on Derek's GO.
-- ============================================================================

UPDATE content_pages SET
  seo_title = 'Pool Host Academy — Free Training to Earn From Your Pool',
  seo_description = '142 free courses to earn more from your pool — pricing, safety, marketing. 0% host fees in 2026 (Swimply charges, we don''t). Start free, no signup.',
  og_title = 'Pool Host Academy — Free Training to Earn From Your Pool',
  og_description = 'Learn to earn more from your pool with 142 free courses. 0% host fees for 2026 — Swimply charges hosts, we don''t. Start free, no signup required.',
  body_markdown = E'> ### 🏊 List your pool free — **0% host fees for 2026**\n> Swimply takes 15%+ from hosts plus a monthly Premium Pass. Pool Rental Near Me charges hosts **$0** for 2026 — you keep everything you earn.\n>\n> **[List your pool free →](/signup)**\n\n' || body_markdown,
  faq_items = '[
    {"question":"Is the Pool Host Academy really free?","answer":"Yes. All 142 courses are 100% free and self-paced. You do not need to sign up or pay anything to start learning how to rent out your pool."},
    {"question":"How much can I earn renting out my pool?","answer":"Most hosts charge $45 to $75 per hour. Because Pool Rental Near Me charges hosts 0% fees for 2026, you keep the full booking amount (minus standard card processing) instead of losing 15%+ to platform fees."},
    {"question":"Do I pay any fees to host my pool on Pool Rental Near Me?","answer":"No. Hosting is 0% host fees for 2026 — unlike Swimply, which takes 15%+ per booking plus a monthly Premium Pass. You keep what you earn."},
    {"question":"What do the free host courses cover?","answer":"Safety and liability, pricing and availability, photos and listing marketing, guest communication, HOA and local rules, and scaling pool hosting into a real side business."},
    {"question":"Do I need any experience to become a pool host?","answer":"No experience is required. The Academy walks you from your first listing to repeat bookings, one short lesson at a time."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'learningacademy';
