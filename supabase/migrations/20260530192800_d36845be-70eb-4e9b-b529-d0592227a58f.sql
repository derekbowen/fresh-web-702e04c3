UPDATE public.content_pages
SET youtube_video_id = NULL, updated_at = now()
WHERE template_type IN ('pool_maintenance','pool_maintenance_hub')
  AND youtube_video_id IS NOT NULL
  AND youtube_video_id <> '';