-- Allow editors+ to insert sponsors
CREATE POLICY "Editors+ insert sponsors"
ON public.event_sponsors
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_sponsors.event_id
    AND (
      has_tenant_role(auth.uid(), e.tenant_id, 'owner') OR
      has_tenant_role(auth.uid(), e.tenant_id, 'admin') OR
      has_tenant_role(auth.uid(), e.tenant_id, 'editor')
    )
  )
);

-- Allow editors+ to update sponsors
CREATE POLICY "Editors+ update sponsors"
ON public.event_sponsors
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_sponsors.event_id
    AND (
      has_tenant_role(auth.uid(), e.tenant_id, 'owner') OR
      has_tenant_role(auth.uid(), e.tenant_id, 'admin') OR
      has_tenant_role(auth.uid(), e.tenant_id, 'editor')
    )
  )
);

-- Allow editors+ to delete sponsors
CREATE POLICY "Editors+ delete sponsors"
ON public.event_sponsors
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_sponsors.event_id
    AND (
      has_tenant_role(auth.uid(), e.tenant_id, 'owner') OR
      has_tenant_role(auth.uid(), e.tenant_id, 'admin') OR
      has_tenant_role(auth.uid(), e.tenant_id, 'editor')
    )
  )
);