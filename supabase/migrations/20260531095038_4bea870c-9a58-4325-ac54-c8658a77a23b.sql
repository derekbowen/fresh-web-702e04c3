UPDATE public.content_pages
SET content = replace(content, chr(92) || 'n', chr(10))
WHERE position(chr(92) || 'n' in content) > 0;

UPDATE public.content_pages
SET body_markdown = replace(body_markdown, chr(92) || 'n', chr(10))
WHERE position(chr(92) || 'n' in body_markdown) > 0;