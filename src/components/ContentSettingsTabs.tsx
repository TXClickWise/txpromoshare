import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useUILanguage";
import { cn } from "@/lib/utils";

export function ContentSettingsTabs({ active }: { active: "categorieen" | "media" }) {
  const { t } = useTranslation();
  const items: { key: "categorieen" | "media"; to: string; label: string }[] = [
    { key: "categorieen", to: "/app/settings/inhoud/categorieen", label: t("settings.content.tab.categories") },
    { key: "media", to: "/app/settings/inhoud/media", label: t("settings.content.tab.media") },
  ];
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-hidden">
      {items.map((it) => {
        const isActive = active === it.key;
        return (
          <Link
            key={it.key}
            to={it.to}
            className={cn(
              "px-4 py-2.5 text-sm font-medium min-h-11 whitespace-nowrap border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}