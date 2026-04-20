import { CalendarDays, MapPin, Repeat, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";
import { generateDates as libGenerateDates, summarizeRecurrence, type RecurrenceInput } from "@/lib/recurrence";

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

const RECURRENCE_PRESETS = [
  { value: "weekly", label: "Wekelijks", desc: "Elke week op dezelfde dag" },
  { value: "biweekly", label: "Om de 2 weken", desc: "Elke twee weken" },
  { value: "monthly", label: "Maandelijks", desc: "Eén keer per maand" },
  { value: "daily", label: "Dagelijks", desc: "Elke dag" },
  { value: "custom", label: "Aangepast", desc: "Stel zelf de frequentie in" },
];

const END_OPTIONS = [
  { value: "never", label: "Geen einddatum" },
  { value: "date", label: "Tot een datum" },
  { value: "count", label: "Na X keer" },
];

export function StepDateTime({ form, updateForm, venues = [] }: StepDateTimeProps) {
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
        <h2 className="text-xl font-display font-bold text-foreground">Datum & locatie</h2>
        <p className="text-sm text-muted-foreground">Wanneer en waar vindt je evenement plaats? Tip: kies een opgeslagen locatie voor één-klik invullen.</p>
      </div>

      {/* Date & Time */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="w-4 h-4 text-primary" />
          Datum & tijd
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Startdatum <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Einddatum</Label>
            <Input type="date" value={form.endDate} onChange={(e) => updateForm({ endDate: e.target.value })} min={form.startDate || undefined} />
            {form.endDate && form.startDate && form.endDate < form.startDate ? (
              <p className="text-[11px] text-destructive">Einddatum moet op of na de startdatum liggen</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Alleen invullen voor meerdaagse events</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Starttijd <span className="text-destructive">*</span></Label>
            <Input type="time" value={form.startTime} onChange={(e) => updateForm({ startTime: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Eindtijd</Label>
            <Input type="time" value={form.endTime} onChange={(e) => updateForm({ endTime: e.target.value })} />
            <p className="text-[11px] text-muted-foreground">Automatisch gezet op +3u — pas aan indien gewenst</p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          Locatie
        </div>
        {venues.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Kies een opgeslagen locatie</Label>
            <Select value={form.venueId || "custom"} onValueChange={handleVenueSelect}>
              <SelectTrigger><SelectValue placeholder="Selecteer locatie" /></SelectTrigger>
              <SelectContent>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}{v.is_primary ? " ★" : ""}{v.city ? ` — ${v.city}` : ""}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Andere locatie invoeren...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {(!form.venueId || venues.length === 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Locatienaam</Label>
              <Input value={form.venue} onChange={(e) => updateForm({ venue: e.target.value })} placeholder="Bijv. Café De Kroeg" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Adres</Label>
              <Input value={form.address} onChange={(e) => updateForm({ address: e.target.value })} placeholder="Straat, Stad" />
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
              <p className="text-sm font-semibold text-foreground">Terugkerend evenement</p>
              <p className="text-xs text-muted-foreground">Automatisch herhalend op een vast schema</p>
            </div>
          </div>
          <Switch checked={form.isRecurring} onCheckedChange={(v) => updateForm({ isRecurring: v })} />
        </div>

        {form.isRecurring && (
          <div className="space-y-5 pt-4 border-t border-border">
            {/* Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium">Herhaling</Label>
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
                    <span className="text-[10px] opacity-70">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom frequency */}
            {isCustomFreq && (
              <div className="grid grid-cols-2 gap-4 bg-secondary/30 rounded-lg p-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Frequentie</Label>
                  <Select value={form.recurringCustomFreq || "weekly"} onValueChange={(v) => updateForm({ recurringCustomFreq: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Dagen</SelectItem>
                      <SelectItem value="weekly">Weken</SelectItem>
                      <SelectItem value="monthly">Maanden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Elke</Label>
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
                <Label className="text-xs text-muted-foreground">Op welke dag(en)</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day, i) => (
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
              <Label className="text-xs text-muted-foreground font-medium">Wanneer stopt de herhaling?</Label>
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
                  <Label className="text-xs text-muted-foreground">Einddatum herhaling</Label>
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
                  <Label className="text-xs text-muted-foreground">Aantal keer herhalen</Label>
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

            {/* Preview of generated dates */}
            {form.startDate && (
              <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Voorbeeld datums die gegenereerd worden:</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {generatePreviewDates(form).slice(0, 8).map((d, i) => (
                    <span key={i} className="text-[11px] bg-background rounded px-2 py-0.5 text-foreground border border-border">
                      {new Date(d).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  ))}
                  {generatePreviewDates(form).length > 8 && (
                    <span className="text-[11px] text-muted-foreground px-2 py-0.5">
                      +{generatePreviewDates(form).length - 8} meer
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

/** Generate preview dates based on form recurrence settings */
export function generatePreviewDates(form: EventFormState): string[] {
  if (!form.startDate || !form.isRecurring) return [];

  const start = new Date(form.startDate);
  const dates: string[] = [];
  const maxDates = form.recurringEndType === "count" ? (form.recurringEndCount || 10) : 52;
  const endDate = form.recurringEndType === "date" && form.recurringEndDate
    ? new Date(form.recurringEndDate)
    : null;

  const freq = form.recurringFreq === "custom"
    ? (form.recurringCustomFreq || "weekly")
    : form.recurringFreq;
  const interval = form.recurringFreq === "custom" || form.recurringFreq === "weekly"
    ? form.recurringInterval
    : 1;

  let current = new Date(start);
  for (let i = 0; i < maxDates * 7 && dates.length < maxDates; i++) {
    if (endDate && current > endDate) break;

    if (freq === "weekly" && form.recurringDays.length > 0) {
      // For weekly with specific days
      const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay(); // 1=Ma, 7=Zo
      if (form.recurringDays.includes(dayOfWeek) && current >= start) {
        dates.push(current.toISOString().split("T")[0]);
      }
      current.setDate(current.getDate() + 1);
      // Skip weeks based on interval
      if (dayOfWeek === 7 && interval > 1) {
        current.setDate(current.getDate() + (interval - 1) * 7);
      }
    } else if (freq === "daily") {
      if (current >= start) dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + interval);
    } else if (freq === "weekly") {
      if (current >= start) dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 7 * interval);
    } else if (freq === "monthly") {
      if (current >= start) dates.push(current.toISOString().split("T")[0]);
      current.setMonth(current.getMonth() + interval);
    } else {
      break;
    }
  }

  return dates;
}
