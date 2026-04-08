import { CalendarDays, MapPin, Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import type { EventFormState } from "./useEventForm";

interface StepDateTimeProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
}

export function StepDateTime({ form, updateForm }: StepDateTimeProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Wanneer & waar</h2>
        <p className="text-sm text-muted-foreground">Stel datum, tijd en locatie in voor je evenement.</p>
      </div>

      {/* Date & Time */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="w-4 h-4 text-primary" />
          Datum & tijd
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Startdatum *</Label>
            <Input type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Einddatum</Label>
            <Input type="date" value={form.endDate} onChange={(e) => updateForm({ endDate: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Starttijd *</Label>
            <Input type="time" value={form.startTime} onChange={(e) => updateForm({ startTime: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Eindtijd</Label>
            <Input type="time" value={form.endTime} onChange={(e) => updateForm({ endTime: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          Locatie
        </div>
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
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="text-sm font-semibold text-foreground">Call-to-Action knop</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Knoptekst</Label>
            <Input value={form.ctaButtonText} onChange={(e) => updateForm({ ctaButtonText: e.target.value })} placeholder="Reserveer nu" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Link</Label>
            <Input value={form.ctaLink} onChange={(e) => updateForm({ ctaLink: e.target.value })} placeholder="https://..." />
          </div>
        </div>
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
          <div className="space-y-4 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Frequentie</Label>
                <Select value={form.recurringFreq} onValueChange={(v) => updateForm({ recurringFreq: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Dagelijks</SelectItem>
                    <SelectItem value="weekly">Wekelijks</SelectItem>
                    <SelectItem value="biweekly">Om de 2 weken</SelectItem>
                    <SelectItem value="monthly">Maandelijks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Elke X keer</Label>
                <Input type="number" min={1} max={12} value={form.recurringInterval} onChange={(e) => updateForm({ recurringInterval: Number(e.target.value) })} />
              </div>
            </div>
            {form.recurringFreq === "weekly" && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Op welke dag(en)</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => updateForm({ recurringDays: form.recurringDays.includes(i + 1) ? form.recurringDays.filter(d => d !== i + 1) : [...form.recurringDays, i + 1] })}
                      className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${form.recurringDays.includes(i + 1) ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Eindigt na datum (optioneel)</Label>
              <Input type="date" value={form.recurringEndDate} onChange={(e) => updateForm({ recurringEndDate: e.target.value })} className="max-w-xs" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
