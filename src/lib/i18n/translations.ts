/**
 * UI string translations. Currently NL (default) and EN.
 * Keep keys hierarchical and short. Missing EN keys fall back to NL.
 */
import type { UILanguageCode } from "./languages";

export type TranslationDict = Record<string, string>;

export const UI_TRANSLATIONS: Record<UILanguageCode, TranslationDict> = {
  nl: {
    // Common
    "common.save": "Opslaan",
    "common.cancel": "Annuleren",
    "common.delete": "Verwijderen",
    "common.edit": "Bewerken",
    "common.loading": "Laden…",
    "common.saving": "Opslaan…",
    "common.saved": "Opgeslagen",
    "common.copy": "Kopiëren",
    "common.copied": "Gekopieerd",
    "common.close": "Sluiten",
    "common.back": "Terug",
    "common.next": "Volgende",
    "common.optional": "optioneel",
    "common.required": "verplicht",
    "common.signOut": "Uitloggen",
    "common.user": "Gebruiker",

    // Navigation (dashboard sidebar)
    "nav.dashboard": "Dashboard",
    "nav.events": "Evenementen",
    "nav.templates": "Sjablonen",
    "nav.distribution": "Delen & Posten",
    "nav.widgets": "Widgets",
    "nav.categories": "Categorieën",
    "nav.media": "Media",
    "nav.team": "Team",
    "nav.integrations": "Integraties",
    "nav.settings": "Instellingen",
    "nav.billing": "Abonnement",
    "nav.admin": "Admin",
    "nav.plan": "{plan} plan",

    // Public navigation (landing)
    "publicNav.home": "Home",
    "publicNav.benefits": "Voordelen",
    "publicNav.howItWorks": "Hoe het werkt",
    "publicNav.pricing": "Prijzen",
    "publicNav.demo": "Demo",
    "publicNav.events": "Evenementen",
    "publicNav.login": "Inloggen",
    "publicNav.startFree": "Start gratis",

    // Languages
    "lang.ui": "Interface-taal",
    "lang.content": "Content-taal",
    "lang.source": "Bron (Nederlands)",
    "lang.fallback": "Valt terug op Nederlands",
    "lang.translateTo": "Vertaal naar {lang}",
    "lang.translating": "Vertalen…",
    "lang.translateAll": "Vertaal alle velden",
    "lang.translationCreated": "Vertaling aangemaakt",
    "lang.translationUpdated": "Vertaling bijgewerkt",
    "lang.translationDeleted": "Vertaling verwijderd",
    "lang.aiGenerated": "AI-gegenereerd",
    "lang.lastEditedManually": "Handmatig aangepast",
    "lang.notTranslatedYet": "Nog niet vertaald",
    "lang.confirmOverwrite": "Bestaande vertaling overschrijven?",
    "lang.preview": "Live voorbeeld",
    "lang.interface": "Interface",

    // Settings
    "settings.language": "Taal",
    "settings.languageDescription": "Kies de taal van het dashboard. Je voorkeur wordt bewaard.",
  },
  en: {
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.loading": "Loading…",
    "common.saving": "Saving…",
    "common.saved": "Saved",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.close": "Close",
    "common.back": "Back",
    "common.next": "Next",
    "common.optional": "optional",
    "common.required": "required",
    "common.signOut": "Sign out",
    "common.user": "User",

    // Navigation (dashboard sidebar)
    "nav.dashboard": "Dashboard",
    "nav.events": "Events",
    "nav.templates": "Templates",
    "nav.distribution": "Share & Post",
    "nav.widgets": "Widgets",
    "nav.categories": "Categories",
    "nav.media": "Media",
    "nav.team": "Team",
    "nav.integrations": "Integrations",
    "nav.settings": "Settings",
    "nav.billing": "Subscription",
    "nav.admin": "Admin",
    "nav.plan": "{plan} plan",

    // Public navigation (landing)
    "publicNav.home": "Home",
    "publicNav.benefits": "Benefits",
    "publicNav.howItWorks": "How it works",
    "publicNav.pricing": "Pricing",
    "publicNav.demo": "Demo",
    "publicNav.events": "Events",
    "publicNav.login": "Sign in",
    "publicNav.startFree": "Start free",

    // Languages
    "lang.ui": "Interface language",
    "lang.content": "Content language",
    "lang.source": "Source (Dutch)",
    "lang.fallback": "Falls back to Dutch",
    "lang.translateTo": "Translate to {lang}",
    "lang.translating": "Translating…",
    "lang.translateAll": "Translate all fields",
    "lang.translationCreated": "Translation created",
    "lang.translationUpdated": "Translation updated",
    "lang.translationDeleted": "Translation removed",
    "lang.aiGenerated": "AI-generated",
    "lang.lastEditedManually": "Manually edited",
    "lang.notTranslatedYet": "Not translated yet",
    "lang.confirmOverwrite": "Overwrite existing translation?",
    "lang.preview": "Live preview",
    "lang.interface": "Interface",

    // Settings
    "settings.language": "Language",
    "settings.languageDescription": "Choose the dashboard language. Your preference is remembered.",
  },
};

export function translate(
  language: UILanguageCode,
  key: string,
  vars?: Record<string, string>,
): string {
  const dict = UI_TRANSLATIONS[language] ?? UI_TRANSLATIONS.nl;
  let value = dict[key] ?? UI_TRANSLATIONS.nl[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(`{${k}}`, v);
    }
  }
  return value;
}
