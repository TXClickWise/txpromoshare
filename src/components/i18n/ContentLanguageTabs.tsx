import { CONTENT_LANGUAGES, type ContentLanguageCode } from "@/lib/i18n/languages";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContentLanguageTabsProps {
  value: ContentLanguageCode;
  onChange: (lang: ContentLanguageCode) => void;
  /** Languages that have a saved translation (used to show indicator dot). */
  translatedLanguages?: ContentLanguageCode[];
  className?: string;
}

/**
 * Tabs for switching between content languages within a wizard or editor.
 * NL is always marked as the source.
 */
export function ContentLanguageTabs({
  value,
  onChange,
  translatedLanguages = [],
  className,
}: ContentLanguageTabsProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">
        Content-taal
      </span>
      <div className="inline-flex rounded-lg bg-secondary p-0.5 gap-0.5">
        {CONTENT_LANGUAGES.map((lang) => {
          const isActive = value === lang.code;
          const isSource = lang.code === "nl";
          const hasTranslation = isSource || translatedLanguages.includes(lang.code);
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onChange(lang.code)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={isActive}
            >
              <span className="text-sm leading-none">{lang.flag}</span>
              <span>{lang.nativeLabel}</span>
              {!hasTranslation && !isSource && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                  aria-label="Nog niet vertaald"
                />
              )}
              {hasTranslation && !isSource && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-accent"
                  aria-label="Vertaling aanwezig"
                />
              )}
            </button>
          );
        })}
      </div>
      {value === "nl" && (
        <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
          Bron
        </Badge>
      )}
      {value !== "nl" && !translatedLanguages.includes(value) && (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Valt terug op NL
        </Badge>
      )}
    </div>
  );
}
