import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUILanguage } from "@/hooks/useUILanguage";
import { UI_LANGUAGES } from "@/lib/i18n/languages";

interface UILanguageSwitcherProps {
  variant?: "icon" | "compact";
}

/**
 * Switcher for the app interface language (NL/EN).
 * Persists per-user via profiles.ui_language.
 */
export function UILanguageSwitcher({ variant = "icon" }: UILanguageSwitcherProps) {
  const { language, setLanguage } = useUILanguage();
  const current = UI_LANGUAGES.find((l) => l.code === language) ?? UI_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          aria-label="Interface language"
          className="gap-1.5"
        >
          <Globe className="h-4 w-4" />
          {variant === "compact" && (
            <span className="text-xs font-medium uppercase">{current.code}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          Interface
        </div>
        {UI_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span className="flex-1">{lang.nativeLabel}</span>
            {lang.code === language && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
