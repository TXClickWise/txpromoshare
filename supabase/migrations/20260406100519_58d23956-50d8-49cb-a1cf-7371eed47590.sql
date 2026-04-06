
-- ============================================
-- TX PromoShare - Complete Database Schema
-- ============================================

-- 1. ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'editor', 'marketer', 'viewer');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'pro');
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'scheduled', 'archived', 'ended');
CREATE TYPE public.event_category AS ENUM ('sport', 'proeverij', 'live-muziek', 'thema-avond', 'overig');
CREATE TYPE public.widget_type AS ENUM ('agenda', 'single_event');
CREATE TYPE public.integration_provider AS ENUM ('clickwise', 'highlevel');
CREATE TYPE public.integration_status AS ENUM ('connected', 'disconnected', 'error');
CREATE TYPE public.media_source AS ENUM ('upload', 'url', 'stock');
CREATE TYPE public.distribution_channel AS ENUM ('whatsapp', 'embed', 'social', 'link', 'email');

-- 2. UTILITY FUNCTION: updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. PROFILES (1:1 with auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TENANTS
-- ============================================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan_id public.subscription_plan NOT NULL DEFAULT 'free',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#E86C2C',
  secondary_color TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. USER ROLES (separate table for security)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'viewer',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, tenant_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. SECURITY DEFINER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = _role
  )
$$;

-- RLS for tenants (after functions exist)
CREATE POLICY "Tenant members can view their tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), id));
CREATE POLICY "Owners/admins can update tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.has_tenant_role(auth.uid(), id, 'owner') OR public.has_tenant_role(auth.uid(), id, 'admin'));

-- RLS for user_roles
CREATE POLICY "Users see roles in their tenant" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins manage roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
  );
CREATE POLICY "Owners/admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
  );
CREATE POLICY "Owners/admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
  );

-- 7. TEAM INVITATIONS
-- ============================================
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'editor',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view invitations" ON public.team_invitations
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins create invitations" ON public.team_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
  );

-- 8. VENUES
-- ============================================
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT,
  image_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view venues" ON public.venues
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins/editors manage venues" ON public.venues
  FOR ALL TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'editor')
  );

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Default categories visible to all" ON public.categories
  FOR SELECT TO authenticated
  USING (is_default = true OR public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins/editors manage custom categories" ON public.categories
  FOR ALL TO authenticated
  USING (
    tenant_id IS NOT NULL AND (
      public.has_tenant_role(auth.uid(), tenant_id, 'owner')
      OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
      OR public.has_tenant_role(auth.uid(), tenant_id, 'editor')
    )
  );

-- 10. RECURRING RULES
-- ============================================
CREATE TABLE public.recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  day_of_week INT[],
  interval_count INT NOT NULL DEFAULT 1,
  end_after_count INT,
  end_after_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view recurring rules" ON public.recurring_rules
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Editors+ manage recurring rules" ON public.recurring_rules
  FOR ALL TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'editor')
  );

-- 11. MEDIA
-- ============================================
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_url TEXT,
  storage_path TEXT,
  mime_type TEXT,
  file_size INT,
  width INT,
  height INT,
  alt_text TEXT,
  source public.media_source NOT NULL DEFAULT 'upload',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view media" ON public.media
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Editors+ manage media" ON public.media
  FOR ALL TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'editor')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'marketer')
  );

-- 12. EVENTS (core table)
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  status public.event_status NOT NULL DEFAULT 'draft',
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME NOT NULL,
  end_time TIME,
  organizer_name TEXT,
  featured_image_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  cta_button_text TEXT,
  cta_link TEXT,
  tags TEXT[],
  social_share_text TEXT,
  whatsapp_share_text TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_rule_id UUID REFERENCES public.recurring_rules(id) ON DELETE SET NULL,
  publish_at TIMESTAMPTZ,
  auto_end_behavior TEXT DEFAULT 'end_of_day',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Tenant members can view events
CREATE POLICY "Tenant members view events" ON public.events
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
-- Public can view published events (for public pages/widgets)
CREATE POLICY "Public view published events" ON public.events
  FOR SELECT TO anon
  USING (status = 'published');
-- Editors+ can create/edit events
CREATE POLICY "Editors+ manage events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'editor')
  );
CREATE POLICY "Editors+ update events" ON public.events
  FOR UPDATE TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'editor')
  );
CREATE POLICY "Owners/admins delete events" ON public.events
  FOR DELETE TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
  );

CREATE INDEX idx_events_tenant ON public.events(tenant_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_slug ON public.events(tenant_id, slug);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. EVENT GALLERY
-- ============================================
CREATE TABLE public.event_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.event_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gallery follows event access" ON public.event_gallery
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND public.is_tenant_member(auth.uid(), e.tenant_id)
  ));
