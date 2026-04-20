ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS whatsapp_share_text_short text,
  ADD COLUMN IF NOT EXISTS instagram_share_text text,
  ADD COLUMN IF NOT EXISTS teaser_text text,
  ADD COLUMN IF NOT EXISTS long_promo_text text,
  ADD COLUMN IF NOT EXISTS newsletter_intro text,
  ADD COLUMN IF NOT EXISTS website_snippet text;