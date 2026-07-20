import { useState } from "react";
import { Sparkles, Loader2, Languages, Check, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CONTENT_LANGUAGES,
  type ContentLanguageCode,
  getContentLanguageMeta,
} from "@/lib/i18n/languages";
import {
  useEventTranslations,
  type EventTranslationFields,
} from "@/hooks/useEventTranslations";
import { ContentLanguageTabs } from "./ContentLanguageTabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SourceFields extends Partial<EventTranslationFields> {}

interface EventTranslationPanelProps {
  eventId: string;
  tenantId: string;
  /** Dutch source content from the saved event. */
  source: SourceFields;
  /** Whether the user has a plan that allows AI translation. */
  aiTranslationEnabled?: boolean;
}

/**
 * Manages translations for a single event.
 * - NL is always the source (read-only here).
 * - For other languages: tab → form → AI translate → manual edits → save.
 */
export function EventTranslationPanel({
  eventId,
  tenantId,
  source,
  aiTranslationEnabled = true,
}: EventTranslationPanelProps) {
  const { translations, upsertTranslation, deleteTranslation, getTranslation } =
    useEventTranslations(eventId);
  const [activeLang, setActiveLang] = useState<ContentLanguageCode>("nl");
  const [draft, setDraft] = useState<EventTranslationFields | null>(null);
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const translatedLangs = translations.map((t) => t.language_code);
  const currentTranslation = getTranslation(activeLang);

  // Hydrate draft when switching tabs
  const handleSwitchLang = (lang: ContentLanguageCode) => {
    setActiveLang(lang);
    if (lang === "nl") {
      setDraft(null);
      return;
    }
    const existing = getTranslation(lang);
    setDraft({
      title: existing?.title ?? "",
      subtitle: existing?.subtitle ?? "",
      short_description: existing?.short_description ?? "",
      full_description: existing?.full_description ?? "",
      cta_button_text: existing?.cta_button_text ?? "",
      whatsapp_share_text: existing?.whatsapp_share_text ?? "",
      social_share_text: existing?.social_share_text ?? "",
      seo_title: existing?.seo_title ?? "",
      seo_description: existing?.seo_description ?? "",
      slug: existing?.slug ?? "",
    });
  };

  const updateDraft = (updates: Partial<EventTranslationFields>) =>
    setDraft((d) => (d ? { ...d, ...updates } : d));

  const performTranslate = async () => {
    if (activeLang === "nl") return;
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-event", {
        body: {
          targetLanguage: activeLang,
          source: {
            title: source.title ?? null,
            subtitle: source.subtitle ?? null,
            short_description: source.short_description ?? null,
            full_description: source.full_description ?? null,
            cta_button_text: source.cta_button_text ?? null,
            whatsapp_share_text: source.whatsapp_share_text ?? null,
            social_share_text: source.social_share_text ?? null,
            seo_title: source.seo_title ?? null,
            seo_description: source.seo_description ?? null,
          },
        },
      });
      if (error) throw error;
      const t = data?.translation as EventTranslationFields | undefined;
      if (!t) throw new Error("Geen vertaling ontvangen");
      setDraft({
        title: t.title ?? "",
        subtitle: t.subtitle ?? "",
        short_description: t.short_description ?? "",
        full_description: t.full_description ?? "",
        cta_button_text: t.cta_button_text ?? "",
        whatsapp_share_text: t.whatsapp_share_text ?? "",
        social_share_text: t.social_share_text ?? "",
        seo_title: t.seo_title ?? "",
        seo_description: t.seo_description ?? "",
        slug: draft?.slug ?? "",
      });
      // Auto-save AI result so the indicator dot lights up immediately
      await upsertTranslation(tenantId, activeLang, t, { isAiGenerated: true });
      toast.success(`Vertaald naar ${getContentLanguageMeta(activeLang).nativeLabel}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Vertaling mislukt";
      toast.error(msg);
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateClick = () => {
    if (currentTranslation) {
      setConfirmOverwrite(true);
    } else {
      void performTranslate();
    }
  };

  const handleSave = async () => {
    if (!draft || activeLang === "nl") return;
    setSaving(true);
    try {
      await upsertTranslation(tenantId, activeLang, draft, { isAiGenerated: false });
      toast.success("Vertaling opgeslagen");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Opslaan mislukt";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (activeLang === "nl") return;
    try {
      await deleteTranslation(activeLang);
      setDraft({
        title: "",
        subtitle: "",
        short_description: "",
        full_description: "",
        cta_button_text: "",
        whatsapp_share_text: "",
        social_share_text: "",
        seo_title: "",
        seo_description: "",
        slug: "",
      });
      toast.success("Vertaling verwijderd");
    } catch {
      toast.error("Verwijderen mislukt");
    }
  };

  const sourceFieldRow = (label: string, value: string | null | undefined, multi = false) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div
        className={`text-sm rounded-lg border border-border bg-secondary/40 px-3 py-2 text-foreground/80 ${
          multi ? "whitespace-pre-wrap" : "truncate"
        }`}
      >
        {value || <span className="text-muted-foreground italic">— leeg —</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-display font-semibold">Vertalingen</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nederlands is de bron. Vertaal naar Frysk, Duits of Engels — pas daarna handmatig aan.
          </p>
        </div>
        {currentTranslation && (
          <div className="flex items-center gap-2">
            {currentTranslation.is_ai_generated ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" /> AI
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs">
                <Check className="h-3 w-3" /> Handmatig
              </Badge>
            )}
          </div>
        )}
      </div>

      <ContentLanguageTabs
        value={activeLang}
        onChange={handleSwitchLang}
        translatedLanguages={translatedLangs}
      />

      {activeLang === "nl" ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Dit is de bron-taal. Pas de Nederlandse content aan in de hoofdvelden van het event.
          </p>
          {sourceFieldRow("Titel", source.title)}
          {sourceFieldRow("Korte beschrijving", source.short_description, true)}
          {sourceFieldRow("CTA knoptekst", source.cta_button_text)}
        </div>
      ) : (
        <div className="space-y-4">
          {/* AI translate bar */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 flex-wrap">
            <div className="text-xs text-foreground/80 max-w-md">
              <strong>1 klik vertalen:</strong> AI vult alle velden in op basis van de
              Nederlandse content. Je kunt elk veld daarna bewerken.
            </div>
            <Button
              size="sm"
              onClick={handleTranslateClick}
              disabled={translating || !aiTranslationEnabled}
              className="gap-2"
            >
              {translating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {currentTranslation ? "Opnieuw vertalen" : `Vertaal naar ${getContentLanguageMeta(activeLang).nativeLabel}`}
            </Button>
          </div>

          {!aiTranslationEnabled && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/70" />
              <span>
                AI-vertaling zit standaard in <strong>Pro</strong>. Op je huidige plan kun je
                vertalingen handmatig invoeren en opslaan.
              </span>
            </div>
          )}

          {draft && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Source column */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="text-sm font-medium text-foreground font-medium">
                  Bron — Nederlands
                </div>
                {sourceFieldRow("Titel", source.title)}
                {sourceFieldRow("Subtitel", source.subtitle)}
                {sourceFieldRow("Korte beschrijving", source.short_description, true)}
                {sourceFieldRow("CTA knoptekst", source.cta_button_text)}
                {sourceFieldRow("WhatsApp tekst", source.whatsapp_share_text, true)}
                {sourceFieldRow("Social tekst", source.social_share_text, true)}
                {sourceFieldRow("SEO titel", source.seo_title)}
                {sourceFieldRow("SEO beschrijving", source.seo_description, true)}
              </div>

              {/* Translation column */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground font-medium">
                    {getContentLanguageMeta(activeLang).nativeLabel}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Titel</Label>
                  <Input
                    value={draft.title ?? ""}
                    onChange={(e) => updateDraft({ title: e.target.value })}
                    placeholder="Translated title"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Subtitel</Label>
                  <Input
                    value={draft.subtitle ?? ""}
                    onChange={(e) => updateDraft({ subtitle: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Korte beschrijving</Label>
                  <Textarea
                    rows={2}
                    value={draft.short_description ?? ""}
                    onChange={(e) => updateDraft({ short_description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">CTA knoptekst</Label>
                  <Input
                    value={draft.cta_button_text ?? ""}
                    onChange={(e) => updateDraft({ cta_button_text: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">WhatsApp tekst</Label>
                  <Textarea
                    rows={2}
                    value={draft.whatsapp_share_text ?? ""}
                    onChange={(e) => updateDraft({ whatsapp_share_text: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Social tekst</Label>
                  <Textarea
                    rows={2}
                    value={draft.social_share_text ?? ""}
                    onChange={(e) => updateDraft({ social_share_text: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">SEO titel (max 60)</Label>
                  <Input
                    maxLength={60}
                    value={draft.seo_title ?? ""}
                    onChange={(e) => updateDraft({ seo_title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">SEO beschrijving (max 160)</Label>
                  <Textarea
                    rows={2}
                    maxLength={160}
                    value={draft.seo_description ?? ""}
                    onChange={(e) => updateDraft({ seo_description: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  {currentTranslation ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      className="text-destructive hover:text-destructive gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Verwijder
                    </Button>
                  ) : (
                    <span />
                  )}
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Opslaan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm overwrite */}
      <AlertDialog open={confirmOverwrite} onOpenChange={setConfirmOverwrite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestaande vertaling overschrijven?</AlertDialogTitle>
            <AlertDialogDescription>
              Je hebt al een vertaling voor {getContentLanguageMeta(activeLang).nativeLabel}.
              Een nieuwe AI-vertaling vervangt de huidige inhoud.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOverwrite(false);
                void performTranslate();
              }}
            >
              Ja, opnieuw vertalen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vertaling verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze taalversie wordt verwijderd. Bezoekers vallen automatisch terug op de Nederlandse content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDelete(false);
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
