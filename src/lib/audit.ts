import { supabase } from "@/integrations/supabase/client";

/**
 * Write an entry to the audit log.
 * Fire-and-forget — does not throw on failure.
 */
export async function logAudit(params: {
  tenantId: string;
  entityType: string;
  action: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("audit_log").insert({
    tenant_id: params.tenantId,
    entity_type: params.entityType,
    action: params.action,
    entity_id: params.entityId || null,
    user_id: user?.id || null,
    metadata: (params.metadata as any) || {},
  }).then(({ error }) => {
    if (error) console.warn("Audit log write failed:", error.message);
  });
}
