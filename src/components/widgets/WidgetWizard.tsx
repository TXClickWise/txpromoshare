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
import { useTranslation } from "@/hooks/useUILanguage";
import { WidgetPreview } from "./WidgetPreview";
import { WidgetEmbedInstructions } from "./WidgetEmbedInstructions";
import { WidgetQualityCheck } from "./WidgetQualityCheck";
import type { Tables } from "@/integrations/supabase/types";

interface WidgetWizardProps {
  widget: Tables<"widgets">;
  events: { id: string; title: string }[];
  onUpdated: () => void;
}

type StepId = "type" | "layout" | "style" | "embed";

export function WidgetWizard({ widget, events, onUpdated }: WidgetWizardProps) {
  const { t } = useTranslation();
  const config = (widget.config || {}) as Record<string, any>;

  const STEPS: { id: StepId; labelKey: string; icon: typeof LayoutGrid }[] = [
    { id: "type", labelKey: "widgetWizard.step.type", icon: Sparkles },
    { id: "layout", labelKey: "widgetWizard.step.layout", icon: LayoutGrid },
    { id: "style", labelKey: "widgetWizard.step.style", icon: Square },
    { id: "embed", labelKey: "widgetWizard.step.embed", icon: Code2 },
  ];

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
      toast.error(t("widgets.saveFailed", { msg: error.message }));
      return false;
    }
    if (!opts?.silent) toast.success(t("widgets.updated"));
    setDirty(false);
    onUpdated();
    return true;
  }

  async function quickFinish() {
    const ok = await save({ silent: true });
    if (ok) {
      toast.success(t("widgetWizard.savedReady"));
      setStepIdx(STEPS.length - 1);
    }
  }

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="space-y-5 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-display font-bold text-foreground truncate">{widget.name}</h2>
            <p className="text-xs text-muted-foreground">
              {widget.type === "agenda" ? t("widgets.typeAgenda") : t("widgets.typeSingle")} · {widget.is_active ? t("common.active") : t("common.inactive")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={quickFinish}
            disabled={saving}
            title={t("widgetWizard.quickFinishHint")}
          >
            <Zap className="w-3.5 h-3.5" />{t("widgetWizard.quickFinish")}
          </Button>
        </div>

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
                  <span className="hidden sm:inline">{t(s.labelKey)}</span>
                </button>
                {i < STEPS.length - 1 && <span className="text-muted-foreground/30 text-xs">→</span>}
              </li>
            );
          })}
        </ol>

        <div className="rounded-xl border border-border bg-card/50 p-5 min-h-[280px]">
          {step.id === "type" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{t("widgetWizard.typeTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("widgetWizard.typeDesc")}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t("widgetWizard.nameLabel")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder={t("widgets.namePlaceholder")} />
              </div>
              {widget.type === "agenda" && (
                <div className="space-y-2">
                  <Label className="text-xs">{t("widgetWizard.maxEvents")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={maxEvents}
                    onChange={(e) => setMaxEvents(Number(e.target.value))}
                    className="h-9 w-28"
                  />
                  <p className="text-[11px] text-muted-foreground">{t("widgetWizard.maxEventsHint")}</p>
                </div>
              )}
              {widget.type === "single_event" && (
                <div className="space-y-2">
                  <Label className="text-xs">{t("widgetWizard.eventLabel")}</Label>
                  <Select value={eventId} onValueChange={setEventId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t("widgets.chooseEvent")} /></SelectTrigger>
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
                <h3 className="text-sm font-semibold text-foreground mb-1">{t("widgetWizard.layoutTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("widgetWizard.layoutDesc")}</p>
              </div>

              {widget.type === "agenda" && (
                <div className="space-y-2">
                  <Label className="text-xs">{t("widgetWizard.density")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <OptionCard
                      active={density === "compact"}
                      onClick={() => setDensity("compact")}
                      title={t("widgetWizard.densityCompact")}
                      hint={t("widgetWizard.densityCompactHint")}
                    />
                    <OptionCard
                      active={density === "comfortable"}
                      onClick={() => setDensity("comfortable")}
                      title={t("widgetWizard.densityComfortable")}
                      hint={t("widgetWizard.densityComfortableHint")}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-xs font-medium text-foreground">{t("widgetWizard.showImage")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("widgetWizard.showImageHint")}</p>
                </div>
                <Switch checked={showImage} onCheckedChange={setShowImage} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-xs font-medium text-foreground">{t("widgetWizard.showDesc")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("widgetWizard.showDescHint")}</p>
                </div>
                <Switch checked={showDescription} onCheckedChange={setShowDescription} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-xs font-medium text-foreground">{t("widgetWizard.showShare")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("widgetWizard.showShareHint")}</p>
                </div>
                <Switch checked={showShareButtons} onCheckedChange={setShowShareButtons} />
              </div>
            </div>
          )}

          {step.id === "style" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{t("widgetWizard.styleTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("widgetWizard.styleDesc")}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t("widgetWizard.theme")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <OptionCard
                    active={theme === "light"}
                    onClick={() => setTheme("light")}
                    title={t("widgetWizard.themeLight")}
                    hint={t("widgetWizard.themeLightHint")}
                  />
                  <OptionCard
                    active={theme === "dark"}
                    onClick={() => setTheme("dark")}
                    title={t("widgetWizard.themeDark")}
                    hint={t("widgetWizard.themeDarkHint")}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("widgetWizard.themeTip")}
              </p>
            </div>
          )}

          {step.id === "embed" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{t("widgetWizard.embedTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("widgetWizard.embedDesc")}</p>
              </div>
              <WidgetQualityCheck widget={widget} />
              <WidgetEmbedInstructions widgetId={widget.id} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />{t("widgetWizard.prev")}
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
                <Save className="w-3.5 h-3.5" />{saving ? t("widgetWizard.savingBtn") : t("widgetWizard.saveBtn")}
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
                {t("widgetWizard.next")}<ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => save()}
                disabled={saving || !name.trim() || !dirty}
                className="gap-1.5"
              >
                <Check className="w-4 h-4" />{saving ? t("widgetWizard.savingBtn") : dirty ? t("widgetWizard.saveBtn") : t("widgetWizard.savedBtn")}
              </Button>
            )}
          </div>
        </div>
      </div>

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
