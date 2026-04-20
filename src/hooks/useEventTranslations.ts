import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ContentLanguageCode } from "@/lib/i18n/languages";

export interface EventTranslation {
  id: string;
  event_id: string;
  tenant_id: string;
  language_code: ContentLanguageCode;
  title: string | null;
  subtitle: string | null;
  short_description: string | null;
  full_description: string | null;
  cta_button_text: string | null;
  whatsapp_share_text: string | null;
  social_share_text: string | null;
  seo_title: string | null;
  seo_description: string | null;
  slug: string | null;
  is_ai_generated: boolean;
  ai_generated_at: string | null;
  updated_at: string;
}

export type EventTranslationFields = Omit<
  EventTranslation,
  "id" | "event_id" | "tenant_id" | "language_code" | "is_ai_generated" | "ai_generated_at" | "updated_at"
>;

export function useEventTranslations(eventId: string | undefined) {
  const [translations, setTranslations] = useState<EventTranslation[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!eventId) {
      setTranslations([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("event_translations")
      .select("*")
      .eq("event_id", eventId);
    if (!error && data) setTranslations(data as EventTranslation[]);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const upsertTranslation = useCallback(
    async (
      tenantId: string,
      languageCode: ContentLanguageCode,
      fields: Partial<EventTranslationFields>,
      meta?: { isAiGenerated?: boolean },
    ) => {
      if (!eventId) return null;
      const payload = {
        event_id: eventId,
        tenant_id: tenantId,
        language_code: languageCode,
        ...fields,
        ...(meta?.isAiGenerated
          ? { is_ai_generated: true, ai_generated_at: new Date().toISOString() }
          : { is_ai_generated: false }),
      };
      const { data, error } = await supabase
        .from("event_translations")
        .upsert(payload, { onConflict: "event_id,language_code" })
        .select()
        .single();
      if (error) throw error;
      await reload();
      return data as EventTranslation;
    },
    [eventId, reload],
  );

  const deleteTranslation = useCallback(
    async (languageCode: ContentLanguageCode) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("event_translations")
        .delete()
        .eq("event_id", eventId)
        .eq("language_code", languageCode);
      if (error) throw error;
      await reload();
    },
    [eventId, reload],
  );

  const getTranslation = useCallback(
    (languageCode: ContentLanguageCode) =>
      translations.find((t) => t.language_code === languageCode) ?? null,
    [translations],
  );

  return { translations, loading, reload, upsertTranslation, deleteTranslation, getTranslation };
}

/** Pure helper: returns localized value with NL fallback. */
export function getLocalizedField<T extends Record<string, unknown>>(
  source: T,
  translation: EventTranslation | null,
  field: keyof EventTranslationFields & keyof T,
): string {
  const translated = translation?.[field];
  if (typeof translated === "string" && translated.trim().length > 0) {
    return translated;
  }
  const fallback = source[field];
  return typeof fallback === "string" ? fallback : "";
}
