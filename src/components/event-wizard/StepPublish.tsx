import { Globe, CalendarClock, Star, Send, Save, Eye, ExternalLink, AlertCircle, Smartphone, Monitor } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AiPublishCheck } from "./AiPublishCheck";
import type { EventFormState, StepValidation } from "./useEventForm";
import { useTranslation } from "@/hooks/useUILanguage";

interface StepPublishProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
  isEditing: boolean;
  eventId?: string;
  saving: boolean;
  onSave: () => void;
  onPublish: () => void;
  validation: StepValidation;
}

export function StepPublish({ form, updateForm, isEditing, eventId, saving, onSave, onPublish, validation }: StepPublishProps) {
  const { t, language } = useTranslation();
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const dateLocale = language === "en" ? "en-US" : "nl-NL";

  const summary = [
    { label: t("wizard.publish.summary.title"), value: form.title, required: true },
    { label: t("wizard.publish.summary.date"), value: form.startDate ? new Date(form.startDate).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "", required: true },
    { label: t("wizard.publish.summary.time"), value: [form.startTime?.slice(0, 5), form.endTime?.slice(0, 5)].filter(Boolean).join(" — "), required: true },
    { label: t("wizard.publish.summary.venue"), value: form.venue },
    { label: t("wizard.publish.summary.description"), value: form.shortDescription ? `${form.shortDescription.slice(0, 80)}${form.shortDescription.length > 80 ? "..." : ""}` : "" },
  ];

  const isReady = validation.isValid;
  const previewUrl = form.slug && isEditing ? `/e/${form.slug}?preview=1` : "";

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">{t("wizard.publish.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("wizard.publish.subtitle")}</p>
      </div>

      {/* AI Publish Check */}
      <AiPublishCheck form={form} />

      {/* Preview: tabs Samenvatting / Live voorbeeld */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <Tabs defaultValue="summary" onValueChange={(v) => { if (v === "live") setPreviewLoaded(true); }}>
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <TabsList className="h-9">
              <TabsTrigger value="summary" className="text-xs gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {t("wizard.publish.summaryTab")}
              </TabsTrigger>
              <TabsTrigger value="live" className="text-xs gap-1.5" disabled={!previewUrl}>
                <ExternalLink className="w-3.5 h-3.5" />
                {t("wizard.publish.liveTab")}
              </TabsTrigger>
            </TabsList>
            {previewUrl && (
              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-md transition-colors ${previewDevice === "desktop" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label={t("wizard.publish.deviceDesktop")}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-md transition-colors ${previewDevice === "mobile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label={t("wizard.publish.deviceMobile")}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <TabsContent value="summary" className="p-5 pt-4 mt-0 space-y-3">
            <div className="space-y-2">
              {summary.map((item) => (
                <div key={item.label} className="flex items-start gap-3 text-sm">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{item.label}</span>
                  <span className={`${item.value ? "text-foreground" : item.required ? "text-destructive" : "text-muted-foreground"}`}>
                    {item.value || (item.required ? t("wizard.publish.summary.missing") : "—")}
                  </span>
                </div>
              ))}
            </div>
            {form.featuredImageUrl && (
              <div className="mt-3">
                <img src={form.featuredImageUrl} alt="Preview" className="w-full max-w-xs rounded-lg border border-border aspect-video object-cover" />
              </div>
            )}
            {!previewUrl && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                {t("wizard.publish.saveDraftFirst")}
              </p>
            )}
          </TabsContent>

          <TabsContent value="live" className="p-5 pt-4 mt-0">
            {previewUrl ? (
              <div className={`mx-auto bg-secondary/30 rounded-lg overflow-hidden border border-border transition-all ${previewDevice === "mobile" ? "max-w-[390px]" : "max-w-full"}`}>
                {previewLoaded && (
                  <iframe
                    src={previewUrl}
                    title={t("wizard.publish.liveTab")}
                    className="w-full bg-background"
                    style={{ height: "560px" }}
                    loading="lazy"
                  />
                )}
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-secondary/50 border-t border-border">
                  <span className="text-xs text-muted-foreground truncate">{previewUrl}</span>
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                    <a href={previewUrl} target="_blank" rel="noreferrer">
                      {t("wizard.publish.openTab")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">{t("wizard.publish.saveDraftFirstShort")}</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Validation errors */}
      {!isReady && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {t("wizard.publish.notReady")}
          </p>
          <ul className="space-y-1">
            {validation.errors.map((err, i) => (
              <li key={i} className="text-xs text-destructive/80">• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Scheduling */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("wizard.publish.schedule")}</p>
            <p className="text-xs text-muted-foreground">{t("wizard.publish.scheduleHelp")}</p>
          </div>
        </div>
        <Input type="datetime-local" value={form.publishAt} onChange={(e) => updateForm({ publishAt: e.target.value })} className="max-w-xs" />
        {form.publishAt && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => updateForm({ publishAt: "" })}>
            {t("wizard.publish.clearSchedule")}
          </Button>
        )}
      </div>

      {/* Discovery visibility */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("wizard.publish.visibility")}</p>
            <p className="text-xs text-muted-foreground">{t("wizard.publish.visibilityHelp")}</p>
          </div>
        </div>
        <Select value={form.showOnDiscovery} onValueChange={(v) => updateForm({ showOnDiscovery: v })}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">{t("wizard.publish.visibility.inherit")}</SelectItem>
            <SelectItem value="show">{t("wizard.publish.visibility.show")}</SelectItem>
            <SelectItem value="hide">{t("wizard.publish.visibility.hide")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Boost (editing only) */}
      {isEditing && eventId && (
        <div className="rounded-xl bg-gradient-to-br from-highlight/10 to-primary/5 border border-highlight/30 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-highlight/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-highlight fill-highlight" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("wizard.publish.boost")}</p>
              <p className="text-xs text-muted-foreground">{t("wizard.publish.boostHelp")}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-2 border-highlight/50 hover:bg-highlight/10"
              onClick={async () => {
                const { data } = await supabase.functions.invoke("create-boost-checkout", { body: { eventId, boostDays: 7 } });
                if (data?.url) window.open(data.url, "_blank");
                else if (data?.success) toast.success(t("wizard.publish.boostSuccess"));
                else toast.error(t("wizard.publish.boostFail"));
              }}>
              <Star className="w-3.5 h-3.5" />{t("wizard.publish.boostDays", { days: "7", price: "6,95" })}
            </Button>
            <Button size="sm" variant="outline" className="gap-2 border-highlight/50 hover:bg-highlight/10"
              onClick={async () => {
                const { data } = await supabase.functions.invoke("create-boost-checkout", { body: { eventId, boostDays: 14 } });
                if (data?.url) window.open(data.url, "_blank");
                else if (data?.success) toast.success(t("wizard.publish.boostSuccess"));
                else toast.error(t("wizard.publish.boostFail"));
              }}>
              <Star className="w-3.5 h-3.5" />{t("wizard.publish.boostDays", { days: "14", price: "12,95" })}
            </Button>
          </div>
        </div>
      )}

      {/* Publish actions */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          {isReady ? t("wizard.publish.readyYes") : t("wizard.publish.readyNo")}
        </p>
        <p className="text-xs text-muted-foreground">
          {form.publishAt
            ? t("wizard.publish.willScheduled")
            : t("wizard.publish.willImmediate")
          }
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={onSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? t("wizard.publish.savingDraft") : t("wizard.publish.saveAsDraft")}
          </Button>
          <Button onClick={onPublish} disabled={saving || !isReady} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="w-4 h-4" />
            {form.publishAt ? t("wizard.publish.schedulePublish") : t("wizard.publish.publishNow")}
          </Button>
          {isEditing && eventId && (
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => window.open(`/e/${form.slug}`, "_blank")}>
              <ExternalLink className="w-3.5 h-3.5" />{t("wizard.publish.preview")}
            </Button>
          )}
        </div>
      </div>

      {/* Ticketing placeholder */}
      <div className="rounded-xl border border-dashed border-border p-5 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><span className="text-lg">🎟️</span></div>
          <div>
            <p className="text-sm font-medium text-foreground flex items-center gap-2">Ticketing<span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("wizard.publish.ticketingSoon")}</span></p>
            <p className="text-xs text-muted-foreground">{t("wizard.publish.ticketingDesc")}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
