DO $$
DECLARE
  affected INT;
BEGIN
  LOOP
    UPDATE public.content_pages
    SET content = regexp_replace(content, E'(\\|[^\\n]*\\|)\\n[ \\t]*\\n(?=\\|)', E'\\1\\n', 'g')
    WHERE content ~ E'\\|[^\\n]*\\|\\n[ \\t]*\\n\\|';
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
  END LOOP;

  LOOP
    UPDATE public.content_pages
    SET body_markdown = regexp_replace(body_markdown, E'(\\|[^\\n]*\\|)\\n[ \\t]*\\n(?=\\|)', E'\\1\\n', 'g')
    WHERE body_markdown ~ E'\\|[^\\n]*\\|\\n[ \\t]*\\n\\|';
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
  END LOOP;
END $$;