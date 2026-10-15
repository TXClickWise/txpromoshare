-- Platform admins may manage ClickWise connections (incl. notification timing) for every tenant
CREATE POLICY "Platform admins manage all integrations"
  ON public.integration_connections
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));