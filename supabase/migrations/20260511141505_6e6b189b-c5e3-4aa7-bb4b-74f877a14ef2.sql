ALTER TABLE public.site_footer_settings
  ADD COLUMN IF NOT EXISTS compare_links jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.site_footer_settings
SET compare_links = '[
  {"label":"Pool Rental Near Me vs Swimply","href":"/p/swimply-alternative-vs-pool-rental-near-me"},
  {"label":"Pool Rental Near Me vs Peerspace","href":"/p/peerspace-vs-pool-rental-near-me"},
  {"label":"Pool Rental Near Me vs Giggster","href":"/p/giggster-vs-pool-rental-near-me"},
  {"label":"Pool Rental Near Me vs ResortPass","href":"/p/resortpass-vs-pool-rental-near-me"},
  {"label":"Pool Rental Near Me vs Airbnb","href":"/p/airbnb-vs-pool-rental-near-me"},
  {"label":"Pool Rental Near Me vs Vrbo","href":"/p/vrbo-vs-pool-rental-near-me"}
]'::jsonb,
    explore_links = (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(explore_links) elem
      WHERE NOT (elem->>'href' IN (
        '/p/swimply-alternative-vs-pool-rental-near-me',
        '/p/peerspace-vs-pool-rental-near-me',
        '/p/giggster-vs-pool-rental-near-me'
      ))
    )
WHERE id = 1;