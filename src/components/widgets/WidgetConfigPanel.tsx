import { useState, useEffect } from "react";
import { Copy, Check, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WidgetPreview } from "./WidgetPreview";
import type { Tables } from "@/integrations/supabase/types";

interface WidgetConfigPanelProps {
  widget: Tables<"widgets">;
  events: { id: string; title: string }[];
  onUpdated: () => void;
}

export function WidgetConfigPanel({ widget, events, onUpdated }: WidgetConfigPanelProps) {
  const config = (widget.config || {}) as Record<string, any>;
  const [name, setName] = useState(widget.name);
  const [theme, setTheme] = useState<string>(config.theme || "light");
  const [maxEvents, setMaxEvents] = useState<number>(config.max_events || 20);
  const [showDescription, setShowDescription] = useState<boolean>(config.show_description !== false);
  const [showShareButtons, setShowShareButtons] = useState<boolean>(config.show_share_buttons !== false);
  const [eventId, setEventId] = useState<string>(config.event_id || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = (widget.config || {}) as Record<string, any>;
    setName(widget.name);
    setTheme(c.theme || "light");
    setMaxEvents(c.max_events || 20);
    setShowDescription(c.show_description !== false);
    setShowShareButtons(c.show_share_buttons !== false);
    setEventId(c.event_id || "");
  }, [widget.id]);

  async function save() {
    setSaving(true);
    const newConfig: Record<string, any> = {
      theme,
      max_events: maxEvents,
      show_description: showDescription,
      show_share_buttons: showShareButtons,
    };
    if (widget.type === "single_event" && eventId) {
      newConfig.event_id = eventId;
    }
    const { error } = await supabase
      .from("widgets")
      .update({ name: name.trim(), config: newConfig })
      .eq("id", widget.id);
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
    } else {
      toast.success("Widget bijgewerkt");
      onUpdated();
    }
  }

  function getEmbedCode() {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const scriptUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widget.id}&format=js`;
    return `<div id="txeventshare-widget-${widget.id}"></div>\n<script src="${scriptUrl}" data-widget-id="${widget.id}" async></script>`;
  }

  const embedCode = getEmbedCode();

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Embed code gekopieerd");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-display font-bold text-foreground">{widget.name}</h2>
        <p className="text-xs text-muted-foreground">
          {widget.type === "agenda" ? "Agenda widget" : "Enkel event widget"} · {widget.is_active ? "Actief" : "Inactief"}
        </p>
      </div>

      {/* Live Preview */}
      <WidgetPreview widget={widget} />

      <Separator />

      {/* Config */}
      <div className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Instellingen</p>

        <div className="space-y-2">
          <Label className="text-xs">Widget naam</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Thema</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {widget.type === "agenda" && (
          <div className="space-y-2">
            <Label className="text-xs">Max. aantal evenementen</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={maxEvents}
              onChange={(e) => setMaxEvents(Number(e.target.value))}
              className="h-9 w-24"
            />
          </div>
        )}

        {widget.type === "single_event" && (
          <div className="space-y-2">
            <Label className="text-xs">Evenement</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Kies een evenement" /></SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">Beschrijvingen tonen</p>
            <p className="text-[11px] text-muted-foreground">Korte beschrijving onder de titel</p>
          </div>
          <Switch checked={showDescription} onCheckedChange={setShowDescription} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">Deelknoppen tonen</p>
            <p className="text-[11px] text-muted-foreground">WhatsApp, Facebook, X, E-mail</p>
          </div>
          <Switch checked={showShareButtons} onCheckedChange={setShowShareButtons} />
        </div>

        <Button size="sm" onClick={save} disabled={saving || !name.trim()} className="gap-2 w-full">
          <Save className="w-4 h-4" />{saving ? "Opslaan..." : "Instellingen opslaan"}
        </Button>
      </div>

      <Separator />

      {/* Embed code */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Embed code</p>
        <code className="block text-[11px] bg-secondary p-3 rounded-lg text-muted-foreground whitespace-pre-wrap font-mono break-all">
          {embedCode}
        </code>
        <Button variant="outline" size="sm" onClick={copyCode} className="gap-2 w-full">
          {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
          {copied ? "Gekopieerd!" : "Kopieer embed code"}
        </Button>
      </div>
    </div>
  );
}
