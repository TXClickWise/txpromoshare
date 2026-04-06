
DO $$
DECLARE
  _tenant_id uuid;
BEGIN
  INSERT INTO public.tenants (name, slug, email)
  VALUES ('TX PromoShare', 'tx-promoshare', 'admin@clickwise.app')
  RETURNING id INTO _tenant_id;
  
  INSERT INTO public.user_roles (user_id, tenant_id, role, accepted_at)
  VALUES ('16bf5bb7-ccf8-445a-9c9f-a76e18263d51', _tenant_id, 'owner', now());
  
  INSERT INTO public.subscriptions (tenant_id, plan_id, status)
  VALUES (_tenant_id, 'free', 'active');
END;
$$;
