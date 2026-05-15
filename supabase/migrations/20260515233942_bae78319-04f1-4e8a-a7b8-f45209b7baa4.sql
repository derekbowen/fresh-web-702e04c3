
-- 1) Reset plan rows marked generated where the published page is missing
UPDATE public.content_plan p
SET status = 'pending',
    generated_at = NULL,
    generated_page_slug = NULL,
    last_error = 'reset: marked generated but content_pages row missing',
    attempt_count = 0,
    paused_at = NULL,
    updated_at = now()
WHERE p.status = 'generated'
  AND NOT EXISTS (
    SELECT 1 FROM public.content_pages cp
    WHERE cp.slug = p.slug OR cp.slug = p.generated_page_slug
  );

-- 2) Auto-resolve 404 log entries whose target page now exists
UPDATE public.content_404_log l
SET resolved_at = now(),
    resolution_notes = COALESCE(resolution_notes, 'auto: matching content_pages row exists')
WHERE l.resolved_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.content_pages cp
    WHERE cp.url_path = l.url_path
       OR cp.slug = regexp_replace(l.url_path, '^/p/', '')
  );
