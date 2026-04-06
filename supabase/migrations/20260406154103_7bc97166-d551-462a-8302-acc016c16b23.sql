
-- Allow authenticated users to insert tenants (needed for auto-creation on signup)
CREATE POLICY "Authenticated users can create tenants"
ON public.tenants FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert their own user_roles
CREATE POLICY "Users can insert own role"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert subscriptions for their tenant
CREATE POLICY "Authenticated users can create subscriptions"
ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (true);

-- Create function to auto-create tenant on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
  _org_name text;
  _slug text;
BEGIN
  _org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', 'Mijn organisatie');
  _slug := lower(regexp_replace(_org_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8);
  
  INSERT INTO public.tenants (name, slug, email)
  VALUES (_org_name, _slug, NEW.email)
  RETURNING id INTO _tenant_id;
  
  INSERT INTO public.user_roles (user_id, tenant_id, role, accepted_at)
  VALUES (NEW.id, _tenant_id, 'owner', now());
  
  INSERT INTO public.subscriptions (tenant_id, plan_id, status)
  VALUES (_tenant_id, 'free', 'active');
  
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_tenant();
