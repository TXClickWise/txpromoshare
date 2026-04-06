import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Calendar, CreditCard, ArrowUpDown, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface PlatformStats {
  totalTenants: number;
  totalUsers: number;
  totalEvents: number;
  activeOverrides: number;
  planBreakdown: { plan: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  recentTenants: { id: string; name: string; plan_id: string; created_at: string; status: string }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalTenants: 0, totalUsers: 0, totalEvents: 0, activeOverrides: 0,
    planBreakdown: [], statusBreakdown: [], recentTenants: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [tenants, users, events, overrides] = await Promise.all([
        supabase.from("tenants").select("id, plan_id, status, name, created_at").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("plan_overrides").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      const planMap: Record<string, number> = {};
      const statusMap: Record<string, number> = {};
      (tenants.data || []).forEach((t: any) => {
        planMap[t.plan_id] = (planMap[t.plan_id] || 0) + 1;
        const s = t.status || "active";
        statusMap[s] = (statusMap[s] || 0) + 1;
      });

      setStats({
        totalTenants: tenants.data?.length || 0,
        totalUsers: users.count || 0,
        totalEvents: events.count || 0,
        activeOverrides: overrides.count || 0,
        planBreakdown: Object.entries(planMap).map(([plan, count]) => ({ plan, count })),
        statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
        recentTenants: (tenants.data || []).slice(0, 5).map((t: any) => ({
          id: t.id, name: t.name, plan_id: t.plan_id, created_at: t.created_at, status: t.status || "active",
        })),
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Organisaties", value: stats.totalTenants, icon: Building2, color: "text-primary", link: "/admin/tenants" },
    { label: "Gebruikers", value: stats.totalUsers, icon: Users, color: "text-accent", link: "/admin/users" },
    { label: "Evenementen", value: stats.totalEvents, icon: Calendar, color: "text-highlight", link: null },
    { label: "Actieve Overrides", value: stats.activeOverrides, icon: ArrowUpDown, color: "text-destructive", link: "/admin/overrides" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Platform Overzicht</h1>
        <p className="text-muted-foreground mt-1">TX EventShare Super Admin Control Center</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const content = (
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          );
          return s.link ? <Link key={s.label} to={s.link}>{content}</Link> : <div key={s.label}>{content}</div>;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4" /> Abonnementen verdeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.planBreakdown.map((p) => (
                <div key={p.plan} className="flex items-center justify-between">
                  <Badge variant={p.plan === "pro" ? "default" : p.plan === "basic" ? "secondary" : "outline"} className="capitalize">{p.plan}</Badge>
                  <span className="text-sm text-muted-foreground">{p.count} organisatie{p.count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4" /> Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <Badge variant={s.status === "active" ? "default" : "destructive"} className="capitalize">{s.status}</Badge>
                  <span className="text-sm text-muted-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Recente Organisaties</span>
            <Link to="/admin/tenants" className="text-sm text-primary hover:underline">Alle bekijken →</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentTenants.map((t) => (
              <Link key={t.id} to={`/admin/tenants/${t.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div>
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{format(new Date(t.created_at), "d MMM yyyy", { locale: nl })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.plan_id === "pro" ? "default" : t.plan_id === "basic" ? "secondary" : "outline"} className="capitalize text-xs">{t.plan_id}</Badge>
                  {t.status !== "active" && <Badge variant="destructive" className="capitalize text-xs">{t.status}</Badge>}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
