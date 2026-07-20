import { Outlet, Link, useLocation, NavLink } from "react-router-dom";
import { Building2, Palette, FolderKanban, Users, Globe, CreditCard, ChevronLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useUILanguage";
import { cn } from "@/lib/utils";

export const settingsSections = [
  { key: "organisatie", icon: Building2, labelKey: "settings.section.organization", descKey: "settings.section.organization.desc" },
  { key: "merk", icon: Palette, labelKey: "settings.section.brand", descKey: "settings.section.brand.desc" },
  { key: "inhoud", icon: FolderKanban, labelKey: "settings.section.content", descKey: "settings.section.content.desc" },
  { key: "team", icon: Users, labelKey: "settings.section.team", descKey: "settings.section.team.desc" },
  { key: "website", icon: Globe, labelKey: "settings.section.website", descKey: "settings.section.website.desc" },
  { key: "abonnement", icon: CreditCard, labelKey: "settings.section.subscription", descKey: "settings.section.subscription.desc" },
] as const;

export default function SettingsLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isOverview = pathname === "/app/settings" || pathname === "/app/settings/";

  if (isOverview) {
    return <Outlet />;
  }

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <Link to="/app/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground min-h-11">
          <ChevronLeft className="w-4 h-4" />
          {t("settings.back")}
        </Link>
      </div>
      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="space-y-1 sticky top-6">
            {settingsSections.map((s) => (
              <NavLink
                key={s.key}
                to={`/app/settings/${s.key}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium min-h-11 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )
                }
              >
                <s.icon className="w-4 h-4 shrink-0" />
                {t(s.labelKey)}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}