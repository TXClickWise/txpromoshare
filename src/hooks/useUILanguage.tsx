import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_UI_LANGUAGE, type UILanguageCode, isUILanguage } from "@/lib/i18n/languages";
import { translate } from "@/lib/i18n/translations";
import { useAuth } from "@/hooks/useAuth";

interface UILanguageContextValue {
  language: UILanguageCode;
  setLanguage: (lang: UILanguageCode) => Promise<void>;
  t: (key: string, vars?: Record<string, string>) => string;
}

const UILanguageContext = createContext<UILanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "tx_ui_language";

function readStoredLanguage(): UILanguageCode {
  if (typeof window === "undefined") return DEFAULT_UI_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isUILanguage(stored) ? stored : DEFAULT_UI_LANGUAGE;
}

export function UILanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<UILanguageCode>(() => readStoredLanguage());

  // Load from profile when authenticated
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("ui_language")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const profileLang = data?.ui_language;
      if (profileLang && isUILanguage(profileLang)) {
        setLanguageState(profileLang);
        window.localStorage.setItem(STORAGE_KEY, profileLang);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const setLanguage = useCallback(
    async (lang: UILanguageCode) => {
      setLanguageState(lang);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
      }
      if (user?.id) {
        await supabase.from("profiles").update({ ui_language: lang }).eq("id", user.id);
      }
    },
    [user?.id],
  );

  // Sync html lang attribute
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = useMemo<UILanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language, setLanguage],
  );

  return <UILanguageContext.Provider value={value}>{children}</UILanguageContext.Provider>;
}

export function useUILanguage() {
  const ctx = useContext(UILanguageContext);
  if (!ctx) throw new Error("useUILanguage must be used within UILanguageProvider");
  return ctx;
}

/** Convenience hook that exposes only the translator. */
export function useTranslation() {
  const { t, language } = useUILanguage();
  return { t, language };
}
