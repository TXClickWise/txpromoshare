import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, CreditCard } from "lucide-react";

interface PlatformStats {
  totalTenants: number;
  totalUsers: number;
  totalEvents: number;
  planBreakdown: { plan: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalTenants: 0,
    totalUsers: 0,
    totalEvents: 0,
    planBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [tenants, users, events] = await Promise.all([
        supabase.from("tenants").select("id, plan_id"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
      ]);

      const planMap: Record<string, number> = {};
      (tenants.data || []).forEach((t) => {
        planMap[t.plan_id] = (planMap[t.plan_id] || 0) + 1;
      });

      setStats({
        totalTenants: tenants.data?.length || 0,
        totalUsers: users.count || 0,
        totalEvents: events.count || 0,
        planBreakdown: Object.entries(planMap).map(([plan, count]) => ({ plan, count })),
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Organisaties", value: stats.totalTenants, icon: Building2, color: "text-primary" },
    { label: "Gebruikers", value: stats.totalUsers, icon: Users, color: "text-accent" },
    { label: "Evenementen", value: stats.totalEvents, icon: Calendar, color: "text-highlight" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Platform Overzicht</h1>
        <p className="text-muted-foreground mt-1">Statistieken van het TX PromoShare platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Abonnementen verdeling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.planBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">Nog geen organisaties</p>
            )}
            {stats.planBreakdown.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{p.plan}</span>
                <span className="text-sm text-muted-foreground">{p.count} organisatie{p.count !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
