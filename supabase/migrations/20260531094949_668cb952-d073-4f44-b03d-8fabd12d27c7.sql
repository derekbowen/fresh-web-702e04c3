UPDATE public.content_pages
SET content = replace(content, E'|\\n|', E'|\n|')
WHERE content LIKE E'%|\\n|%';

UPDATE public.content_pages
SET body_markdown = replace(body_markdown, E'|\\n|', E'|\n|')
WHERE body_markdown LIKE E'%|\\n|%';