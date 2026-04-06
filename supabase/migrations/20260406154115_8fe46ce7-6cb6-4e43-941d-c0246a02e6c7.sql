
-- Drop the overly permissive policies since the trigger runs as SECURITY DEFINER
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can create subscriptions" ON public.subscriptions;
