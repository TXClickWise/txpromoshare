import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";

interface StepBasicsProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
  categories: Pick<Tables<"categories">, "id" | "name" | "slug">[];
}

export function StepBasics({ form, updateForm, categories }: StepBasicsProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">De basis van je event</h2>
        <p className="text-sm text-muted-foreground">Geef je evenement een naam en beschrijving. De rest kun je later altijd aanvullen.</p>
      </div>

      <div className="space-y-5">
        {/* Title - prominent */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Evenement titel *</Label>
          <Input
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder="Bijv. Live Jazz Avond"
            className="text-lg font-display font-semibold h-12 border-primary/20 focus:border-primary"
            autoFocus
          />
        </div>

        {/* Category + Organizer row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categorie</Label>
            <Select value={form.category} onValueChange={(v) => updateForm({ category: v })}>
              <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Organisator</Label>
            <Input value={form.organizer} onChange={(e) => updateForm({ organizer: e.target.value })} placeholder="Naam organisator" />
          </div>
        </div>

        {/* Short description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Korte beschrijving</Label>
          <Textarea
            value={form.shortDescription}
            onChange={(e) => updateForm({ shortDescription: e.target.value })}
            placeholder="Beschrijf je event in 1-2 zinnen (max 160 tekens)"
            rows={2}
            maxLength={160}
          />
          <p className="text-[11px] text-muted-foreground">{form.shortDescription.length}/160 tekens — wordt getoond in overzichten en deelberichten</p>
        </div>

        {/* Subtitle - optional, collapsed feel */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Ondertitel <span className="text-xs">(optioneel)</span></Label>
          <Input value={form.subtitle} onChange={(e) => updateForm({ subtitle: e.target.value })} placeholder="Optionele ondertitel" />
        </div>

        {/* Full description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Volledige beschrijving</Label>
          <Textarea
            value={form.fullDescription}
            onChange={(e) => updateForm({ fullDescription: e.target.value })}
            placeholder="Uitgebreide beschrijving voor de evenementpagina..."
            rows={5}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tags</Label>
          <Input value={form.tags} onChange={(e) => updateForm({ tags: e.target.value })} placeholder="bijv. live-muziek, DJ, 80s, retro" />
          <p className="text-[11px] text-muted-foreground">Gescheiden door komma's, zonder # teken. Bijv: <span className="font-mono bg-secondary px-1 rounded">live-muziek, DJ, feest</span></p>
        </div>
      </div>
    </motion.div>
  );
}