CREATE POLICY "Public view published event gallery" ON public.event_gallery
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.status = 'published'
  ));

-- 14. EVENT SPONSORS
-- ============================================
CREATE TABLE public.event_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.event_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sponsors follow event access" ON public.event_sponsors
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND public.is_tenant_member(auth.uid(), e.tenant_id)
  ));
CREATE POLICY "Public view published event sponsors" ON public.event_sponsors
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.status = 'published'
  ));

-- 15. EVENT TEMPLATES
-- ============================================
CREATE TABLE public.event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  prefill_data JSONB NOT NULL DEFAULT '{}',
  page_layout JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System templates visible to all" ON public.event_templates
  FOR SELECT TO authenticated
  USING (is_system = true OR public.is_tenant_member(auth.uid(), tenant_id));

-- 16. WIDGETS
-- ============================================
CREATE TABLE public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type public.widget_type NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view widgets" ON public.widgets
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins manage widgets" ON public.widgets
  FOR ALL TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
  );

CREATE TRIGGER update_widgets_updated_at
  BEFORE UPDATE ON public.widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 17. DISTRIBUTION ACTIONS
-- ============================================
CREATE TABLE public.distribution_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel public.distribution_channel NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'share',
  metadata JSONB DEFAULT '{}',
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.distribution_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view distribution" ON public.distribution_actions
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Editors+marketers create distribution" ON public.distribution_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'editor')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'marketer')
  );

-- 18. INTEGRATION CONNECTIONS
-- ============================================
CREATE TABLE public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider public.integration_provider NOT NULL,
  status public.integration_status NOT NULL DEFAULT 'disconnected',
  credentials_encrypted JSONB,
  subaccount_id TEXT,
  sync_settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  connected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners/admins view integrations" ON public.integration_connections
  FOR SELECT TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
  );
CREATE POLICY "Owners/admins manage integrations" ON public.integration_connections
  FOR ALL TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), tenant_id, 'owner')
    OR public.has_tenant_role(auth.uid(), tenant_id, 'admin')
  );

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 19. INTEGRATION EVENTS (webhook/sync log)
-- ============================================
CREATE TABLE public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  response_status INT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follow connection access" ON public.integration_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.integration_connections ic
    WHERE ic.id = connection_id
    AND (public.has_tenant_role(auth.uid(), ic.tenant_id, 'owner')
      OR public.has_tenant_role(auth.uid(), ic.tenant_id, 'admin'))
  ));

-- 20. SUBSCRIPTIONS
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id public.subscription_plan NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.has_tenant_role(auth.uid(), tenant_id, 'owner'));
CREATE POLICY "Owners manage subscription" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (public.has_tenant_role(auth.uid(), tenant_id, 'owner'));

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 21. USAGE TRACKING
-- ============================================
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  current_value INT NOT NULL DEFAULT 0,
  limit_value INT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
);
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view usage" ON public.usage_tracking
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

-- 22. STORAGE BUCKET for media
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');
CREATE POLICY "Authenticated update media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media');
CREATE POLICY "Authenticated delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media');

-- 23. SEED DEFAULT CATEGORIES
-- ============================================
INSERT INTO public.categories (name, slug, color, sort_order, is_default) VALUES
  ('Sport', 'sport', '#3B82F6', 1, true),
  ('Proeverij', 'proeverij', '#8B5CF6', 2, true),
  ('Live Muziek', 'live-muziek', '#EC4899', 3, true),
  ('Thema Avond', 'thema-avond', '#F59E0B', 4, true),
  ('Overig', 'overig', '#6B7280', 5, true);

-- 24. SEED SYSTEM EVENT TEMPLATES
-- ============================================
INSERT INTO public.event_templates (name, prefill_data, page_layout, is_system, sort_order) VALUES
  ('Sport Evenement', '{"category_slug":"sport","cta_button_text":"Inschrijven"}', '{"sections":["hero","details","description","location","cta","share"]}', true, 1),
  ('Proeverij', '{"category_slug":"proeverij","cta_button_text":"Reserveer nu"}', '{"sections":["hero","details","description","gallery","sponsors","cta","share"]}', true, 2),
  ('Live Muziek', '{"category_slug":"live-muziek","cta_button_text":"Tickets"}', '{"sections":["hero","details","description","gallery","organizer","sponsors","cta","share"]}', true, 3),
  ('Thema Avond', '{"category_slug":"thema-avond","cta_button_text":"Kom langs"}', '{"sections":["hero","details","description","cta","share"]}', true, 4),
  ('Overig', '{"category_slug":"overig","cta_button_text":"Meer info"}', '{"sections":["hero","details","description","cta","share"]}', true, 5);
