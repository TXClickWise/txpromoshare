
-- Allow platform admins to insert tenants
CREATE POLICY "Platform admins can insert tenants" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin(auth.uid()));

-- Allow platform admins to delete tenants  
CREATE POLICY "Platform admins can delete tenants" ON public.tenants
  FOR DELETE TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Platform admins can update all tenants (they already can via owners/admins policy but adding explicit)
CREATE POLICY "Platform admins can update tenants" ON public.tenants
  FOR UPDATE TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Platform admins can update all profiles
CREATE POLICY "Platform admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Platform admins can insert into audit_log for any tenant
CREATE POLICY "Platform admins create audit entries" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin(auth.uid()));
