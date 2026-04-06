
-- Add discovery columns to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS show_on_discovery boolean NOT NULL DEFAULT true;

-- Add discovery + boost columns to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_on_discovery boolean DEFAULT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS featured_until timestamptz DEFAULT NULL;

-- Create boost_credits table
CREATE TABLE public.boost_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  remaining integer NOT NULL DEFAULT 0,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.boost_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view boost credits"
  ON public.boost_credits FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Platform admins manage boost credits"
  ON public.boost_credits FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Service role manages boost credits"
  ON public.boost_credits FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anon SELECT on venues for discovery page city filter
CREATE POLICY "Public view venues of published events"
  ON public.venues FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.venue_id = venues.id AND e.status = 'published'
  ));

-- Anon SELECT on media for discovery page thumbnails
CREATE POLICY "Public view media of published events"
  ON public.media FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.featured_image_id = media.id AND e.status = 'published'
  ));

-- Anon SELECT on categories for discovery page filters
CREATE POLICY "Public view default categories"
  ON public.categories FOR SELECT TO anon
  USING (is_default = true);

-- RPC function for discoverable events
CREATE OR REPLACE FUNCTION public.get_discoverable_events(
  _search text DEFAULT NULL,
  _category_slug text DEFAULT NULL,
  _city text DEFAULT NULL,
  _date_from date DEFAULT NULL,
  _date_to date DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  subtitle text,
  short_description text,
  slug text,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  is_featured boolean,
  featured_until timestamptz,
  category_name text,
  category_slug text,
  category_color text,
  venue_name text,
  venue_city text,
  venue_address text,
  organizer_name text,
  tenant_name text,
  image_url text,
  tags text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.title,
    e.subtitle,
    e.short_description,
    e.slug,
    e.start_date,
    e.end_date,
    e.start_time,
    e.end_time,
    e.is_featured,
    e.featured_until,
    c.name AS category_name,
    c.slug AS category_slug,
    c.color AS category_color,
    v.name AS venue_name,
    v.city AS venue_city,
    v.address AS venue_address,
    e.organizer_name,
    t.name AS tenant_name,
    m.storage_path AS image_url,
    e.tags
  FROM public.events e
  JOIN public.tenants t ON t.id = e.tenant_id
  LEFT JOIN public.categories c ON c.id = e.category_id
  LEFT JOIN public.venues v ON v.id = e.venue_id
  LEFT JOIN public.media m ON m.id = e.featured_image_id
  WHERE e.status = 'published'
    AND (
      e.show_on_discovery IS TRUE
      OR (e.show_on_discovery IS NULL AND t.show_on_discovery IS TRUE)
    )
    AND (_search IS NULL OR (
      e.title ILIKE '%' || _search || '%'
      OR e.short_description ILIKE '%' || _search || '%'
      OR t.name ILIKE '%' || _search || '%'
      OR v.name ILIKE '%' || _search || '%'
    ))
    AND (_category_slug IS NULL OR c.slug = _category_slug)
    AND (_city IS NULL OR v.city ILIKE '%' || _city || '%')
    AND (_date_from IS NULL OR e.start_date >= _date_from)
    AND (_date_to IS NULL OR e.start_date <= _date_to)
  ORDER BY
    (e.is_featured AND e.featured_until > now()) DESC,
    e.start_date ASC,
    e.start_time ASC
  LIMIT _limit
  OFFSET _offset;
$$;
