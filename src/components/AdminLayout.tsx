import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, CreditCard, BarChart3, Menu, X, LogOut, Shield,
  Package, ArrowUpDown, ScrollText, Settings, Search
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const adminNavItems = [
  { to: "/admin", icon: BarChart3, label: "Overzicht", end: true },
  { to: "/admin/tenants", icon: Building2, label: "Organisaties" },
  { to: "/admin/users", icon: Users, label: "Gebruikers" },
  { to: "/admin/subscriptions", icon: CreditCard, label: "Abonnementen" },
  { to: "/admin/plans", icon: Package, label: "Plannen" },
  { to: "/admin/overrides", icon: ArrowUpDown, label: "Plan Overrides" },
  { to: "/admin/audit", icon: ScrollText, label: "Audit Log" },
  { to: "/admin/settings", icon: Settings, label: "Instellingen" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading, isPlatformAdmin, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isPlatformAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
            <Shield className="w-4 h-4 text-destructive-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">Admin Panel</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
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

        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link
            to="/app"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LayoutDashboard className="w-4 h-4" />
            Naar app
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-muted-foreground">Super Admin — TX EventShare</span>
          </div>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
