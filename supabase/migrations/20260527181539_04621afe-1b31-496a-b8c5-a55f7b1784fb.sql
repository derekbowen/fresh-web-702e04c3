CREATE TABLE public.dialect_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  field_name text NOT NULL,
  before_value text,
  after_value text,
  batch_label text NOT NULL DEFAULT 'piscina_to_alberca_2026_05_27',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dialect_audit_log_page_id ON public.dialect_audit_log(page_id);
CREATE INDEX idx_dialect_audit_log_batch ON public.dialect_audit_log(batch_label);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dialect_audit_log TO authenticated;
GRANT ALL ON public.dialect_audit_log TO service_role;

ALTER TABLE public.dialect_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage dialect_audit_log"
ON public.dialect_audit_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));