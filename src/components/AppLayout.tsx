import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Layers, Share2, Code2, Tags,
  Image, Users, Plug, Settings, CreditCard, Shield, Menu, X, LogOut
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { usePlan } from "@/hooks/usePlan";
import { UILanguageSwitcher } from "@/components/i18n/UILanguageSwitcher";
import { useTranslation } from "@/hooks/useUILanguage";
import { Logo } from "@/components/brand/Logo";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut, isPlatformAdmin } = useAuth();
  const { tenant } = useTenant();
  const { effectivePlanId } = usePlan();
  const { t } = useTranslation();

  const navItems = useMemo(() => [
    { to: "/app", icon: LayoutDashboard, label: t("nav.dashboard"), end: true },
    { to: "/app/events", icon: Calendar, label: t("nav.events") },
    { to: "/app/templates", icon: Layers, label: t("nav.templates") },
    { to: "/app/distribution", icon: Share2, label: t("nav.distribution") },
    { to: "/app/widgets", icon: Code2, label: t("nav.widgets") },
    { to: "/app/categories", icon: Tags, label: t("nav.categories") },
    { to: "/app/media", icon: Image, label: t("nav.media") },
    { to: "/app/team", icon: Users, label: t("nav.team") },
    { to: "/app/integrations", icon: Plug, label: t("nav.integrations") },
    { to: "/app/settings", icon: Settings, label: t("nav.settings") },
    { to: "/app/billing", icon: CreditCard, label: t("nav.billing") },
  ], [t]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const fullName = user?.user_metadata?.full_name || t("common.user");
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const planLabel = t("nav.plan", { plan: effectivePlanId.charAt(0).toUpperCase() + effectivePlanId.slice(1) });

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-sidebar-border">
          <Logo variant="dark" size="md" />
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-sidebar-foreground hover:text-sidebar-accent-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary/15 text-sidebar-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          {isPlatformAdmin && (
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Shield className="w-4 h-4 shrink-0" />
              {t("nav.admin")}
            </Link>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-sidebar-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{fullName}</p>
              <p className="text-xs text-sidebar-foreground truncate">{planLabel}</p>
            </div>
            <button onClick={handleSignOut} className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors" title={t("common.signOut")}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:sticky lg:top-0 z-30 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <UILanguageSwitcher variant="compact" />
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
