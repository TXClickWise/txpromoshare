import { Calendar, Eye, TrendingUp, Plus, ArrowRight, Share2, Code2, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useUILanguage";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { QuickActionCard } from "@/components/QuickActionCard";
import { EventActionMenu } from "@/components/EventActionMenu";
import { UsageMeter } from "@/components/UsageMeter";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";


interface DashboardEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  start_date: string;
  start_time: string;
  is_recurring: boolean;
  tenant_id: string;
  venue_id: string | null;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { effectivePlanId, upgradePlan } = usePlan();
  const { user } = useAuth();
  const { tenant, tenantId } = useTenant();
  const planLabel = effectivePlanId.charAt(0).toUpperCase() + effectivePlanId.slice(1);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "daar";
  const orgName = tenant?.name || "Mijn organisatie";

  const quickActions = [
    { icon: Share2, title: t("dashboard.qa.distribute"), description: t("dashboard.qa.distributeDesc"), to: "/app/distribution", gradient: "bg-secondary" },
    { icon: Code2, title: t("dashboard.qa.widget"), description: t("dashboard.qa.widgetDesc"), to: "/app/widgets", gradient: "bg-secondary" },
  ];

  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [stats, setStats] = useState({ active: 0, upcoming: 0, widgets: 0, team: 1 });

  useEffect(() => {
    if (!tenantId) return;
    async function load() {
      // Recent events
      const { data: evts } = await supabase
        .from("events")
        .select("id, title, slug, status, start_date, start_time, is_recurring, tenant_id, venue_id")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(5);
      setEvents((evts as DashboardEvent[]) || []);

      // Stats
      const { count: activeCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .eq("status", "published");

      const { count: upcomingCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .in("status", ["scheduled", "draft"]);

      const { count: widgetCount } = await supabase
        .from("widgets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!);

      const { count: teamCount } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!);

      setStats({
        active: activeCount || 0,
        upcoming: upcomingCount || 0,
        widgets: widgetCount || 0,
        team: teamCount || 1,
      });
    }
    load();
  }, [tenantId]);

  const statCards = [
    { label: t("dashboard.activeEvents"), value: String(stats.active), icon: Calendar },
    { label: t("dashboard.upcomingEvents"), value: String(stats.upcoming), icon: TrendingUp },
    { label: t("dashboard.widgets"), value: String(stats.widgets), icon: Code2 },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("dashboard.welcome")}, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">{orgName} · {planLabel} plan</p>
        </div>
        <Link to="/app/events/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity min-h-11 sm:min-h-0">
          <Plus className="w-4 h-4" />
          {t("dashboard.createEvent")}
        </Link>
      </div>

      {/* Onboarding */}
      <OnboardingChecklist />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="p-5 rounded-xl bg-card border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions grid */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("dashboard.quickActions")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickActions.map((a) => (
            <QuickActionCard key={a.title} {...a} />
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent events */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboard.recentEvents")}</h2>
            <Link to="/app/events" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              {t("dashboard.allEvents")} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-card border border-border">
                <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noEvents")}</p>
              </div>
            ) : events.map((event) => (
              <Link key={event.id} to={`/app/events/${event.id}`} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-all group">
                <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                    {event.is_recurring && <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">Wekelijks</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(event.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {event.start_time}
                  </p>
                </div>
                <EventStatusBadge status={event.status as any} />
                <EventActionMenu eventId={event.id} eventTitle={event.title} eventSlug={event.slug} status={event.status as any} />
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Usage meters */}
          <div className="rounded-xl bg-card border border-border shadow-card p-4 space-y-4">
            <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboard.usage")}</h3>
            <UsageMeter metric="events" current={stats.active} label={t("dashboard.activeEvents")} />
            <UsageMeter metric="widgets" current={stats.widgets} label={t("dashboard.widgets")} />
            <UsageMeter metric="team" current={stats.team} label={t("billing.teamMembers")} />
          </div>

          {/* Smart upgrade prompt — alleen tonen als upgrade mogelijk én zinvol (limiet bijna bereikt) */}
          {upgradePlan && (() => {
            const limits = (effectivePlanId === "free")
              ? { events: 3, widgets: 1 }
              : { events: 15, widgets: 3 };
            const eventsPercent = limits.events === Infinity ? 0 : Math.round((stats.active / limits.events) * 100);
            const widgetsPercent = limits.widgets === Infinity ? 0 : Math.round((stats.widgets / limits.widgets) * 100);
            const showSmart = eventsPercent >= 70 || widgetsPercent >= 70 || effectivePlanId === "free";
            if (!showSmart) return null;
            const variantCopy = effectivePlanId === "free"
              ? "Eigen branding, 15 evenementen en de distributie hub"
              : "Onbeperkt evenementen, ClickWise-integratie en multi-location";
            return (
              <Link to="/app/billing" className="block rounded-xl bg-secondary/50 border border-border p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Klaar voor {upgradePlan.charAt(0).toUpperCase() + upgradePlan.slice(1)}?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{variantCopy}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-2" />
                </div>
              </Link>
            );
          })()}

          {/* Quick tip */}
          <div className="rounded-xl bg-secondary/50 border border-border p-4">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">💡 {t("dashboard.tip")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.tipText")}</p>
                <Link to="/app/templates" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-1">
                  {t("dashboard.viewTemplates")} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
