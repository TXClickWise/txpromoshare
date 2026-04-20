-- Phase 9: Multilingual content layer
-- 1. Add UI language preference to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ui_language text NOT NULL DEFAULT 'nl';

-- 2. Create event_translations table
CREATE TABLE IF NOT EXISTS public.event_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  language_code text NOT NULL CHECK (language_code IN ('nl','fy','de','en')),

  -- Basis
  title text,
  subtitle text,
  short_description text,
  full_description text,

  -- Promotie
  cta_button_text text,
  whatsapp_share_text text,
  social_share_text text,

  -- SEO
  seo_title text,
  seo_description text,
  slug text,

  -- Meta
  is_ai_generated boolean NOT NULL DEFAULT false,
  ai_generated_at timestamptz,
  last_edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(event_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_event_translations_event ON public.event_translations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_translations_tenant_lang ON public.event_translations(tenant_id, language_code);

ALTER TABLE public.event_translations ENABLE ROW LEVEL SECURITY;

-- RLS: tenant members view
CREATE POLICY "Tenant members view translations"
ON public.event_translations FOR SELECT
TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

-- RLS: editors+ insert/update/delete
CREATE POLICY "Editors+ insert translations"
ON public.event_translations FOR INSERT
TO authenticated
WITH CHECK (
  has_tenant_role(auth.uid(), tenant_id, 'owner'::app_role)
  OR has_tenant_role(auth.uid(), tenant_id, 'admin'::app_role)
  OR has_tenant_role(auth.uid(), tenant_id, 'editor'::app_role)
  OR has_tenant_role(auth.uid(), tenant_id, 'marketer'::app_role)
);

CREATE POLICY "Editors+ update translations"
ON public.event_translations FOR UPDATE
TO authenticated
USING (
  has_tenant_role(auth.uid(), tenant_id, 'owner'::app_role)
  OR has_tenant_role(auth.uid(), tenant_id, 'admin'::app_role)
  OR has_tenant_role(auth.uid(), tenant_id, 'editor'::app_role)
  OR has_tenant_role(auth.uid(), tenant_id, 'marketer'::app_role)
);

CREATE POLICY "Editors+ delete translations"
ON public.event_translations FOR DELETE
TO authenticated
USING (
  has_tenant_role(auth.uid(), tenant_id, 'owner'::app_role)
  OR has_tenant_role(auth.uid(), tenant_id, 'admin'::app_role)
  OR has_tenant_role(auth.uid(), tenant_id, 'editor'::app_role)
);

-- RLS: public can view translations of published events (API + public pages)
CREATE POLICY "Public view translations of published events"
ON public.event_translations FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_translations.event_id
      AND e.status = 'published'::event_status
  )
);

-- Trigger updated_at
CREATE TRIGGER trg_event_translations_updated_at
BEFORE UPDATE ON public.event_translations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Helper function: get localized event field with NL fallback
CREATE OR REPLACE FUNCTION public.get_event_localized(
  _event_id uuid,
  _language_code text DEFAULT 'nl'
)
RETURNS TABLE(
  language_code text,
  title text,
  subtitle text,
  short_description text,
  full_description text,
  cta_button_text text,
  whatsapp_share_text text,
  social_share_text text,
  seo_title text,
  seo_description text,
  slug text,
  is_fallback boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_translation boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.event_translations
    WHERE event_id = _event_id AND event_translations.language_code = _language_code
  ) INTO _has_translation;

  IF _has_translation AND _language_code <> 'nl' THEN
    RETURN QUERY
    SELECT
      t.language_code,
      COALESCE(NULLIF(t.title,''), e.title),
      COALESCE(NULLIF(t.subtitle,''), e.subtitle),
      COALESCE(NULLIF(t.short_description,''), e.short_description),
      COALESCE(NULLIF(t.full_description,''), e.full_description),
      COALESCE(NULLIF(t.cta_button_text,''), e.cta_button_text),
      COALESCE(NULLIF(t.whatsapp_share_text,''), e.whatsapp_share_text),
      COALESCE(NULLIF(t.social_share_text,''), e.social_share_text),
      COALESCE(NULLIF(t.seo_title,''), e.seo_title),
      COALESCE(NULLIF(t.seo_description,''), e.seo_description),
      COALESCE(NULLIF(t.slug,''), e.slug),
      false AS is_fallback
    FROM public.events e
    LEFT JOIN public.event_translations t
      ON t.event_id = e.id AND t.language_code = _language_code
    WHERE e.id = _event_id;
  ELSE
    RETURN QUERY
    SELECT
      'nl'::text,
      e.title,
      e.subtitle,
      e.short_description,
      e.full_description,
      e.cta_button_text,
      e.whatsapp_share_text,
      e.social_share_text,
      e.seo_title,
      e.seo_description,
      e.slug,
      (_language_code <> 'nl') AS is_fallback
    FROM public.events e
    WHERE e.id = _event_id;
  END IF;
END;
$$;