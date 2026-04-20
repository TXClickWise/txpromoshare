-- INSERT policy
CREATE POLICY "Editors+ insert gallery"
ON public.event_gallery
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_gallery.event_id
      AND (
        public.has_tenant_role(auth.uid(), e.tenant_id, 'owner'::app_role)
        OR public.has_tenant_role(auth.uid(), e.tenant_id, 'admin'::app_role)
        OR public.has_tenant_role(auth.uid(), e.tenant_id, 'editor'::app_role)
      )
  )
);

-- UPDATE policy
CREATE POLICY "Editors+ update gallery"
ON public.event_gallery
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_gallery.event_id
      AND (
        public.has_tenant_role(auth.uid(), e.tenant_id, 'owner'::app_role)
        OR public.has_tenant_role(auth.uid(), e.tenant_id, 'admin'::app_role)
        OR public.has_tenant_role(auth.uid(), e.tenant_id, 'editor'::app_role)
      )
  )
);

-- DELETE policy
CREATE POLICY "Editors+ delete gallery"
ON public.event_gallery
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_gallery.event_id
      AND (
        public.has_tenant_role(auth.uid(), e.tenant_id, 'owner'::app_role)
        OR public.has_tenant_role(auth.uid(), e.tenant_id, 'admin'::app_role)
        OR public.has_tenant_role(auth.uid(), e.tenant_id, 'editor'::app_role)
      )
  )
);