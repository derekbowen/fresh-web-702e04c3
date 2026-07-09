-- HOST RECRUITMENT SPRINT · Page 8 · /p/howtoturnyourbackyardpoolintoabusinessasset
-- resource, pos 15.6. Title rewrite + earnings-math section + FAQ. Inbound
-- links (from /p/hosting + /p/learningacademy) in the links pass. STAGED.
UPDATE content_pages SET
  seo_title = 'Turn Your Backyard Pool Into a Business Asset (2026 Guide)',
  seo_description = 'How to turn your backyard pool into a real income asset: hourly earnings math, setup, pricing, and 0% host fees for 2026. Start free — no listing fees.',
  og_title = 'Turn Your Backyard Pool Into a Business Asset (2026 Guide)',
  og_description = 'Real earnings math, setup steps, and pricing to turn your backyard pool into an income asset. 0% host fees for 2026.',
  body_markdown = E'> ### 🏊 Turn your pool into income — **0% host fees for 2026**\n> Keep 100% of what you earn (Swimply takes 15–20%). **[List your pool free →](/signup)**\n\n## The earnings math\n\nYour backyard pool is an under-used asset. Here is the simple math hosts use:\n\n**Hourly rate × bookings per week × weeks = monthly income.**\n\n- At **$50/hour**, just **5 bookings a week** (say 2 hours each) = **$2,000/month**.\n- At **$65/hour**, **8 bookings a week** at 2 hours = about **$4,160/month**.\n- Peak summer weekends can push a popular pool well beyond that.\n\nBecause Pool Rental Near Me charges **0% host fees for 2026**, you keep the full amount — a Swimply host at 15–20% would hand back $300–$800 of that same income every month.\n\n'
    || COALESCE(body_markdown, ''),
  faq_items = '[
    {"question":"How much money can a backyard pool make?","answer":"At $50/hour with 5 two-hour bookings a week, a backyard pool earns about $2,000/month; at $65/hour with more demand, $4,000+/month is realistic in peak season. With 0% host fees for 2026 on Pool Rental Near Me, you keep the full amount."},
    {"question":"Is renting out my backyard pool worth it?","answer":"For most owners, yes — the pool is already built and maintained, so hourly rentals turn a fixed cost into income. 0% host fees for 2026 means you keep everything you earn instead of losing 15–20% to platform fees."},
    {"question":"What does it cost to start renting my pool?","answer":"Nothing to list. Pool Rental Near Me has 0% host fees for 2026, no listing fees, and no monthly pass, and liability coverage is included on every booking. List free at /signup."},
    {"question":"How do I price my pool rental?","answer":"Start near comparable pools in your area (often $45–$75/hour), then adjust for size, amenities, and demand. The free Pool Host Academy covers pricing in detail."}
  ]'::jsonb,
  content_refreshed_at = now()
WHERE slug = 'howtoturnyourbackyardpoolintoabusinessasset';
