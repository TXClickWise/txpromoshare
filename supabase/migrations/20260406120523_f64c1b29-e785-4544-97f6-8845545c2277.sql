
-- Remove 'highlevel' from integration_provider enum
-- First delete any rows using 'highlevel'
DELETE FROM public.integration_events
WHERE connection_id IN (
  SELECT id FROM public.integration_connections WHERE provider = 'highlevel'
);
DELETE FROM public.integration_connections WHERE provider = 'highlevel';

-- Recreate enum without highlevel
ALTER TYPE public.integration_provider RENAME TO integration_provider_old;
CREATE TYPE public.integration_provider AS ENUM ('clickwise');

ALTER TABLE public.integration_connections
  ALTER COLUMN provider TYPE public.integration_provider
  USING provider::text::public.integration_provider;

DROP TYPE public.integration_provider_old;
