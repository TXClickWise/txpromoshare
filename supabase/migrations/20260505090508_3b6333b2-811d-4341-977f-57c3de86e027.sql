
CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL CHECK (form_type IN ('demo','event_signup','contact','other')),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_url text,
  user_agent text,
  ip_hash text,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_submissions_form_type_created ON public.form_submissions (form_type, created_at DESC);
CREATE INDEX idx_form_submissions_tenant ON public.form_submissions (tenant_id, created_at DESC);
CREATE INDEX idx_form_submissions_event ON public.form_submissions (event_id, created_at DESC);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages form submissions"
  ON public.form_submissions
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Platform admins view all form submissions"
  ON public.form_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant members view own form submissions"
  ON public.form_submissions
  FOR SELECT
  TO authenticated
  USING (
    (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id))
    OR (event_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = form_submissions.event_id
        AND public.is_tenant_member(auth.uid(), e.tenant_id)
    ))
  );
