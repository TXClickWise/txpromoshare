import { useState, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, Save, LayoutGrid, Square, Sparkles, Code2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WidgetPreview } from "./WidgetPreview";
import { WidgetEmbedInstructions } from "./WidgetEmbedInstructions";
import type { Tables } from "@/integrations/supabase/types";

interface WidgetWizardProps {
  widget: Tables<"widgets">;
  events: { id: string; title: string }[];
  onUpdated: () => void;
}

type StepId = "type" | "layout" | "style" | "embed";

const STEPS: { id: StepId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "type", label: "Type & inhoud", icon: Sparkles },
  { id: "layout", label: "Layout", icon: LayoutGrid },
  { id: "style", label: "Stijl", icon: Square },
  { id: "embed", label: "Embed", icon: Code2 },
];

export function WidgetWizard({ widget, events, onUpdated }: WidgetWizardProps) {
  const config = (widget.config || {}) as Record<string, any>;

  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState(widget.name);
  const [theme, setTheme] = useState<string>(config.theme || "light");
  const [density, setDensity] = useState<string>(config.density || "compact");
  const [maxEvents, setMaxEvents] = useState<number>(config.max_events || 20);
  const [showImage, setShowImage] = useState<boolean>(config.show_image !== false);
  const [showDescription, setShowDescription] = useState<boolean>(config.show_description !== false);
  const [showShareButtons, setShowShareButtons] = useState<boolean>(config.show_share_buttons !== false);
  const [eventId, setEventId] = useState<string>(config.event_id || "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Reset on widget switch
  useEffect(() => {
    const c = (widget.config || {}) as Record<string, any>;
    setName(widget.name);
    setTheme(c.theme || "light");
    setDensity(c.density || "compact");
    setMaxEvents(c.max_events || 20);
    setShowImage(c.show_image !== false);
    setShowDescription(c.show_description !== false);
    setShowShareButtons(c.show_share_buttons !== false);
    setEventId(c.event_id || "");
    setStepIdx(0);
    setDirty(false);
  }, [widget.id]);

  // Mark dirty when fields change (after initial load)
  useEffect(() => {
    setDirty(true);
  }, [name, theme, density, maxEvents, showImage, showDescription, showShareButtons, eventId]);

  async function save(opts?: { silent?: boolean }) {
    setSaving(true);
    const newConfig: Record<string, any> = {
      theme,
      density,
      max_events: maxEvents,
      show_image: showImage,
      show_description: showDescription,
      show_share_buttons: showShareButtons,
    };
    if (widget.type === "single_event" && eventId) newConfig.event_id = eventId;

    const { error } = await supabase
      .from("widgets")
      .update({ name: name.trim(), config: newConfig })
      .eq("id", widget.id);
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
      return false;
    }
    if (!opts?.silent) toast.success("Widget bijgewerkt");
    setDirty(false);
    onUpdated();
    return true;
  }

  async function quickFinish() {
    const ok = await save({ silent: true });
    if (ok) {
      toast.success("Widget opgeslagen — klaar om te embedden");
      setStepIdx(STEPS.length - 1);
    }
  }

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      {/* Left: stepper + step content */}
      <div className="space-y-5 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-display font-bold text-foreground truncate">{widget.name}</h2>
            <p className="text-xs text-muted-foreground">
              {widget.type === "agenda" ? "Agenda widget" : "Enkel event widget"} · {widget.is_active ? "Actief" : "Inactief"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={quickFinish}
            disabled={saving}
            title="Sla op met huidige instellingen en spring naar embed"
          >
            <Zap className="w-3.5 h-3.5" />Snel klaar
          </Button>
        </div>

        {/* Stepper */}
        <ol className="flex items-center gap-1 sm:gap-2 text-[11px] font-medium">
          {STEPS.map((s, i) => {
            const active = i === stepIdx;
            const done = i < stepIdx;
            const Icon = s.icon;
            return (
              <li key={s.id} className="flex items-center gap-1 sm:gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setStepIdx(i)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors border",
                    active && "bg-primary text-primary-foreground border-primary",
                    done && !active && "bg-secondary text-foreground border-border",
                    !active && !done && "bg-background text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                    active ? "bg-primary-foreground/20" : done ? "bg-foreground/10" : "bg-muted"
                  )}>
                    {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <span className="text-muted-foreground/30 text-xs">→</span>}
              </li>
            );
          })}
        </ol>

        {/* Step body */}
        <div className="rounded-xl border border-border bg-card/50 p-5 min-h-[280px]">
          {step.id === "type" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Type & inhoud</h3>
                <p className="text-xs text-muted-foreground">Geef je widget een naam en kies wat er getoond wordt.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Widget naam</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="Bijv. Homepage agenda" />
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
                    className="h-9 w-28"
                  />
                  <p className="text-[11px] text-muted-foreground">Tip: 5–10 werkt het beste op homepages.</p>
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
            </div>
          )}

          {step.id === "layout" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Layout</h3>
                <p className="text-xs text-muted-foreground">Bepaal hoe compact je widget eruitziet.</p>
              </div>

              {widget.type === "agenda" && (
                <div className="space-y-2">
                  <Label className="text-xs">Dichtheid</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <OptionCard
                      active={density === "compact"}
                      onClick={() => setDensity("compact")}
                      title="Compact"
                      hint="Ideaal voor mobiel & sidebars"
                    />
                    <OptionCard
                      active={density === "comfortable"}
                      onClick={() => setDensity("comfortable")}
                      title="Comfortabel"
                      hint="Meer ruimte, grotere afbeeldingen"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Afbeelding tonen</p>
                  <p className="text-[11px] text-muted-foreground">Thumbnail per evenement</p>
                </div>
                <Switch checked={showImage} onCheckedChange={setShowImage} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Beschrijvingen tonen</p>
                  <p className="text-[11px] text-muted-foreground">Korte tekst onder de titel</p>
                </div>
                <Switch checked={showDescription} onCheckedChange={setShowDescription} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Deelknoppen tonen</p>
                  <p className="text-[11px] text-muted-foreground">WhatsApp, Facebook, X, e-mail</p>
                </div>
                <Switch checked={showShareButtons} onCheckedChange={setShowShareButtons} />
              </div>
            </div>
          )}

          {step.id === "style" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Stijl</h3>
                <p className="text-xs text-muted-foreground">Past zich automatisch aan bij je website.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Thema</Label>
                <div className="grid grid-cols-2 gap-2">
                  <OptionCard
                    active={theme === "light"}
                    onClick={() => setTheme("light")}
                    title="Light"
                    hint="Witte achtergrond"
                  />
                  <OptionCard
                    active={theme === "dark"}
                    onClick={() => setTheme("dark")}
                    title="Dark"
                    hint="Donkere achtergrond"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tip: Het thema neemt automatisch je accentkleuren over uit je merkinstellingen.
              </p>
            </div>
          )}

          {step.id === "embed" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Embed</h3>
                <p className="text-xs text-muted-foreground">Plak deze code op je website. De widget update automatisch.</p>
              </div>
              <WidgetEmbedInstructions widgetId={widget.id} />
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />Vorige
          </Button>

          <div className="flex items-center gap-2">
            {dirty && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => save()}
                disabled={saving || !name.trim()}
                className="gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />{saving ? "Opslaan..." : "Opslaan"}
              </Button>
            )}
            {!isLast ? (
              <Button
                size="sm"
                onClick={async () => {
                  if (dirty) await save({ silent: true });
                  setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
                }}
                disabled={saving || !name.trim()}
                className="gap-1"
              >
                Volgende<ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => save()}
                disabled={saving || !name.trim() || !dirty}
                className="gap-1.5"
              >
                <Check className="w-4 h-4" />{saving ? "Opslaan..." : dirty ? "Opslaan" : "Opgeslagen"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right: sticky preview */}
      <div className="lg:sticky lg:top-4 self-start">
        <WidgetPreview widget={widget} />
      </div>
    </div>
  );
}

function OptionCard({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border p-3 transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:border-foreground/30 bg-background"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        {active && <Check className="w-3.5 h-3.5 text-primary" />}
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
    </button>
  );
}
