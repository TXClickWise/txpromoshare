
-- Enable pg_cron extension if not already
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create function for scheduled publishing
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.events
  SET status = 'published', updated_at = now()
  WHERE status = 'scheduled'
    AND publish_at IS NOT NULL
    AND publish_at <= now();
END;
$$;

-- Schedule auto-end past events: every night at 01:00 UTC
SELECT cron.schedule(
  'auto-end-past-events',
  '0 1 * * *',
  $$SELECT public.auto_end_past_events()$$
);

-- Schedule auto-publish scheduled events: every 5 minutes
SELECT cron.schedule(
  'auto-publish-scheduled-events',
  '*/5 * * * *',
  $$SELECT public.auto_publish_scheduled_events()$$
);
