import { Code2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useUILanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import { WidgetWizard } from "@/components/widgets/WidgetWizard";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type WidgetType = Database["public"]["Enums"]["widget_type"];

export default function WidgetsPage() {
  const { t } = useTranslation();
  const { tenantId } = useTenant();
  const [widgets, setWidgets] = useState<Tables<"widgets">[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WidgetType>("agenda");
  const [newEventId, setNewEventId] = useState("");
  const [creating, setCreating] = useState(false);
  const [events, setEvents] = useState<{ id: string; title: string; status: string }[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  async function fetchWidgets() {
    if (!tenantId) return;
    const { data } = await supabase
      .from("widgets")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setWidgets(data || []);
    setLoading(false);
  }

  async function fetchEvents() {
    if (!tenantId) return;
    const { data } = await supabase
      .from("events")
      .select("id, title, status")
      .eq("tenant_id", tenantId)
      .in("status", ["published", "scheduled", "draft"])
      .order("start_date", { ascending: false });
    setEvents(data || []);
  }

  useEffect(() => { fetchWidgets(); fetchEvents(); }, [tenantId]);

  async function createWidget() {
    if (!tenantId || !newName.trim()) return;
    if (newType === "single_event" && !newEventId) {
      toast.error(t("widgets.selectEventFirst"));
      return;
    }
    setCreating(true);
    const config: any = { theme: "light", show_description: true, show_share_buttons: true };
    if (newType === "single_event") config.event_id = newEventId;
    const { data, error } = await supabase.from("widgets").insert({
      tenant_id: tenantId,
      name: newName.trim(),
      type: newType,
      config,
    }).select("id").single();
    setCreating(false);
    if (error) {
      toast.error(t("widgets.createFailed", { msg: error.message }));
    } else {
      toast.success(t("widgets.created"));
      setNewName("");
      setNewEventId("");
      setDialogOpen(false);
      await fetchWidgets();
      if (data) setSelectedWidgetId(data.id);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase.from("widgets").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? t("widgets.activated") : t("widgets.deactivated"));
    fetchWidgets();
  }

  async function deleteWidget(id: string, name: string) {
    const { error } = await supabase.from("widgets").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("widgets.deleted", { name }));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
    fetchWidgets();
  }

  function getEmbedCode(widget: Tables<"widgets">) {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const scriptUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widget.id}&format=js`;
    return `<div id="txeventshare-widget-${widget.id}"></div>\n<script src="${scriptUrl}" data-widget-id="${widget.id}" async></script>`;
  }

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success(t("widgets.codeCopied"));
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("widgets.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("widgets.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
              <Plus className="w-4 h-4" />{t("widgets.new")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("widgets.newDialog")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t("widgets.name")}</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("widgets.namePlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label>{t("widgets.type")}</Label>
                <Select value={newType} onValueChange={(v) => { setNewType(v as WidgetType); setNewEventId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agenda">{t("widgets.agenda")}</SelectItem>
                    <SelectItem value="single_event">{t("widgets.singleEvent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newType === "single_event" && (
                <div className="space-y-2">
                  <Label>{t("widgets.whichEvent")}</Label>
                  <Select value={newEventId} onValueChange={setNewEventId}>
                    <SelectTrigger><SelectValue placeholder={t("widgets.chooseEvent")} /></SelectTrigger>
                    <SelectContent>
                      {events.map((ev) => (
                        <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={createWidget} disabled={creating || !newName.trim()} className="w-full">
                {creating ? t("widgets.creating") : t("widgets.create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-secondary/30 border border-border p-4">
        <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
            {t("widgets.step1")}
          </div>
          <span className="text-muted-foreground/30">→</span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
            {t("widgets.step2")}
          </div>
          <span className="text-muted-foreground/30">→</span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
            {t("widgets.step3")}
          </div>
        </div>
      </div>

      {widgets.length === 0 ? (
        <EmptyState icon={Code2} title={t("widgets.empty")} description={t("widgets.emptyDesc")} />
      ) : (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Widget list */}
          <div className="space-y-3 lg:w-[340px] shrink-0">
            {widgets.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <WidgetCard
                  widget={w}
                  isSelected={selectedWidgetId === w.id}
                  copied={copied === w.id}
                  onSelect={() => setSelectedWidgetId(w.id)}
                  onCopy={() => copy(w.id, getEmbedCode(w))}
                  onToggleActive={() => toggleActive(w.id, w.is_active)}
                  onDelete={() => deleteWidget(w.id, w.name)}
                />
              </motion.div>
            ))}
          </div>

          {/* Config panel */}
          <div className="flex-1 min-w-0">
            {selectedWidget ? (
              <motion.div
                key={selectedWidget.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-card border border-border shadow-card p-6"
              >
                <WidgetWizard
                  widget={selectedWidget}
                  events={events}
                  onUpdated={fetchWidgets}
                />
              </motion.div>
            ) : (
              <div className="rounded-xl bg-secondary/20 border border-dashed border-border p-12 text-center">
                <Code2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("widgets.selectToConfigure")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
