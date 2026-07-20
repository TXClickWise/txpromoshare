import { Calendar, TrendingUp, Plus, ArrowRight, Zap, Clock, FileText, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useUILanguage";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { EventActionMenu } from "@/components/EventActionMenu";
import { UsageMeter } from "@/components/UsageMeter";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import { formatTime } from "@/lib/utils";


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
  const { effectivePlanId, upgradePlan, limits, usagePercent } = usePlan();
  const { user } = useAuth();
  const { tenant, tenantId } = useTenant();
  const planLabel = effectivePlanId.charAt(0).toUpperCase() + effectivePlanId.slice(1);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || t("dashboard.userFallback");
  const orgName = tenant?.name || t("dashboard.orgFallback");

  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [stats, setStats] = useState({ published: 0, scheduled: 0, drafts: 0, widgets: 0, team: 1 });

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
      const { count: publishedCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .eq("status", "published");

      const { count: scheduledCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .eq("status", "scheduled");

      const { count: draftCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .eq("status", "draft");

      const { count: widgetCount } = await supabase
        .from("widgets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!);

      const { count: teamCount } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!);

      setStats({
        published: publishedCount || 0,
        scheduled: scheduledCount || 0,
        drafts: draftCount || 0,
        widgets: widgetCount || 0,
        team: teamCount || 1,
      });
    }
    load();
  }, [tenantId]);

  const statCards = [
    { label: t("dashboard.stats.published"), sub: t("dashboard.stats.publishedDesc"), value: String(stats.published), icon: TrendingUp },
    { label: t("dashboard.stats.scheduled"), sub: t("dashboard.stats.scheduledDesc"), value: String(stats.scheduled), icon: CalendarClock },
    { label: t("dashboard.stats.drafts"), sub: t("dashboard.stats.draftsDesc"), value: String(stats.drafts), icon: FileText },
  ];

  // Verbruiksmeters alleen tonen bij eindige limiet + >=50% verbruik
  const meters: { metric: "events" | "widgets" | "team"; current: number; label: string; max: number }[] = [
    { metric: "events", current: stats.published, label: t("dashboard.stats.published"), max: limits.maxActiveEvents },
    { metric: "widgets", current: stats.widgets, label: t("dashboard.widgets"), max: limits.maxWidgets },
    { metric: "team", current: stats.team, label: t("billing.teamMembers"), max: limits.maxTeamMembers },
  ];
  const visibleMeters = meters.filter((m) => Number.isFinite(m.max) && (m.current / m.max) * 100 >= 50);

  // Upgrade-prompt alleen wanneer limiet ≥70% in zicht
  const showUpgrade = !!upgradePlan && meters.some(
    (m) => Number.isFinite(m.max) && (m.current / m.max) * 100 >= 70,
  );
  const upgradeCopy = effectivePlanId === "free"
    ? t("dashboard.upgradeFromFree")
    : t("dashboard.upgradeFromBasic");

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("dashboard.welcome")}, {firstName}</h1>
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
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="p-3 sm:p-5 rounded-xl bg-card border border-border"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-secondary flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-display font-bold text-foreground tabular-nums">{s.value}</div>
            <div className="text-xs text-foreground mt-0.5 sm:mt-1 font-medium">{s.label}</div>
            <div className="hidden sm:block text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
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
              <Link key={event.id} to={`/app/events/${event.id}`} className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-all group">
                <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {new Date(event.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {formatTime(event.start_time)}
                    </span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <EventStatusBadge status={event.status as any} />
                    {event.is_recurring && <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{t("events.recurring")}</span>}
                  </div>
                </div>
                <EventActionMenu eventId={event.id} eventTitle={event.title} eventSlug={event.slug} status={event.status as any} />
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Usage meters — alleen bij zinvolle limiet-druk */}
          {visibleMeters.length > 0 && (
            <div className="rounded-xl bg-card border border-border shadow-card p-4 space-y-4">
              <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboard.usage")}</h3>
              {visibleMeters.map((m) => (
                <UsageMeter key={m.metric} metric={m.metric} current={m.current} label={m.label} />
              ))}
            </div>
          )}

          {/* Upgrade-prompt — alleen bij écht naderende limiet */}
          {showUpgrade && upgradePlan && (
            <Link to="/app/settings/abonnement" className="block rounded-xl bg-secondary/50 border border-border p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {t("dashboard.upgradeTitle", { plan: upgradePlan.charAt(0).toUpperCase() + upgradePlan.slice(1) })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{upgradeCopy}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-2" />
                </div>
              </Link>
          )}
        </div>
      </div>
    </div>
  );
}
