import { CalendarDays, MapPin, Repeat, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";
import { generateDates as libGenerateDates, summarizeRecurrence, type RecurrenceInput } from "@/lib/recurrence";
import { useTranslation } from "@/hooks/useUILanguage";

function toRecurrenceInput(form: EventFormState): RecurrenceInput {
  return {
    startDate: form.startDate,
    isRecurring: form.isRecurring,
    recurringFreq: form.recurringFreq,
    recurringCustomFreq: form.recurringCustomFreq,
    recurringInterval: form.recurringInterval,
    recurringDays: form.recurringDays,
    recurringEndType: form.recurringEndType,
    recurringEndDate: form.recurringEndDate,
    recurringEndCount: form.recurringEndCount,
  };
}

interface StepDateTimeProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
  venues?: Tables<"venues">[];
}

export function StepDateTime({ form, updateForm, venues = [] }: StepDateTimeProps) {
  const { t, language } = useTranslation();
  const RECURRENCE_PRESETS = [
    { value: "weekly", label: t("wizard.dateTime.preset.weekly"), desc: t("wizard.dateTime.preset.weeklyDesc") },
    { value: "biweekly", label: t("wizard.dateTime.preset.biweekly"), desc: t("wizard.dateTime.preset.biweeklyDesc") },
    { value: "monthly", label: t("wizard.dateTime.preset.monthly"), desc: t("wizard.dateTime.preset.monthlyDesc") },
    { value: "daily", label: t("wizard.dateTime.preset.daily"), desc: t("wizard.dateTime.preset.dailyDesc") },
    { value: "custom", label: t("wizard.dateTime.preset.custom"), desc: t("wizard.dateTime.preset.customDesc") },
  ];
  const END_OPTIONS = [
    { value: "never", label: t("wizard.dateTime.end.never") },
    { value: "date", label: t("wizard.dateTime.end.date") },
    { value: "count", label: t("wizard.dateTime.end.count") },
  ];
  const WEEKDAYS = [
    t("wizard.dateTime.weekday.mon"),
    t("wizard.dateTime.weekday.tue"),
    t("wizard.dateTime.weekday.wed"),
    t("wizard.dateTime.weekday.thu"),
    t("wizard.dateTime.weekday.fri"),
    t("wizard.dateTime.weekday.sat"),
    t("wizard.dateTime.weekday.sun"),
  ];
  const dateLocale = language === "en" ? "en-US" : "nl-NL";
  const handleVenueSelect = (venueId: string) => {
    if (venueId === "custom") {
      updateForm({ venueId: "", venue: "", address: "" });
      return;
    }
    const v = venues.find(v => v.id === venueId);
    if (v) {
      updateForm({
        venueId: v.id,
        venue: v.name,
        address: [v.address, v.city].filter(Boolean).join(", "),
      });
    }
  };

  const isCustomFreq = form.recurringFreq === "custom";

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">{t("wizard.dateTime.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("wizard.dateTime.subtitle")}</p>
      </div>

      {/* Date & Time */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="w-4 h-4 text-primary" />
          {t("wizard.dateTime.dateTime")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.startDate")} <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.endDate")}</Label>
            <Input type="date" value={form.endDate} onChange={(e) => updateForm({ endDate: e.target.value })} min={form.startDate || undefined} />
            {form.endDate && form.startDate && form.endDate < form.startDate ? (
              <p className="text-xs text-destructive">{t("wizard.dateTime.endDateInvalid")}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("wizard.dateTime.endDateHint")}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.startTime")} <span className="text-destructive">*</span></Label>
            <Input type="time" value={form.startTime} onChange={(e) => updateForm({ startTime: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.endTime")}</Label>
            <Input type="time" value={form.endTime} onChange={(e) => updateForm({ endTime: e.target.value })} />
            <p className="text-xs text-muted-foreground">{t("wizard.dateTime.endTimeHint")}</p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          {t("wizard.dateTime.location")}
        </div>
        {venues.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.savedVenue")}</Label>
            <Select value={form.venueId || "custom"} onValueChange={handleVenueSelect}>
              <SelectTrigger><SelectValue placeholder={t("wizard.dateTime.selectVenue")} /></SelectTrigger>
              <SelectContent>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}{v.is_primary ? " ★" : ""}{v.city ? ` — ${v.city}` : ""}
                  </SelectItem>
                ))}
                <SelectItem value="custom">{t("wizard.dateTime.customVenue")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {(!form.venueId || venues.length === 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.venueName")}</Label>
              <Input value={form.venue} onChange={(e) => updateForm({ venue: e.target.value })} placeholder={t("wizard.dateTime.venueNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.address")}</Label>
              <Input value={form.address} onChange={(e) => updateForm({ address: e.target.value })} placeholder={t("wizard.dateTime.addressPlaceholder")} />
            </div>
          </div>
        )}
        {form.venueId && venues.length > 0 && (
          <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
            📍 {form.venue}{form.address ? ` — ${form.address}` : ""}
          </div>
        )}
      </div>

      {/* Recurring */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Repeat className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("wizard.dateTime.recurring")}</p>
              <p className="text-xs text-muted-foreground">{t("wizard.dateTime.recurringHelp")}</p>
            </div>
          </div>
          <Switch checked={form.isRecurring} onCheckedChange={(v) => updateForm({ isRecurring: v })} />
        </div>

        {form.isRecurring && (
          <div className="space-y-5 pt-4 border-t border-border">
            {/* Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium">{t("wizard.dateTime.repetition")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {RECURRENCE_PRESETS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      if (p.value === "custom") {
                        updateForm({ recurringFreq: "custom" });
                      } else if (p.value === "biweekly") {
                        updateForm({ recurringFreq: "weekly", recurringInterval: 2 });
                      } else {
                        updateForm({ recurringFreq: p.value, recurringInterval: 1 });
                      }
                    }}
                    className={`px-3 py-2.5 rounded-lg text-left transition-all border ${
                      (form.recurringFreq === p.value) ||
                      (p.value === "biweekly" && form.recurringFreq === "weekly" && form.recurringInterval === 2) ||
                      (p.value === form.recurringFreq && form.recurringInterval === 1 && p.value !== "custom")
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <span className="text-xs font-semibold block">{p.label}</span>
                    <span className="text-xs opacity-70">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom frequency */}
            {isCustomFreq && (
              <div className="grid grid-cols-2 gap-4 bg-secondary/30 rounded-lg p-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.frequency")}</Label>
                  <Select value={form.recurringCustomFreq || "weekly"} onValueChange={(v) => updateForm({ recurringCustomFreq: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t("wizard.dateTime.freq.daily")}</SelectItem>
                      <SelectItem value="weekly">{t("wizard.dateTime.freq.weekly")}</SelectItem>
                      <SelectItem value="monthly">{t("wizard.dateTime.freq.monthly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.every")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={form.recurringInterval}
                    onChange={(e) => updateForm({ recurringInterval: Number(e.target.value) })}
                    placeholder="1"
                  />
                </div>
              </div>
            )}

            {/* Days of week (for weekly) */}
            {(form.recurringFreq === "weekly" || (isCustomFreq && (form.recurringCustomFreq || "weekly") === "weekly")) && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.onDays")}</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEKDAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => updateForm({
                        recurringDays: form.recurringDays.includes(i + 1)
                          ? form.recurringDays.filter(d => d !== i + 1)
                          : [...form.recurringDays, i + 1]
                      })}
                      className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${
                        form.recurringDays.includes(i + 1)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* End condition */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground font-medium">{t("wizard.dateTime.stopWhen")}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {END_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateForm({ recurringEndType: opt.value })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      (form.recurringEndType || "never") === opt.value
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.recurringEndType === "date" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.endRecurrenceDate")}</Label>
                  <Input
                    type="date"
                    value={form.recurringEndDate}
                    onChange={(e) => updateForm({ recurringEndDate: e.target.value })}
                    min={form.startDate || undefined}
                    className="max-w-xs"
                  />
                </div>
              )}

              {form.recurringEndType === "count" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("wizard.dateTime.repeatCount")}</Label>
                  <Input
                    type="number"
                    min={2}
                    max={52}
                    value={form.recurringEndCount || 10}
                    onChange={(e) => updateForm({ recurringEndCount: Number(e.target.value) })}
                    className="max-w-xs"
                    placeholder="10"
                  />
                </div>
              )}
            </div>

            {/* Human-readable summary */}
            {form.startDate && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-primary">{t("wizard.dateTime.recurrenceSummary")}</p>
                  <p className="text-sm text-foreground">{summarizeRecurrence(toRecurrenceInput(form)) || "—"}</p>
                </div>
              </div>
            )}

            {/* Preview of generated dates */}
            {form.startDate && (
              <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("wizard.dateTime.firstDates")}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {libGenerateDates(toRecurrenceInput(form)).slice(0, 8).map((d, i) => (
                    <span key={i} className="text-xs bg-background rounded px-2 py-0.5 text-foreground border border-border">
                      {new Date(d).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  ))}
                  {libGenerateDates(toRecurrenceInput(form)).length > 8 && (
                    <span className="text-xs text-muted-foreground px-2 py-0.5">
                      {t("wizard.dateTime.moreDates", { count: String(libGenerateDates(toRecurrenceInput(form)).length - 8) })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Backward-compat wrapper — gebruikt nu de gedeelde recurrence library */
export function generatePreviewDates(form: EventFormState): string[] {
  return libGenerateDates(toRecurrenceInput(form));
}
