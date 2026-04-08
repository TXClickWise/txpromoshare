import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AiTask =
  | "generate_description"
  | "generate_seo"
  | "generate_share_texts"
  | "generate_tags"
  | "improve_text";

interface AiAssistOptions {
  task: AiTask;
  context: Record<string, string>;
  onResult?: (result: Record<string, string>) => void;
}

const PROMPTS: Record<AiTask, (ctx: Record<string, string>) => string> = {
  generate_description: (ctx) =>
    `Je bent een event-copywriter voor Nederlandse horeca. Schrijf een wervende korte beschrijving (max 160 tekens) EN een volledige beschrijving (2-3 alinea's) voor het volgende evenement.
Titel: ${ctx.title || "Onbekend"}
Categorie: ${ctx.category || "Overig"}
Organisator: ${ctx.organizer || ""}
Datum: ${ctx.date || ""}
Locatie: ${ctx.venue || ""}

Antwoord in JSON: {"shortDescription": "...", "fullDescription": "..."}`,

  generate_seo: (ctx) =>
    `Je bent een SEO-expert. Genereer een SEO-titel (max 60 tekens) en meta-beschrijving (max 160 tekens) voor dit evenement.
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

      // Parse JSON result if applicable
      if (task !== "improve_text") {
        try {
          const parsed = typeof result === "string" ? JSON.parse(result) : result;
          onResult?.(parsed);
          toast.success("AI-suggestie gegenereerd ✨");
          return parsed;
        } catch {
          // If JSON parsing fails, return raw
          onResult?.({ raw: result });
          return { raw: result };
        }
      } else {
        onResult?.({ text: result });
        toast.success("Tekst verbeterd ✨");
        return { text: result };
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
