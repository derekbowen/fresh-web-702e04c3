-- Update Terms of Service from sharetribe-served page
UPDATE public.content_pages
SET body_markdown = \\$,
    title = 'Terms of Service',
    status = 'published',
    updated_at = now()
WHERE url_path = '/p/terms-of-service';
