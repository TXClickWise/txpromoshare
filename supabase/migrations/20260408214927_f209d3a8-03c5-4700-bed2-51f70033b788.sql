
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS default_cta_text text DEFAULT 'Meer info',
  ADD COLUMN IF NOT EXISTS tone_of_voice text,
  ADD COLUMN IF NOT EXISTS image_style text,
  ADD COLUMN IF NOT EXISTS brand_summary text,
  ADD COLUMN IF NOT EXISTS tagline text;
