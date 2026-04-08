import { Globe, CalendarClock, Star, Send, Save, Eye, ExternalLink, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AiPublishCheck } from "./AiPublishCheck";
import type { EventFormState, StepValidation } from "./useEventForm";

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
  const summary = [
    { label: "Titel", value: form.title, required: true },
    { label: "Datum", value: form.startDate ? new Date(form.startDate).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "", required: true },
    { label: "Tijd", value: [form.startTime?.slice(0, 5), form.endTime?.slice(0, 5)].filter(Boolean).join(" — "), required: true },
    { label: "Locatie", value: form.venue },
    { label: "Beschrijving", value: form.shortDescription ? `${form.shortDescription.slice(0, 80)}${form.shortDescription.length > 80 ? "..." : ""}` : "" },
  ];

  const isReady = validation.isValid;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Publiceren</h2>
        <p className="text-sm text-muted-foreground">Controleer je evenement en kies hoe je het wilt publiceren.</p>
      </div>

      {/* AI Publish Check */}
      <AiPublishCheck form={form} />

      {/* Preview summary */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Samenvatting
        </p>
        <div className="space-y-2">
          {summary.map((item) => (
            <div key={item.label} className="flex items-start gap-3 text-sm">
              <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{item.label}</span>
              <span className={`${item.value ? "text-foreground" : item.required ? "text-destructive" : "text-muted-foreground"}`}>
                {item.value || (item.required ? "⚠️ Niet ingevuld" : "—")}
              </span>
            </div>
          ))}
        </div>
        {form.featuredImageUrl && (
          <div className="mt-3">
            <img src={form.featuredImageUrl} alt="Preview" className="w-full max-w-xs rounded-lg border border-border aspect-video object-cover" />
          </div>
        )}
      </div>

      {/* Validation errors */}
      {!isReady && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Nog niet klaar om te publiceren
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
            <p className="text-sm font-semibold text-foreground">Ingepland publiceren</p>
            <p className="text-xs text-muted-foreground">Optioneel: kies een datum en tijd waarop het event automatisch live gaat</p>
          </div>
        </div>
        <Input type="datetime-local" value={form.publishAt} onChange={(e) => updateForm({ publishAt: e.target.value })} className="max-w-xs" />
        {form.publishAt && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => updateForm({ publishAt: "" })}>
            Wis datum — publiceer direct
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
            <p className="text-sm font-semibold text-foreground">Zichtbaarheid publieke lijst</p>
            <p className="text-xs text-muted-foreground">Bepaal of dit event zichtbaar is op de publieke ontdekkingspagina</p>
          </div>
        </div>
        <Select value={form.showOnDiscovery} onValueChange={(v) => updateForm({ showOnDiscovery: v })}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">Volg organisatie-instelling</SelectItem>
            <SelectItem value="show">Altijd tonen</SelectItem>
            <SelectItem value="hide">Altijd verbergen</SelectItem>
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
              <p className="text-sm font-semibold text-foreground">Evenement uitlichten</p>
              <p className="text-xs text-muted-foreground">Laat dit event opvallen op de ontdekkingspagina</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-2 border-highlight/50 hover:bg-highlight/10"
              onClick={async () => {
                const { data } = await supabase.functions.invoke("create-boost-checkout", { body: { eventId, boostDays: 7 } });
                if (data?.url) window.open(data.url, "_blank");
                else if (data?.success) toast.success("Boost geactiveerd met gratis credit! ⭐");
                else toast.error("Boost niet gelukt");
              }}>
              <Star className="w-3.5 h-3.5" />7 dagen — €6,95
            </Button>
            <Button size="sm" variant="outline" className="gap-2 border-highlight/50 hover:bg-highlight/10"
              onClick={async () => {
                const { data } = await supabase.functions.invoke("create-boost-checkout", { body: { eventId, boostDays: 14 } });
                if (data?.url) window.open(data.url, "_blank");
                else if (data?.success) toast.success("Boost geactiveerd met gratis credit! ⭐");
                else toast.error("Boost niet gelukt");
              }}>
              <Star className="w-3.5 h-3.5" />14 dagen — €12,95
            </Button>
          </div>
        </div>
      )}

      {/* Publish actions */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          {isReady ? "✅ Klaar om te publiceren" : "Sla eerst op als concept"}
        </p>
        <p className="text-xs text-muted-foreground">
          {form.publishAt
            ? "Je evenement wordt ingepland en automatisch gepubliceerd op de ingestelde datum."
            : "Je evenement gaat direct live na publicatie."
          }
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={onSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Opslaan..." : "Opslaan als concept"}
          </Button>
          <Button onClick={onPublish} disabled={saving || !isReady} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="w-4 h-4" />
            {form.publishAt ? "Inplannen" : "Publiceren"}
          </Button>
          {isEditing && eventId && (
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => window.open(`/e/${form.slug}`, "_blank")}>
              <ExternalLink className="w-3.5 h-3.5" />Preview
            </Button>
          )}
        </div>
      </div>

      {/* Ticketing placeholder */}
      <div className="rounded-xl border border-dashed border-border p-5 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><span className="text-lg">🎟️</span></div>
          <div>
            <p className="text-sm font-medium text-foreground flex items-center gap-2">Ticketing<span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">Binnenkort</span></p>
            <p className="text-xs text-muted-foreground">Ticketverkoop, QR-scanning & betalingen</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
