import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { AiFieldActions } from "./AiFieldActions";
import { AiQuickStart } from "./AiQuickStart";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";

interface StepBasicsProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
  categories: Pick<Tables<"categories">, "id" | "name" | "slug">[];
}

export function StepBasics({ form, updateForm, categories }: StepBasicsProps) {
  const categoryName = categories.find((c) => c.id === form.category)?.name || "";
  const eventContext = { title: form.title, category: categoryName };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Basis</h2>
        <p className="text-sm text-muted-foreground">Begin met een pakkende titel — de rest vult zich vanzelf aan via slimme defaults.</p>
      </div>

      {/* AI Quick Start - only show for new events without title */}
      {!form.title.trim() && (
        <AiQuickStart updateForm={updateForm} categories={categories} />
      )}

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Evenement titel <span className="text-destructive">*</span></Label>
          <Input
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder="Bijv. Live Jazz Avond"
            className="text-lg font-display font-semibold h-12 border-primary/20 focus:border-primary"
            autoFocus
            maxLength={100}
          />
          <p className="text-[11px] text-muted-foreground">{form.title.length}/100 tekens</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">Ondertitel <span className="text-xs">(optioneel)</span></Label>
            <AiFieldActions
              fieldName="ondertitel"
              currentText={form.subtitle}
              onResult={(text) => updateForm({ subtitle: text })}
              eventContext={eventContext}
            />
          </div>
          <Input value={form.subtitle} onChange={(e) => updateForm({ subtitle: e.target.value })} placeholder="Bijv. met DJ Marco & Friends" />
        </div>

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
            <p className="text-[11px] text-muted-foreground">Wordt getoond op de evenementpagina</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Korte beschrijving</Label>
            <AiFieldActions
              fieldName="korte beschrijving"
              currentText={form.shortDescription}
              onResult={(text) => updateForm({ shortDescription: text })}
              eventContext={eventContext}
            />
          </div>
          <Textarea
            value={form.shortDescription}
            onChange={(e) => updateForm({ shortDescription: e.target.value })}
            placeholder="Beschrijf je event in 1-2 zinnen..."
            rows={2}
            maxLength={160}
          />
          <p className="text-[11px] text-muted-foreground">{form.shortDescription.length}/160 — wordt getoond in overzichten en deelberichten</p>
        </div>
      </div>
    </motion.div>
  );
}
