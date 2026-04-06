
-- 1. FIX: Remove dangerous self-insert policy on user_roles
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- 2. FIX: Prevent subscription self-upgrade by removing client UPDATE and adding a protective trigger
DROP POLICY IF EXISTS "Owners manage subscription" ON public.subscriptions;

CREATE OR REPLACE FUNCTION public.protect_subscription_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_id IS DISTINCT FROM OLD.plan_id 
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
    RAISE EXCEPTION 'Billing fields cannot be modified from client';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_subscription_billing_trigger
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.protect_subscription_billing();

-- Re-add limited update policy (non-billing fields only, protected by trigger)
CREATE POLICY "Owners manage subscription"
ON public.subscriptions FOR UPDATE TO authenticated
USING (has_tenant_role(auth.uid(), tenant_id, 'owner'::app_role))
WITH CHECK (has_tenant_role(auth.uid(), tenant_id, 'owner'::app_role));

-- 3. FIX: Restrict profile visibility to own profile + same-tenant members
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "Users view own and tenant profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur1
    JOIN public.user_roles ur2 ON ur1.tenant_id = ur2.tenant_id
    WHERE ur1.user_id = auth.uid() AND ur2.user_id = profiles.id
  )
  OR is_platform_admin(auth.uid())
);

-- 4. FIX: Scope storage policies to tenant folders
DROP POLICY IF EXISTS "Authenticated upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete media" ON storage.objects;

CREATE POLICY "Tenant-scoped upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Tenant-scoped update media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Tenant-scoped delete media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM public.user_roles WHERE user_id = auth.uid()
  )
);
