import { Megaphone, Link as LinkIcon, Hash, MessageSquare, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { AiAssistButton } from "@/components/AiAssistButton";
import { useAiAssist } from "@/hooks/useAiAssist";
import type { EventFormState } from "./useEventForm";

interface StepPromotionProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
}

export function StepPromotion({ form, updateForm }: StepPromotionProps) {
  const { run, loading } = useAiAssist();

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
        <h2 className="text-xl font-display font-bold text-foreground">Promotie</h2>
        <p className="text-sm text-muted-foreground">Stel je CTA, deelteksten en SEO in voor maximaal bereik.</p>
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <LinkIcon className="w-4 h-4 text-primary" />
          Call-to-Action knop
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Knoptekst</Label>
            <Input value={form.ctaButtonText} onChange={(e) => updateForm({ ctaButtonText: e.target.value })} placeholder="Reserveer nu" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Link</Label>
            <Input value={form.ctaLink} onChange={(e) => updateForm({ ctaLink: e.target.value })} placeholder="https://..." type="url" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Deze knop wordt prominent getoond op de evenementpagina</p>
      </div>

      {/* Tags */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Hash className="w-4 h-4 text-primary" />
            Tags
          </div>
          {form.title && (
            <AiAssistButton onClick={handleGenerateTags} loading={loading === "generate_tags"} label="Genereer" />
          )}
        </div>
        <Input value={form.tags} onChange={(e) => updateForm({ tags: e.target.value })} placeholder="bijv. live-muziek, DJ, 80s, retro" />
        <p className="text-[11px] text-muted-foreground">Gescheiden door komma's, zonder #. Helpen bij zoeken en ontdekken.</p>
      </div>

      {/* Share texts */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare className="w-4 h-4 text-primary" />
            Deelteksten
          </div>
          {form.title && (
            <AiAssistButton onClick={handleGenerateShareTexts} loading={loading === "generate_share_texts"} label="Genereer" />
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

      {/* SEO */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SearchIcon className="w-4 h-4 text-primary" />
            SEO & URL
          </div>
          {form.title && (
            <AiAssistButton onClick={handleGenerateSeo} loading={loading === "generate_seo"} label="Genereer" />
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
          <p className="text-[11px] text-muted-foreground">{form.seoTitle.length}/60</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">SEO beschrijving (max 160 tekens)</Label>
          <Textarea value={form.seoDescription} onChange={(e) => updateForm({ seoDescription: e.target.value })} placeholder={form.shortDescription || "SEO beschrijving"} rows={2} maxLength={160} />
          <p className="text-[11px] text-muted-foreground">{form.seoDescription.length}/160</p>
        </div>
      </div>
    </motion.div>
  );
}
