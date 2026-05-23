
WITH stubs AS (
  SELECT id, url_path,
    CASE
      WHEN url_path LIKE '/p/become-a-pool-host-%' THEN substring(url_path from 23)
      WHEN url_path LIKE '/p/swim-instructor-pool-rental-%' THEN substring(url_path from 32)
      WHEN url_path LIKE '/p/become-a-swimming-pool-%' THEN substring(url_path from 27)
      WHEN url_path LIKE '/p/private-pool-rental-%' THEN substring(url_path from 24)
      ELSE substring(url_path from 4)
    END AS slug
  FROM content_pages
  WHERE redirect_to = '/s' AND url_path ~ '^/p/[a-z0-9-]+$'
),
matches AS (
  SELECT s.id, '/p/become-a-swimming-pool-host-' || s.slug AS target
  FROM stubs s
  WHERE EXISTS (
    SELECT 1 FROM content_pages t
    WHERE t.url_path = '/p/become-a-swimming-pool-host-' || s.slug
      AND t.status = 'published'
  )
)
UPDATE content_pages cp
SET redirect_to = m.target,
    in_sitemap = false,
    updated_at = now()
FROM matches m
WHERE cp.id = m.id;
