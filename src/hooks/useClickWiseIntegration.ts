import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Connection = Tables<"integration_connections">;
type IntegrationEvent = Tables<"integration_events">;

interface SyncRules {
  event_published: boolean;
  event_updated: boolean;
  event_ended: boolean;
  event_reminder: boolean;
  contact_sync: boolean;
}

const defaultRules: SyncRules = {
  event_published: true,
  event_updated: true,
  event_ended: false,
  event_reminder: false,
  contact_sync: true,
};

export function useClickWiseIntegration() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const status = connection?.status ?? "disconnected";
  const syncRules: SyncRules = (connection?.sync_settings as any)?.rules ?? defaultRules;

  const fetchConnection = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    const { data } = await supabase
      .from("integration_connections")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("provider", "clickwise")
      .maybeSingle();
    setConnection(data);
    setLoading(false);
  }, [tenantId]);

  const fetchEvents = useCallback(async () => {
    if (!connection) { setEvents([]); return; }
    const { data } = await supabase
      .from("integration_events")
      .select("*")
      .eq("connection_id", connection.id)
      .order("attempted_at", { ascending: false })
      .limit(20);
    setEvents(data ?? []);
  }, [connection?.id]);

  useEffect(() => { fetchConnection(); }, [fetchConnection]);
  useEffect(() => { if (connection?.status === "connected") fetchEvents(); }, [connection, fetchEvents]);

  async function connect(subaccountId: string, apiKey?: string, calendarId?: string) {
    if (!tenantId || !user) return;
    setSyncing(true);
    try {
      if (subaccountId.trim()) {
        const creds: Record<string, string> = {};
        if (apiKey?.trim()) creds.api_key = apiKey.trim();
        if (calendarId?.trim()) creds.calendar_id = calendarId.trim();

        const insertData: any = {
          tenant_id: tenantId,
          provider: "clickwise" as const,
          status: "connected" as const,
          subaccount_id: subaccountId.trim(),
          connected_by: user.id,
          last_sync_at: new Date().toISOString(),
          sync_settings: { rules: defaultRules } as any,
          credentials_encrypted: Object.keys(creds).length > 0 ? creds : undefined,
        };
        const { error } = await supabase.from("integration_connections").upsert(insertData, {
          onConflict: "tenant_id,provider",
        });
        if (error) throw error;
      }
      toast.success("ClickWise verbonden!");
      await fetchConnection();
    } catch (err: any) {
      toast.error("Verbinding mislukt: " + (err.message || "Onbekende fout"));
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    if (!connection) return;
    const { error } = await supabase
      .from("integration_connections")
      .update({ status: "disconnected" as const })
      .eq("id", connection.id);
    if (error) { toast.error("Ontkoppelen mislukt"); return; }
    toast.success("ClickWise ontkoppeld");
    await fetchConnection();
  }

  async function toggleRule(key: keyof SyncRules) {
    if (!connection) return;
    const updated = { ...syncRules, [key]: !syncRules[key] };
    const { error } = await supabase
      .from("integration_connections")
      .update({ sync_settings: { rules: updated } })
      .eq("id", connection.id);
    if (error) { toast.error("Regel bijwerken mislukt"); return; }
    setConnection((prev) => prev ? { ...prev, sync_settings: { rules: updated } } : prev);
  }

  async function triggerSync(eventType: string, eventId?: string, data?: Record<string, unknown>) {
    if (!connection || !tenantId) return;
    setSyncing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/clickwise-sync`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connection_id: connection.id,
          tenant_id: tenantId,
          event_type: eventType,
          event_id: eventId,
          data,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Sync voltooid");
      await fetchEvents();
    } catch (err: any) {
      toast.error("Sync mislukt: " + (err.message || "Onbekende fout"));
    } finally {
      setSyncing(false);
    }
  }

  async function createSubaccount() {
    if (!tenantId) return;
    setSyncing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/clickwise-create-subaccount`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("ClickWise sub-account aangemaakt!");
      await fetchConnection();
    } catch (err: any) {
      toast.error("Sub-account aanmaken mislukt: " + (err.message || "Onbekende fout"));
    } finally {
      setSyncing(false);
    }
  }

  return {
    connection,
    status,
    syncRules,
    events,
    loading,
    syncing,
    connect,
    disconnect,
    toggleRule,
    triggerSync,
    createSubaccount,
    refreshEvents: fetchEvents,
  };
}
