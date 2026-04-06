
-- Allow platform admins and service role to manage usage_tracking
CREATE POLICY "Platform admins manage usage_tracking"
ON public.usage_tracking
FOR ALL
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Allow inserts and updates for tenant members (for the refresh function)
CREATE POLICY "Service role manages usage_tracking"
ON public.usage_tracking
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create the refresh function
CREATE OR REPLACE FUNCTION public.refresh_tenant_usage(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _events int;
  _widgets int;
  _team int;
BEGIN
  SELECT count(*) INTO _events FROM public.events
    WHERE tenant_id = _tenant_id AND status IN ('published', 'scheduled', 'draft');
  
  SELECT count(*) INTO _widgets FROM public.widgets
    WHERE tenant_id = _tenant_id AND is_active = true;
  
  SELECT count(*) INTO _team FROM public.user_roles
    WHERE tenant_id = _tenant_id;

  INSERT INTO public.usage_tracking (tenant_id, metric, current_value, limit_value)
  VALUES (_tenant_id, 'events', _events, 0)
  ON CONFLICT (tenant_id, metric) DO UPDATE SET current_value = _events;

  INSERT INTO public.usage_tracking (tenant_id, metric, current_value, limit_value)
  VALUES (_tenant_id, 'widgets', _widgets, 0)
  ON CONFLICT (tenant_id, metric) DO UPDATE SET current_value = _widgets;

  INSERT INTO public.usage_tracking (tenant_id, metric, current_value, limit_value)
  VALUES (_tenant_id, 'team', _team, 0)
  ON CONFLICT (tenant_id, metric) DO UPDATE SET current_value = _team;
END;
$$;

-- Add unique constraint for upsert
ALTER TABLE public.usage_tracking
ADD CONSTRAINT usage_tracking_tenant_metric_unique UNIQUE (tenant_id, metric);
