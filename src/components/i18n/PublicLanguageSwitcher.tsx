import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTENT_LANGUAGES, type ContentLanguageCode } from "@/lib/i18n/languages";

interface PublicLanguageSwitcherProps {
  /** Languages that are actually available for this event (NL is always present). */
  availableLanguages: ContentLanguageCode[];
  current: ContentLanguageCode;
  onChange: (lang: ContentLanguageCode) => void;
  className?: string;
}

/**
 * Compact content-language switcher for public event pages.
 * Only shows languages that have a translation (or NL as source).
 * Hidden when only NL is available — keeps mono-lingual pages clean.
 */
export function PublicLanguageSwitcher({
  availableLanguages,
  current,
  onChange,
  className,
}: PublicLanguageSwitcherProps) {
  // Always include NL (source). De-duplicate.
  const langs = Array.from(new Set<ContentLanguageCode>(["nl", ...availableLanguages]));
  if (langs.length <= 1) return null;

  const currentMeta = CONTENT_LANGUAGES.find((l) => l.code === current) ?? CONTENT_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Content language"
          style={{ marginBottom: "max(0px, env(safe-area-inset-bottom, 0px))" }}
          className={`gap-1.5 backdrop-blur-sm bg-white/10 text-white hover:bg-white/20 hover:text-white border-0 h-7 px-2 ${className ?? ""}`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="text-xs font-medium uppercase">{currentMeta.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {langs.map((code) => {
          const meta = CONTENT_LANGUAGES.find((l) => l.code === code);
          if (!meta) return null;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => onChange(code)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base leading-none">{meta.flag}</span>
              <span className="flex-1 text-sm">{meta.nativeLabel}</span>
              {code === current && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
