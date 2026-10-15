import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAY_OPTIONS: Array<[string, string]> = [
  ["1", "Maandag"], ["2", "Dinsdag"], ["3", "Woensdag"], ["4", "Donderdag"],
  ["5", "Vrijdag"], ["6", "Zaterdag"], ["7", "Zondag"],
];

const HOUR_OPTIONS: Array<[string, string]> = [
  ["1", "1 uur voor aanvang"], ["2", "2 uur voor aanvang"], ["3", "3 uur voor aanvang"],
  ["6", "6 uur voor aanvang"], ["12", "12 uur voor aanvang"], ["24", "24 uur voor aanvang"],
];

export function AdminTenantNotificationsPanel({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<any>(null);
  const [fanOutEnabled, setFanOutEnabled] = useState(false);
  const [reminderHours, setReminderHours] = useState("2");
  const [digestDay, setDigestDay] = useState("2");
  const [digestTime, setDigestTime] = useState("10:00");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("integration_connections")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("provider", "clickwise")
      .maybeSingle();
    setConnection(data);
    if (data) {
      const creds = (data.credentials_encrypted as any) || {};
      const timing = ((data.sync_settings as any)?.timing) || {};
      setFanOutEnabled(creds.fan_out_enabled === true);
      if (timing.reminder_hours_before) setReminderHours(String(timing.reminder_hours_before));
      if (timing.digest_day_of_week) setDigestDay(String(timing.digest_day_of_week));
      if (timing.digest_time) setDigestTime(String(timing.digest_time));
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  async function persistTiming() {
    if (!connection) return;
    setSaving(true);
    const { error } = await supabase
      .from("integration_connections")
      .update({
        sync_settings: {
          ...((connection.sync_settings as any) || {}),
          timing: {
            reminder_hours_before: Number(reminderHours) || 2,
            digest_day_of_week: Number(digestDay) || 2,
            digest_time: digestTime || "10:00",
          },
        },
      })
      .eq("id", connection.id);
    setSaving(false);
    if (error) {
      toast.error("Kon verzendschema niet opslaan");
    } else {
      toast.success("Verzendschema opgeslagen");
      load();
    }
  }

  async function toggleFanOut(next: boolean) {
    if (!connection) return;
    setFanOutEnabled(next);
    const creds = { ...((connection.credentials_encrypted as any) || {}), fan_out_enabled: next };
    const { error } = await supabase
      .from("integration_connections")
      .update({ credentials_encrypted: creds })
      .eq("id", connection.id);
    if (error) {
      setFanOutEnabled(!next);
      toast.error("Kon instellingen niet opslaan");
      return;
    }
    setConnection({ ...connection, credentials_encrypted: creds });
    toast.success(next ? "Notificaties ingeschakeld" : "Notificaties uitgeschakeld");
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">Laden…</CardContent>
      </Card>
    );
  }

  if (!connection) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm font-medium text-foreground">Notificaties</p>
          <p className="text-sm text-muted-foreground mt-1">
            Deze organisatie heeft nog geen ClickWise-koppeling, dus er is geen verzendschema om in te stellen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5 min-w-0">
            <Send className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Notificaties</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verzendschema voor SMS/WhatsApp-herinneringen en het weekoverzicht
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={fanOutEnabled ? "default" : "secondary"}>{fanOutEnabled ? "Aan" : "Uit"}</Badge>
            <Switch checked={fanOutEnabled} onCheckedChange={toggleFanOut} />
          </div>
        </div>

        <div className={`grid sm:grid-cols-3 gap-3 ${fanOutEnabled ? "" : "opacity-50 pointer-events-none"}`}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Herinnering</label>
            <Select value={reminderHours} onValueChange={setReminderHours}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Weekoverzicht — dag</label>
            <Select value={digestDay} onValueChange={setDigestDay}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Weekoverzicht — tijd</label>
            <Input type="time" value={digestTime} onChange={(e) => setDigestTime(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Tijden zijn in Nederlandse tijd. Standaard: herinnering 2 uur voor aanvang, weekoverzicht op dinsdag 10:00.
        </p>

        <div className="flex justify-end">
          <Button size="sm" onClick={persistTiming} disabled={saving || !fanOutEnabled}>
            {saving ? "Opslaan…" : "Opslaan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
