
-- Platform admins table (separate from tenant roles)
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Security definer function to check platform admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;

-- Only platform admins can view/manage this table
CREATE POLICY "Platform admins can view"
  ON public.platform_admins FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can insert"
  ON public.platform_admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete"
  ON public.platform_admins FOR DELETE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Allow platform admins to read all tenants
CREATE POLICY "Platform admins view all tenants"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Allow platform admins to read all user_roles
CREATE POLICY "Platform admins view all user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Allow platform admins to read all subscriptions
CREATE POLICY "Platform admins view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Allow platform admins to read all profiles
CREATE POLICY "Platform admins view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Allow platform admins to read all events (for stats)
CREATE POLICY "Platform admins view all events"
  ON public.events FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));
