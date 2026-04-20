-- Add favorite and last-used tracking to media library
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone;

-- Index for "recent used" queries scoped per tenant
CREATE INDEX IF NOT EXISTS idx_media_tenant_last_used
  ON public.media (tenant_id, last_used_at DESC NULLS LAST);

-- Index for fast favorite filtering
CREATE INDEX IF NOT EXISTS idx_media_tenant_favorite
  ON public.media (tenant_id, is_favorite)
  WHERE is_favorite = true;