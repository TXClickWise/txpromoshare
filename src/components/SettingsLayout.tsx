import { Outlet, Link, useLocation, NavLink } from "react-router-dom";
import {
  Building2, MapPin, Palette, FolderKanban, ImageIcon, Code2,
  MessageSquare, Users, CreditCard, ChevronLeft,
} from "lucide-react";
import { useTranslation } from "@/hooks/useUILanguage";
import { cn } from "@/lib/utils";

export type SettingsItem = {
  key: string;
  path: string;
  icon: typeof Building2;
  labelKey: string;
  descKey: string;
};

export type SettingsGroup = {
  key: string;
  labelKey: string;
  items: SettingsItem[];
};

export const settingsGroups: SettingsGroup[] = [
  {
    key: "company",
    labelKey: "settings.groups.company",
    items: [
      { key: "bedrijfsgegevens", path: "bedrijfsgegevens", icon: Building2, labelKey: "settings.item.company", descKey: "settings.item.company.desc" },
      { key: "locaties", path: "locaties", icon: MapPin, labelKey: "settings.item.locations", descKey: "settings.item.locations.desc" },
      { key: "huisstijl", path: "huisstijl", icon: Palette, labelKey: "settings.item.brand", descKey: "settings.item.brand.desc" },
    ],
  },
  {
    key: "events",
    labelKey: "settings.groups.events",
    items: [
      { key: "categorieen", path: "categorieen", icon: FolderKanban, labelKey: "settings.item.categories", descKey: "settings.item.categories.desc" },
      { key: "media", path: "media", icon: ImageIcon, labelKey: "settings.item.media", descKey: "settings.item.media.desc" },
    ],
  },
  {
    key: "distribution",
    labelKey: "settings.groups.distribution",
    items: [
      { key: "widgets", path: "widgets", icon: Code2, labelKey: "settings.item.widgets", descKey: "settings.item.widgets.desc" },
      { key: "berichten", path: "berichten", icon: MessageSquare, labelKey: "settings.item.messaging", descKey: "settings.item.messaging.desc" },
    ],
  },
  {
    key: "account",
    labelKey: "settings.groups.account",
    items: [
      { key: "team", path: "team", icon: Users, labelKey: "settings.item.team", descKey: "settings.item.team.desc" },
      { key: "abonnement", path: "abonnement", icon: CreditCard, labelKey: "settings.item.subscription", descKey: "settings.item.subscription.desc" },
    ],
  },
];

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
          <nav className="space-y-5 sticky top-6">
            {settingsGroups.map((g) => (
              <div key={g.key} className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {t(g.labelKey)}
                </p>
                {g.items.map((item) => (
                  <NavLink
                    key={item.key}
                    to={`/app/settings/${item.path}`}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium min-h-11 transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {t(item.labelKey)}
                  </NavLink>
                ))}
              </div>
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