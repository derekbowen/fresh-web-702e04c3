-- CTR SWEEP · Bucket B · /p/the-evolution-and-rise-of-pool-toys...  (447 imp, 1.57%, pos 6.9)
-- Keep page; retitle to match real search intent (pool toys / summer), not history.
-- STAGED — not applied.
UPDATE content_pages SET
  seo_title = 'Best Pool Toys for Summer — Floats, Games & Fun Ideas',
  seo_description = 'The best pool toys for summer: floats, games, and inflatables for all ages — plus how to make the most of a private pool rental by the hour.',
  og_title = 'Best Pool Toys for Summer — Floats, Games & Ideas',
  og_description = 'The best pool toys for summer — floats, games, and inflatables for all ages.',
  content_refreshed_at = now()
WHERE slug = 'the-evolution-and-rise-of-pool-toys-a-journey-through-summer-fun';
