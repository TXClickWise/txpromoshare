
-- Create event_occurrences table for individual recurring dates
CREATE TABLE public.event_occurrences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'hidden')),
  label text,
  overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (event_id, occurrence_date)
);

-- Indexes
CREATE INDEX idx_event_occurrences_event_id ON public.event_occurrences(event_id);
CREATE INDEX idx_event_occurrences_date ON public.event_occurrences(occurrence_date);
CREATE INDEX idx_event_occurrences_tenant ON public.event_occurrences(tenant_id);

-- Enable RLS
ALTER TABLE public.event_occurrences ENABLE ROW LEVEL SECURITY;

-- Tenant members can view
CREATE POLICY "Tenant members view occurrences"
  ON public.event_occurrences FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

-- Editors+ manage occurrences
CREATE POLICY "Editors+ manage occurrences"
  ON public.event_occurrences FOR ALL TO authenticated
  USING (
    has_tenant_role(auth.uid(), tenant_id, 'owner') OR
    has_tenant_role(auth.uid(), tenant_id, 'admin') OR
    has_tenant_role(auth.uid(), tenant_id, 'editor')
  )
  WITH CHECK (
    has_tenant_role(auth.uid(), tenant_id, 'owner') OR
    has_tenant_role(auth.uid(), tenant_id, 'admin') OR
    has_tenant_role(auth.uid(), tenant_id, 'editor')
  );

-- Public can view active occurrences of published events
CREATE POLICY "Public view active occurrences"
  ON public.event_occurrences FOR SELECT TO anon
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_occurrences.event_id
      AND e.status = 'published'
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_event_occurrences_updated_at
  BEFORE UPDATE ON public.event_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_occurrences;
