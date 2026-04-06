
-- Enable extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ==========================================
-- AUDIT LOG
-- ==========================================
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_log_tenant ON public.audit_log(tenant_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

CREATE POLICY "Tenant members view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Authenticated users create audit entries"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(auth.uid(), tenant_id));

-- ==========================================
-- FUTURE TICKETING (extension-ready, no active use)
-- ==========================================
CREATE TABLE public.ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Standaard',
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  capacity integer,
  sold_count integer NOT NULL DEFAULT 0,
  sale_start timestamptz,
  sale_end timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view ticket types"
  ON public.ticket_types FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  status text NOT NULL DEFAULT 'pending',
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  payment_provider text,
  payment_reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view orders"
  ON public.orders FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items follow order access"
  ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND is_tenant_member(auth.uid(), o.tenant_id)
  ));

CREATE TABLE public.scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  scanned_by uuid REFERENCES auth.users(id),
  scanned_at timestamptz NOT NULL DEFAULT now(),
  result text NOT NULL DEFAULT 'valid',
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scan logs follow order access"
  ON public.scan_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = scan_logs.order_item_id
    AND is_tenant_member(auth.uid(), o.tenant_id)
  ));

-- Timestamps triggers for new tables
CREATE TRIGGER update_ticket_types_updated_at
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- AUTO-DEACTIVATION FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.auto_end_past_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET status = 'ended', updated_at = now()
  WHERE status = 'published'
    AND auto_end_behavior = 'end_of_day'
    AND (
      (end_date IS NOT NULL AND end_date < CURRENT_DATE)
      OR (end_date IS NULL AND start_date < CURRENT_DATE)
    );
END;
$$;

-- ==========================================
-- ENSURE handle_new_user TRIGGER EXISTS
-- ==========================================
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
