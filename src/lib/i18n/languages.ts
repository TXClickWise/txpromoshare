/**
 * Centralized language configuration for TX EventShare.
 * Distinguishes between UI language and content language.
 */

export type UILanguageCode = "nl" | "en";
export type ContentLanguageCode = "nl" | "fy" | "de" | "en";

export interface LanguageMeta {
  code: ContentLanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

/** Source/default language for both UI and content. NL is always the fallback. */
export const DEFAULT_UI_LANGUAGE: UILanguageCode = "nl";
export const DEFAULT_CONTENT_LANGUAGE: ContentLanguageCode = "nl";

/** Languages supported for the app interface. */
export const UI_LANGUAGES: { code: UILanguageCode; label: string; nativeLabel: string; flag: string }[] = [
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands", flag: "🇳🇱" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
];

/** Languages supported for event content (more than UI). */
export const CONTENT_LANGUAGES: LanguageMeta[] = [
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands", flag: "🇳🇱" },
  { code: "fy", label: "Frisian", nativeLabel: "Frysk", flag: "🏴" },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
];

export function getContentLanguageMeta(code: string): LanguageMeta {
  return CONTENT_LANGUAGES.find((l) => l.code === code) ?? CONTENT_LANGUAGES[0];
}

export function isContentLanguage(code: string): code is ContentLanguageCode {
  return CONTENT_LANGUAGES.some((l) => l.code === code);
}

export function isUILanguage(code: string): code is UILanguageCode {
  return UI_LANGUAGES.some((l) => l.code === code);
}
