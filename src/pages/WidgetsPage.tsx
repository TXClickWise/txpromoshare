import { Code2, Copy, Check, Plus, Palette, Trash2, Power, PowerOff } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type WidgetType = Database["public"]["Enums"]["widget_type"];

export default function WidgetsPage() {
  const { tenantId, tenant } = useTenant();
  const [widgets, setWidgets] = useState<Tables<"widgets">[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WidgetType>("agenda");
  const [newEventId, setNewEventId] = useState("");
  const [creating, setCreating] = useState(false);
  const [events, setEvents] = useState<{ id: string; title: string; status: string }[]>([]);

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
      toast.error("Selecteer een evenement voor een Enkel Event widget");
      return;
    }
    setCreating(true);
    const config: any = { theme: "light" };
    if (newType === "single_event") config.event_id = newEventId;
    const { error } = await supabase.from("widgets").insert({
      tenant_id: tenantId,
      name: newName.trim(),
      type: newType,
      config,
    });
    setCreating(false);
    if (error) {
      toast.error("Aanmaken mislukt: " + error.message);
    } else {
      toast.success("Widget aangemaakt");
      setNewName("");
      setNewEventId("");
      setDialogOpen(false);
      fetchWidgets();
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase.from("widgets").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? "Widget geactiveerd" : "Widget gedeactiveerd");
    fetchWidgets();
  }

  async function deleteWidget(id: string, name: string) {
    const { error } = await supabase.from("widgets").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${name}" verwijderd`);
    fetchWidgets();
  }

  function getEmbedCode(widget: Tables<"widgets">) {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const scriptUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widget.id}&format=js`;
    return `<div id="txeventshare-widget-${widget.id}"></div>\n<script src="${scriptUrl}" data-widget-id="${widget.id}" async></script>`;
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.widgets.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Embed je agenda of een enkel evenement op je website</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
              <Plus className="w-4 h-4" />Nieuwe widget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe widget aanmaken</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Bijv. Homepage agenda" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as WidgetType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agenda">{t.widgets.agenda}</SelectItem>
                    <SelectItem value="single_event">{t.widgets.singleEvent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createWidget} disabled={creating || !newName.trim()} className="w-full">
                {creating ? "Aanmaken..." : "Aanmaken"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-secondary/30 border border-border p-4">
        <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">1</span>
            Maak een widget
          </div>
          <span className="text-muted-foreground/30">→</span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">2</span>
            Kopieer de code
          </div>
          <span className="text-muted-foreground/30">→</span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">3</span>
            Plak op je website
          </div>
        </div>
      </div>

      {widgets.length === 0 ? (
        <EmptyState icon={Code2} title="Nog geen widgets" description="Maak je eerste widget aan om je evenementen op je website te tonen." />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {widgets.map((w, i) => {
            const embedCode = getEmbedCode(w);
            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card border border-border shadow-card overflow-hidden"
              >
                {/* Preview area */}
                <div className="h-24 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center border-b border-border relative">
                  <span className="text-3xl">{w.type === "agenda" ? "📅" : "🎯"}</span>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${w.is_active ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {w.is_active ? "Actief" : "Inactief"}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-foreground">{w.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {w.type === "agenda" ? t.widgets.agenda : t.widgets.singleEvent}
                    </p>
                  </div>

                  {/* Embed code */}
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{t.widgets.embedInstructions}:</p>
                    <code className="block text-[11px] bg-secondary p-3 rounded-lg text-muted-foreground whitespace-pre-wrap font-mono break-all">{embedCode}</code>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copy(w.id, embedCode)} className="gap-2 flex-1">
                      {copied === w.id ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                      {copied === w.id ? "Gekopieerd!" : "Kopieer code"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(w.id, w.is_active)} className="gap-2" title={w.is_active ? "Deactiveren" : "Activeren"}>
                      {w.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteWidget(w.id, w.name)} className="gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <UpgradeBanner feature="Onbeperkt widgets & geavanceerde stijlopties" plan="Pro" compact />
    </div>
  );
}
