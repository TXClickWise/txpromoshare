ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS public_api_enabled boolean NOT NULL DEFAULT true;