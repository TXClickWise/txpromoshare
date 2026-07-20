import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useUILanguage";
import { settingsGroups } from "@/components/SettingsLayout";

export default function SettingsOverviewPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t("settings.overview.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("settings.overview.subtitle")}</p>
      </div>
      {settingsGroups.map((group) => (
        <section key={group.key} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            {t(group.labelKey)}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {group.items.map((item) => (
              <Link
                key={item.key}
                to={`/app/settings/${item.path}`}
                className="group flex items-start gap-3 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all min-h-[76px]"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                    {t(item.labelKey)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(item.descKey)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}