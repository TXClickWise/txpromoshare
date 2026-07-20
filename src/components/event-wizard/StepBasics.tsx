import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { AiFieldActions } from "./AiFieldActions";
import { AiQuickStart } from "./AiQuickStart";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";
import { useTranslation } from "@/hooks/useUILanguage";

interface StepBasicsProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
  categories: Pick<Tables<"categories">, "id" | "name" | "slug">[];
}

export function StepBasics({ form, updateForm, categories }: StepBasicsProps) {
  const { t } = useTranslation();
  const categoryName = categories.find((c) => c.id === form.category)?.name || "";
  const eventContext = { title: form.title, category: categoryName };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">{t("wizard.basics.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("wizard.basics.subtitle")}</p>
      </div>

      {/* AI Quick Start - only show for new events without title */}
      {!form.title.trim() && (
        <AiQuickStart updateForm={updateForm} categories={categories} />
      )}

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("wizard.basics.eventTitle")} <span className="text-destructive">*</span></Label>
          <Input
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder={t("wizard.basics.eventTitlePlaceholder")}
            className="text-lg font-display font-semibold h-12 border-primary/20 focus:border-primary"
            autoFocus
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">{t("wizard.basics.chars", { current: String(form.title.length), max: "100" })}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">{t("wizard.basics.subtitleLabel")} <span className="text-xs">({t("common.optional")})</span></Label>
            <AiFieldActions
              fieldName="ondertitel"
              currentText={form.subtitle}
              onResult={(text) => updateForm({ subtitle: text })}
              eventContext={eventContext}
            />
          </div>
          <Input value={form.subtitle} onChange={(e) => updateForm({ subtitle: e.target.value })} placeholder={t("wizard.basics.subtitlePlaceholder")} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("wizard.basics.category")}</Label>
            <Select value={form.category} onValueChange={(v) => updateForm({ category: v })}>
              <SelectTrigger><SelectValue placeholder={t("wizard.basics.categoryPlaceholder")} /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("wizard.basics.organizer")}</Label>
            <Input value={form.organizer} onChange={(e) => updateForm({ organizer: e.target.value })} placeholder={t("wizard.basics.organizerPlaceholder")} />
            <p className="text-xs text-muted-foreground">{t("wizard.basics.organizerHelp")}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t("wizard.basics.shortDescription")}</Label>
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
            placeholder={t("wizard.basics.shortDescriptionPlaceholder")}
            rows={2}
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground">{t("wizard.basics.shortDescriptionHelp", { current: String(form.shortDescription.length) })}</p>
        </div>
      </div>
    </motion.div>
  );
}
