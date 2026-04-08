import { Globe, CalendarClock, Star, Send, Save, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AiAssistButton } from "@/components/AiAssistButton";
import { useAiAssist } from "@/hooks/useAiAssist";
import type { EventFormState } from "./useEventForm";

interface StepPublishProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
  isEditing: boolean;
  eventId?: string;
  saving: boolean;
  onSave: () => void;
  onPublish: () => void;
}

export function StepPublish({ form, updateForm, isEditing, eventId, saving, onSave, onPublish }: StepPublishProps) {
  const { run, loading } = useAiAssist();

  const handleGenerateSeo = () => {
    run({
      task: "generate_seo",
      context: {
        title: form.title,
        description: form.shortDescription,
        venue: "",
        date: form.startDate,
      },
      onResult: (result) => {
        if (result.seoTitle) updateForm({ seoTitle: result.seoTitle });
        if (result.seoDescription) updateForm({ seoDescription: result.seoDescription });
      },
    });
  };

  const handleGenerateShareTexts = () => {
    run({
      task: "generate_share_texts",
      context: {
        title: form.title,
        description: form.shortDescription,
        date: form.startDate,
        url: `https://txeventshare.nl/e/${form.slug}`,
      },
      onResult: (result) => {
        if (result.whatsappText) updateForm({ whatsappText: result.whatsappText });
        if (result.socialText) updateForm({ socialText: result.socialText });
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Publiceren & delen</h2>
        <p className="text-sm text-muted-foreground">Configureer SEO, deelteksten en publicatie-instellingen.</p>
      </div>

      {/* SEO */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">SEO & URL</p>
          {form.title && (
            <AiAssistButton
              onClick={handleGenerateSeo}
              loading={loading === "generate_seo"}
              label="Genereer SEO"
              tooltip="Genereer SEO-titel en beschrijving met AI"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">URL slug</Label>
          <div className="flex items-center gap-0">
            <span className="text-xs text-muted-foreground bg-secondary px-3 py-2.5 rounded-l-lg border border-r-0 border-border whitespace-nowrap">txeventshare.nl/e/</span>
            <Input value={form.slug} onChange={(e) => updateForm({ slug: e.target.value })} className="rounded-l-none" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">SEO titel (max 60 tekens)</Label>
          <Input value={form.seoTitle} onChange={(e) => updateForm({ seoTitle: e.target.value })} placeholder={form.title || "SEO titel"} maxLength={60} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">SEO beschrijving (max 160 tekens)</Label>
          <Textarea value={form.seoDescription} onChange={(e) => updateForm({ seoDescription: e.target.value })} placeholder={form.shortDescription || "SEO beschrijving"} rows={2} maxLength={160} />
        </div>
      </div>

      {/* Share texts */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Deelteksten</p>
          {form.title && (
            <AiAssistButton
              onClick={handleGenerateShareTexts}
              loading={loading === "generate_share_texts"}
              label="Genereer deelteksten"
              tooltip="Genereer WhatsApp en social media teksten met AI"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">WhatsApp tekst</Label>
          <Textarea value={form.whatsappText} onChange={(e) => updateForm({ whatsappText: e.target.value })} placeholder={`Check dit event: ${form.title}`} rows={2} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Social media tekst</Label>
          <Textarea value={form.socialText} onChange={(e) => updateForm({ socialText: e.target.value })} placeholder={`${form.title} — kom je ook?`} rows={2} />
        </div>
      </div>

      {/* Scheduling */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ingepland publiceren</p>
            <p className="text-xs text-muted-foreground">Optioneel: plan wanneer dit evenement automatisch live gaat</p>
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
            <p className="text-sm font-semibold text-foreground">Zichtbaarheid ontdekkingspagina</p>
            <p className="text-xs text-muted-foreground">Bepaal of dit event zichtbaar is op de publieke eventpagina</p>
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
          <div className="flex gap-2">
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
          <p className="text-[11px] text-muted-foreground">Pro-plan klanten krijgen 2 gratis boosts per maand.</p>
        </div>
      )}

      {/* Publish actions */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Klaar om te publiceren?</p>
        <p className="text-xs text-muted-foreground">
          {form.publishAt
            ? "Je evenement wordt ingepland en automatisch gepubliceerd op de ingestelde datum."
            : "Je evenement gaat direct live na publicatie."
          }
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Opslaan..." : "Opslaan als concept"}
          </Button>
          <Button onClick={onPublish} disabled={saving} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="w-4 h-4" />
            {form.publishAt ? "Inplannen" : "Publiceren"}
          </Button>
        </div>
      </div>

      {/* AI Assistant hint */}
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">✨</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">AI-assistent</p>
            <p className="text-xs text-muted-foreground">Gebruik de ✨-knoppen om beschrijvingen, SEO-teksten en deelteksten automatisch te genereren</p>
          </div>
        </div>
      </div>

      {/* Ticketing placeholder */}
      <div className="rounded-xl border border-dashed border-border p-5 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><span className="text-lg">🎟️</span></div>
          <div>
            <p className="text-sm font-medium text-foreground flex items-center gap-2">Ticketing<span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">Toekomstige module</span></p>
            <p className="text-xs text-muted-foreground">Ticketverkoop, QR-scanning & betalingen — binnenkort beschikbaar</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
