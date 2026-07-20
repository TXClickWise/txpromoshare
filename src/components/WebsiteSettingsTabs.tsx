import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useUILanguage";
import { cn } from "@/lib/utils";

export function WebsiteSettingsTabs({ active }: { active: "widgets" | "koppelingen" }) {
  const { t } = useTranslation();
  const items: { key: "widgets" | "koppelingen"; to: string; label: string }[] = [
    { key: "widgets", to: "/app/settings/website/widgets", label: t("settings.website.tab.widgets") },
    { key: "koppelingen", to: "/app/settings/website/koppelingen", label: t("settings.website.tab.integrations") },
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