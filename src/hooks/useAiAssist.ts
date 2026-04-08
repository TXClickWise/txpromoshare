import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AiTask =
  | "generate_description"
  | "generate_seo"
  | "generate_share_texts"
  | "generate_tags"
  | "improve_text"
  | "quick_start"
  | "field_rewrite"
  | "pre_publish_check"
  | "distribution_content"
  | "rewrite_channel"
  | "stock_suggest";

interface AiAssistOptions {
  task: AiTask;
  context: Record<string, string>;
  onResult?: (result: Record<string, string>) => void;
}

const PROMPTS: Record<AiTask, (ctx: Record<string, string>) => string> = {
  generate_description: (ctx) =>
    `Schrijf een wervende korte beschrijving (max 160 tekens) EN een volledige beschrijving (2-3 alinea's) voor het volgende evenement.
Titel: ${ctx.title || "Onbekend"}
Categorie: ${ctx.category || "Overig"}
Organisator: ${ctx.organizer || ""}
Datum: ${ctx.date || ""}
Locatie: ${ctx.venue || ""}
${ctx.brandTone ? `Merktoon: ${ctx.brandTone}` : ""}

Antwoord in JSON: {"shortDescription": "...", "fullDescription": "..."}`,

  generate_seo: (ctx) =>
    `Genereer een SEO-titel (max 60 tekens) en meta-beschrijving (max 160 tekens) voor dit evenement.
Titel: ${ctx.title || "Onbekend"}
Beschrijving: ${ctx.description || ""}
Locatie: ${ctx.venue || ""}
Datum: ${ctx.date || ""}

Antwoord in JSON: {"seoTitle": "...", "seoDescription": "..."}`,

  generate_share_texts: (ctx) =>
    `Schrijf deelteksten voor social media en WhatsApp voor dit evenement. Wervend, kort, met emoji's.
Titel: ${ctx.title || "Onbekend"}
Beschrijving: ${ctx.description || ""}
Datum: ${ctx.date || ""}
URL: ${ctx.url || ""}
${ctx.brandTone ? `Merktoon: ${ctx.brandTone}` : ""}

Antwoord in JSON: {"whatsappText": "...", "socialText": "..."}`,

  generate_tags: (ctx) =>
    `Genereer 5-8 relevante tags (zonder #) voor dit evenement, gescheiden door komma's.
Titel: ${ctx.title || "Onbekend"}
Categorie: ${ctx.category || ""}
Beschrijving: ${ctx.description || ""}

Antwoord in JSON: {"tags": "tag1, tag2, tag3, ..."}`,

  improve_text: (ctx) =>
    `Verbeter de volgende tekst. Maak het wervender en professioneler, maar behoud de kern. Antwoord alleen met de verbeterde tekst, geen uitleg.

Tekst: ${ctx.text || ""}`,

  quick_start: (ctx) =>
    `Genereer een compleet event-voorstel op basis van dit idee:

"${ctx.idea || ""}"

${ctx.brandTone ? `Merktoon: ${ctx.brandTone}` : ""}
${ctx.brandSummary ? `Merkomschrijving: ${ctx.brandSummary}` : ""}
${ctx.organizer ? `Organisator: ${ctx.organizer}` : ""}`,

  field_rewrite: (ctx) =>
    `${ctx.instruction || "Verbeter de tekst"}

Veld: ${ctx.fieldName || "tekst"}
Huidige tekst: "${ctx.text || ""}"

Context:
- Event: ${ctx.title || ""}
- Categorie: ${ctx.category || ""}
${ctx.brandTone ? `- Merktoon: ${ctx.brandTone}` : ""}`,

  pre_publish_check: (ctx) =>
    `Analyseer dit evenement en geef kwaliteitsfeedback:

Titel: ${ctx.title || ""}
Ondertitel: ${ctx.subtitle || "(geen)"}
Korte beschrijving: ${ctx.shortDescription || "(geen)"}
Volledige beschrijving: ${ctx.fullDescription || "(geen)"}
Categorie: ${ctx.category || "(geen)"}
Datum: ${ctx.startDate || "(geen)"}
Locatie: ${ctx.venue || "(geen)"}
CTA: ${ctx.ctaText || "(geen)"} → ${ctx.ctaLink || "(geen)"}
Tags: ${ctx.tags || "(geen)"}
SEO titel: ${ctx.seoTitle || "(geen)"}
SEO beschrijving: ${ctx.seoDescription || "(geen)"}
Heeft afbeelding: ${ctx.hasImage || "nee"}
WhatsApp tekst: ${ctx.whatsappText || "(geen)"}
Social tekst: ${ctx.socialText || "(geen)"}
${ctx.brandTone ? `Merktoon: ${ctx.brandTone}` : ""}`,

  distribution_content: (ctx) => ctx.prompt || "",
  rewrite_channel: (ctx) => ctx.prompt || "",

  stock_suggest: (ctx) =>
    `Suggereer zoektermen voor stockfoto's voor dit evenement:

Titel: ${ctx.title || ""}
Categorie: ${ctx.category || ""}
Beschrijving: ${ctx.description || ""}
${ctx.brandStyle ? `Beeldstijl: ${ctx.brandStyle}` : ""}`,
};

export function useAiAssist() {
  const [loading, setLoading] = useState<AiTask | null>(null);

  async function run({ task, context, onResult }: AiAssistOptions) {
    setLoading(task);
    try {
      const prompt = PROMPTS[task](context);

      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: { prompt, task },
      });

      if (error) throw error;

      const result = data?.result;
      if (!result) throw new Error("Geen resultaat ontvangen");

      // Tasks that return plain text
      if (task === "improve_text" || task === "field_rewrite" || task === "rewrite_channel") {
        onResult?.({ text: result });
        toast.success("Tekst gegenereerd ✨");
        return { text: result };
      }

      // All other tasks return JSON
      try {
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        onResult?.(parsed);
        toast.success("AI-suggestie gegenereerd ✨");
        return parsed;
      } catch {
        onResult?.({ raw: result });
        return { raw: result };
      }
    } catch (err: any) {
      console.error("AI assist error:", err);
      toast.error("AI-assistent is momenteel niet beschikbaar. Probeer het later opnieuw.");
      return null;
    } finally {
      setLoading(null);
    }
  }

  return { run, loading };
}
