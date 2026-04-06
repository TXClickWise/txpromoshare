-- Allow all tenant members to view plan overrides for their tenant
CREATE POLICY "Tenant members view own overrides"
ON public.plan_overrides
FOR SELECT
TO authenticated
USING (is_tenant_member(auth.uid(), tenant_id));

-- Drop the overly restrictive owner-only policy
DROP POLICY IF EXISTS "Tenant owners view own overrides" ON public.plan_overrides;