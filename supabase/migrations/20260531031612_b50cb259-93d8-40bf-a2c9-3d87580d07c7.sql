
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS editorial_cluster text;

UPDATE public.blog_posts
SET editorial_cluster = CASE
  WHEN topic IN ('Algae', 'Water Chemistry') THEN 'water_chemistry_algae'
  WHEN topic IN ('Equipment', 'Structural') THEN 'equipment_repairs'
  WHEN topic IN ('Fun Facts & Records', 'Pool Events & Entertainment', 'Pool Party and Cultural History', 'Top pools') THEN 'parties_events_culture'
  WHEN topic IN ('guest-guide', 'Pool Rental and Services') THEN 'renting_guest_playbook'
  WHEN topic IN ('hosting', 'Hosting', 'Hosting & Renter Tips', 'marketing', 'Marketing', 'Marketing & Growth for Hosts', 'Pool ownership', 'Inclusive & Eco-Friendly Pools') THEN 'hosting_growing_business'
  WHEN topic IN ('Learning & Training', 'Pool Safety and Environmental Factors', 'safety', 'Safety') THEN 'pool_safety_training'
  WHEN topic IN ('Maintenance', 'Pool Maintenance and Care', 'pool-care', 'seasonal') THEN 'maintenance_care'
  WHEN topic IN ('Pool Building and Installation', 'Pool Features and Accessories') THEN 'building_design_features'
  ELSE editorial_cluster
END;

CREATE INDEX IF NOT EXISTS idx_blog_posts_editorial_cluster
  ON public.blog_posts (editorial_cluster)
  WHERE is_published = true;
