
-- =============================================
-- 1. plans table (database-managed plans)
-- =============================================
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  monthly_price_cents integer NOT NULL DEFAULT 0,
  yearly_price_cents integer,
  is_active boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  stripe_monthly_price_id text,
  stripe_yearly_price_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active public plans" ON public.plans
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND is_public = true);

CREATE POLICY "Platform admins full access to plans" ON public.plans
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default plans
INSERT INTO public.plans (name, slug, description, monthly_price_cents, yearly_price_cents, sort_order, is_featured, features, limits) VALUES
  ('Free', 'free', 'Gratis starten met TX EventShare', 0, NULL, 0, false,
   '["3 actieve evenementen","1 widget","1 teamlid","Basis templates"]'::jsonb,
   '{"maxActiveEvents":3,"maxWidgets":1,"maxTeamMembers":1,"customCategories":false,"customBranding":false,"advancedBranding":false,"multipleLocations":false,"clickwiseIntegration":false,"advancedDistribution":false,"advancedAnalytics":false,"ticketingReady":false,"agendaWidget":false,"singleEventWidget":false,"allTemplates":false,"distributionCenter":false}'::jsonb),
  ('Basic', 'basic', 'Voor groeiende horecabedrijven', 2900, 27900, 1, false,
   '["15 actieve evenementen","3 widgets","3 teamleden","Alle templates","Agenda & single event widget","Distributie centrum","Eigen categorieën","Eigen branding"]'::jsonb,
   '{"maxActiveEvents":15,"maxWidgets":3,"maxTeamMembers":3,"customCategories":true,"customBranding":true,"advancedBranding":false,"multipleLocations":false,"clickwiseIntegration":false,"advancedDistribution":false,"advancedAnalytics":false,"ticketingReady":false,"agendaWidget":true,"singleEventWidget":true,"allTemplates":true,"distributionCenter":true}'::jsonb),
  ('Pro', 'pro', 'Onbeperkt voor professionals', 7900, 75900, 2, true,
   '["Onbeperkt evenementen","Onbeperkt widgets","10 teamleden","Alle templates","Geavanceerde branding","Meerdere locaties","ClickWise integratie","Geavanceerde distributie","Geavanceerde analytics","Ticketing ready"]'::jsonb,
   '{"maxActiveEvents":999999,"maxWidgets":999999,"maxTeamMembers":10,"customCategories":true,"customBranding":true,"advancedBranding":true,"multipleLocations":true,"clickwiseIntegration":true,"advancedDistribution":true,"advancedAnalytics":true,"ticketingReady":true,"agendaWidget":true,"singleEventWidget":true,"allTemplates":true,"distributionCenter":true}'::jsonb);

-- =============================================
-- 2. plan_overrides table (temporary upgrades)
-- =============================================
CREATE TABLE public.plan_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  original_plan_slug text NOT NULL,
  override_plan_slug text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  reason text,
  performed_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  reverted_at timestamptz,
  notification_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage overrides" ON public.plan_overrides
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Tenant owners view own overrides" ON public.plan_overrides
  FOR SELECT TO authenticated
  USING (has_tenant_role(auth.uid(), tenant_id, 'owner'::app_role));

CREATE TRIGGER update_plan_overrides_updated_at
  BEFORE UPDATE ON public.plan_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. admin_notes table
-- =============================================
CREATE TABLE public.admin_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  content text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage admin notes" ON public.admin_notes
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- =============================================
-- 4. Extend tenants table
-- =============================================
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'NL',
  ADD COLUMN IF NOT EXISTS business_type text;

-- =============================================
-- 5. Extend profiles table
-- =============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
