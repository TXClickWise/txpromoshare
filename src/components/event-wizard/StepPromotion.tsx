import { Megaphone, Link as LinkIcon, Hash, MessageSquare, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { AiFieldActions } from "./AiFieldActions";
import { AiAssistButton } from "@/components/AiAssistButton";
import { useAiAssist } from "@/hooks/useAiAssist";
import type { EventFormState } from "./useEventForm";
import { useTranslation } from "@/hooks/useUILanguage";

interface StepPromotionProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
}

export function StepPromotion({ form, updateForm }: StepPromotionProps) {
  const { t } = useTranslation();
  const { run, loading } = useAiAssist();
  const eventContext = { title: form.title, category: "", description: form.shortDescription };

  const handleGenerateSeo = () => {
    run({
      task: "generate_seo",
      context: { title: form.title, description: form.shortDescription, venue: form.venue, date: form.startDate },
      onResult: (result) => {
        if (result.seoTitle) updateForm({ seoTitle: result.seoTitle });
        if (result.seoDescription) updateForm({ seoDescription: result.seoDescription });
      },
    });
  };

  const handleGenerateShareTexts = () => {
    run({
      task: "generate_share_texts",
      context: { title: form.title, description: form.shortDescription, date: form.startDate, url: `https://txeventshare.nl/e/${form.slug}` },
      onResult: (result) => {
        if (result.whatsappText) updateForm({ whatsappText: result.whatsappText });
        if (result.socialText) updateForm({ socialText: result.socialText });
      },
    });
  };

  const handleGenerateTags = () => {
    run({
      task: "generate_tags",
      context: { title: form.title, category: "", description: form.shortDescription },
      onResult: (result) => {
        if (result.tags) updateForm({ tags: result.tags });
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">{t("wizard.promotion.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("wizard.promotion.subtitle")}</p>
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <LinkIcon className="w-4 h-4 text-primary" />
          {t("wizard.promotion.cta")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t("wizard.promotion.ctaText")}</Label>
              <AiFieldActions
                fieldName="CTA knoptekst"
                currentText={form.ctaButtonText}
                onResult={(text) => updateForm({ ctaButtonText: text })}
                eventContext={eventContext}
                compact
              />
            </div>
            <Input value={form.ctaButtonText} onChange={(e) => updateForm({ ctaButtonText: e.target.value })} placeholder={t("wizard.promotion.ctaTextPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("wizard.promotion.ctaLink")}</Label>
            <Input value={form.ctaLink} onChange={(e) => updateForm({ ctaLink: e.target.value })} placeholder="https://..." type="url" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("wizard.promotion.ctaHelp")}</p>
      </div>

      {/* Tags */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Hash className="w-4 h-4 text-primary" />
            {t("wizard.promotion.tags")}
          </div>
          {form.title && (
            <AiAssistButton onClick={handleGenerateTags} loading={loading === "generate_tags"} label={t("wizard.ai.generate")} />
          )}
        </div>
        <Input value={form.tags} onChange={(e) => updateForm({ tags: e.target.value })} placeholder={t("wizard.promotion.tagsPlaceholder")} />
        <p className="text-xs text-muted-foreground">{t("wizard.promotion.tagsHelp")}</p>
      </div>

      {/* Share texts */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare className="w-4 h-4 text-primary" />
            {t("wizard.promotion.shareTexts")}
          </div>
          {form.title && (
            <AiAssistButton onClick={handleGenerateShareTexts} loading={loading === "generate_share_texts"} label={t("wizard.promotion.generateAll")} />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t("wizard.promotion.whatsapp")}</Label>
            <AiFieldActions
              fieldName="WhatsApp tekst"
              currentText={form.whatsappText}
              onResult={(text) => updateForm({ whatsappText: text })}
              eventContext={eventContext}
              compact
            />
          </div>
          <Textarea value={form.whatsappText} onChange={(e) => updateForm({ whatsappText: e.target.value })} placeholder={`Check dit event: ${form.title}`} rows={2} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t("wizard.promotion.social")}</Label>
            <AiFieldActions
              fieldName="social media tekst"
              currentText={form.socialText}
              onResult={(text) => updateForm({ socialText: text })}
              eventContext={eventContext}
              compact
            />
          </div>
          <Textarea value={form.socialText} onChange={(e) => updateForm({ socialText: e.target.value })} placeholder={`${form.title} — kom je ook?`} rows={2} />
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SearchIcon className="w-4 h-4 text-primary" />
            {t("wizard.promotion.seoUrl")}
          </div>
          {form.title && (
            <AiAssistButton onClick={handleGenerateSeo} loading={loading === "generate_seo"} label={t("wizard.ai.generate")} />
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t("wizard.promotion.slug")}</Label>
          <div className="flex items-center gap-0">
            <span className="text-xs text-muted-foreground bg-secondary px-3 py-2.5 rounded-l-lg border border-r-0 border-border whitespace-nowrap">txeventshare.nl/e/</span>
            <Input value={form.slug} onChange={(e) => updateForm({ slug: e.target.value })} className="rounded-l-none" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t("wizard.promotion.seoTitle")}</Label>
            <AiFieldActions
              fieldName="SEO titel"
              currentText={form.seoTitle}
              onResult={(text) => updateForm({ seoTitle: text })}
              eventContext={eventContext}
              compact
            />
          </div>
          <Input value={form.seoTitle} onChange={(e) => updateForm({ seoTitle: e.target.value })} placeholder={form.title || "SEO titel"} maxLength={60} />
          <p className="text-xs text-muted-foreground">{form.seoTitle.length}/60</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t("wizard.promotion.seoDescription")}</Label>
            <AiFieldActions
              fieldName="SEO beschrijving"
              currentText={form.seoDescription}
              onResult={(text) => updateForm({ seoDescription: text })}
              eventContext={eventContext}
              compact
            />
          </div>
          <Textarea value={form.seoDescription} onChange={(e) => updateForm({ seoDescription: e.target.value })} placeholder={form.shortDescription || "SEO beschrijving"} rows={2} maxLength={160} />
          <p className="text-xs text-muted-foreground">{form.seoDescription.length}/160</p>
        </div>
      </div>
    </motion.div>
  );
}
