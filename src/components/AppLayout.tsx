import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Layers, Share2, Code2, Tags,
  Image, Users, Plug, Settings, CreditCard, Shield, Menu, X, LogOut
} from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: t.nav.dashboard, end: true },
  { to: "/app/events", icon: Calendar, label: t.nav.events },
  { to: "/app/templates", icon: Layers, label: t.nav.templates },
  { to: "/app/distribution", icon: Share2, label: t.nav.distribution },
  { to: "/app/widgets", icon: Code2, label: t.nav.widgets },
  { to: "/app/categories", icon: Tags, label: t.nav.categories },
  { to: "/app/media", icon: Image, label: t.nav.media },
  { to: "/app/team", icon: Users, label: t.nav.team },
  { to: "/app/integrations", icon: Plug, label: t.nav.integrations },
  { to: "/app/settings", icon: Settings, label: t.nav.settings },
  { to: "/app/billing", icon: CreditCard, label: t.nav.billing },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">TX</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground">PromoShare</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-muted-foreground">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-xs font-bold text-secondary-foreground">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Jan de Vries</p>
              <p className="text-xs text-muted-foreground truncate">Basic plan</p>
            </div>
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
