import { useState } from "react";
import { Sparkles, Loader2, Wand2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAiAssist } from "@/hooks/useAiAssist";
import { useTenant } from "@/hooks/useTenant";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";

interface AiQuickStartProps {
  updateForm: (updates: Partial<EventFormState>) => void;
  categories: Pick<Tables<"categories">, "id" | "name" | "slug">[];
  onComplete?: () => void;
}

interface QuickStartResult {
  title?: string;
  subtitle?: string;
  shortDescription?: string;
  fullDescription?: string;
  categorySlug?: string;
  tags?: string;
  ctaText?: string;
  socialText?: string;
  whatsappText?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
}

export function AiQuickStart({ updateForm, categories, onComplete }: AiQuickStartProps) {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState<QuickStartResult | null>(null);
  const [showInput, setShowInput] = useState(false);
  const { run, loading } = useAiAssist();
  const { tenant } = useTenant();

  const handleGenerate = async () => {
    if (!idea.trim()) return;

    const res = await run({
      task: "quick_start",
      context: {
        idea: idea.trim(),
        brandTone: tenant?.tone_of_voice || "",
        brandSummary: tenant?.brand_summary || "",
        organizer: tenant?.name || "",
      },
    });

    if (res && !res.raw) {
      setResult(res);
    }
  };

  const handleApply = () => {
    if (!result) return;

    const matchedCategory = result.categorySlug
      ? categories.find(c => c.slug === result.categorySlug)
      : null;

    updateForm({
      title: result.title || "",
      subtitle: result.subtitle || "",
      shortDescription: result.shortDescription || "",
      fullDescription: result.fullDescription || "",
      category: matchedCategory?.id || "",
      tags: result.tags || "",
      ctaButtonText: result.ctaText || "Meer info",
      socialText: result.socialText || "",
      whatsappText: result.whatsappText || "",
      seoTitle: result.seoTitle || "",
      seoDescription: result.seoDescription || "",
      slug: result.slug || "",
    });

    setResult(null);
    setShowInput(false);
    setIdea("");
    onComplete?.();
  };

  if (!showInput && !result) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="w-full rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all p-4 flex items-center gap-3 group"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <Wand2 className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left min-w-0">
          <p className="text-sm font-display font-semibold text-foreground">AI Quick Start</p>
          <p className="text-xs text-muted-foreground">Beschrijf je eventidee en laat AI alles invullen</p>
        </div>
        <Sparkles className="w-4 h-4 text-primary/50 ml-auto shrink-0" />
      </button>
    );
  }

  if (result) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-display font-semibold text-foreground">AI Voorstel</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setResult(null); setShowInput(true); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-2 text-xs">
          {result.title && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Titel</span>
              <span className="text-foreground font-medium">{result.title}</span>
            </div>
          )}
          {result.subtitle && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Subtitel</span>
              <span className="text-foreground">{result.subtitle}</span>
            </div>
          )}
          {result.shortDescription && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Beschrijving</span>
              <span className="text-foreground">{result.shortDescription}</span>
            </div>
          )}
          {result.categorySlug && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Categorie</span>
              <span className="text-foreground">{result.categorySlug}</span>
            </div>
          )}
          {result.tags && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Tags</span>
              <span className="text-foreground">{result.tags}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleApply} className="gap-2">
            <Check className="w-3.5 h-3.5" />
            Toepassen
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading === "quick_start"} className="gap-2">
            {loading === "quick_start" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Opnieuw
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setResult(null); setShowInput(false); setIdea(""); }}>
            Annuleren
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">AI Quick Start</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowInput(false)}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      <Textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Beschrijf je event in een paar zinnen, bijv: Vrijdag live muziek met coverband, gezellige sfeer, aanvang 21:00, doelgroep 25+"
        rows={3}
        className="text-sm"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleGenerate} disabled={loading === "quick_start" || !idea.trim()} className="gap-2">
          {loading === "quick_start" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Genereer event
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setShowInput(false); setIdea(""); }}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
