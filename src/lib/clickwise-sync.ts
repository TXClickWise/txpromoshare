import { supabase } from "@/integrations/supabase/client";

const RULE_MAP: Record<string, string> = {
  "event.published": "event_published",
  "event.updated": "event_updated",
  "event.ended": "event_ended",
  "event.deleted": "event_deleted",
};

/**
 * Fire-and-forget ClickWise sync trigger.
 * Checks for active connection + enabled rule, then calls the edge function.
 * Never throws — errors are logged to console only.
 */
export async function triggerClickWiseSync(
  tenantId: string,
  eventType: "event.published" | "event.updated" | "event.ended" | "event.deleted",
  eventId: string,
  eventData?: Record<string, unknown>,
) {
  try {
    // 1. Check for active ClickWise connection
    const { data: connection } = await supabase
      .from("integration_connections")
      .select("id, sync_settings")
      .eq("tenant_id", tenantId)
      .eq("provider", "clickwise")
      .eq("status", "connected")
      .maybeSingle();

    if (!connection) return;

    // 2. Check if the sync rule is enabled
    const rules = (connection.sync_settings as any)?.rules;
    const ruleKey = RULE_MAP[eventType];
    if (rules && ruleKey && rules[ruleKey] === false) return;

    // 3. Call the edge function
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    if (!token) return;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    await fetch(`https://${projectId}.supabase.co/functions/v1/clickwise-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id: connection.id,
        tenant_id: tenantId,
        event_type: eventType,
        event_id: eventId,
        data: eventData,
      }),
    });
  } catch (err) {
    console.error("[ClickWise sync]", eventType, err);
  }
}
