CREATE OR REPLACE FUNCTION public.tg_refresh_host_acq_related()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.template_type = 'host_acq_city')
     OR (TG_OP = 'DELETE' AND OLD.template_type = 'host_acq_city')
     OR (TG_OP = 'UPDATE' AND (
            NEW.template_type = 'host_acq_city' OR OLD.template_type = 'host_acq_city'
          ) AND (
            NEW.status IS DISTINCT FROM OLD.status
            OR NEW.template_type IS DISTINCT FROM OLD.template_type
            OR NEW.slug IS DISTINCT FROM OLD.slug
          ))
  THEN
    PERFORM public.refresh_related_slugs_for_template('host_acq_city');
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tg_host_acq_related_refresh ON public.content_pages;
CREATE TRIGGER tg_host_acq_related_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.content_pages
FOR EACH ROW
EXECUTE FUNCTION public.tg_refresh_host_acq_related();