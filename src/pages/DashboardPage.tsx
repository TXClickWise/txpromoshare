import { Calendar, Eye, TrendingUp, Plus, ArrowRight, Share2, Code2, Zap, Clock, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { QuickActionCard } from "@/components/QuickActionCard";
import { EventActionMenu } from "@/components/EventActionMenu";
import { UsageMeter } from "@/components/UsageMeter";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";

const quickActions = [
  { icon: Plus, title: "Nieuw evenement", description: "Begin blanco of kies een sjabloon", to: "/app/events/new", gradient: "gradient-hero" },
  { icon: Copy, title: "Event dupliceren", description: "Kopieer een bestaand evenement", to: "/app/events", gradient: "gradient-accent" },
  { icon: Share2, title: "Verspreid nu", description: "Deel via WhatsApp, link of embed", to: "/app/distribution", gradient: "gradient-hero" },
  { icon: Code2, title: "Widget plaatsen", description: "Agenda op je website tonen", to: "/app/widgets", gradient: "gradient-dark" },
];

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
  const { effectivePlanId, upgradePlan } = usePlan();
  const { user } = useAuth();
  const { tenant, tenantId } = useTenant();
  const planLabel = effectivePlanId.charAt(0).toUpperCase() + effectivePlanId.slice(1);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "daar";
  const orgName = tenant?.name || "Mijn organisatie";

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
    { label: t.dashboard.activeEvents, value: String(stats.active), icon: Calendar, color: "gradient-hero", change: stats.active > 0 ? "Live op je agenda" : "Maak je eerste event" },
    { label: t.dashboard.upcomingEvents, value: String(stats.upcoming), icon: TrendingUp, color: "gradient-accent", change: stats.upcoming > 0 ? "In voorbereiding" : "Nog geen events" },
    { label: "Widgets", value: String(stats.widgets), icon: Code2, color: "gradient-dark", change: stats.widgets > 0 ? "Actief op je site" : "Nog geen widgets" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.dashboard.welcome}, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">{orgName} · {planLabel} plan</p>
        </div>
        <Link to="/app/events/new" className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow">
          <Plus className="w-4 h-4" />
          {t.dashboard.createEvent}
        </Link>
      </div>

      {/* Onboarding */}
      <OnboardingChecklist />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                <s.icon className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            <div className="text-[11px] text-accent font-medium mt-2">{s.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions mobile */}
      <Link to="/app/events/new" className="sm:hidden flex items-center justify-center gap-2 p-3 rounded-xl gradient-hero text-primary-foreground font-semibold">
        <Plus className="w-4 h-4" />
        {t.dashboard.createEvent}
      </Link>

      {/* Quick actions grid */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Snelle acties</h2>
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
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">{t.dashboard.recentEvents}</h2>
            <Link to="/app/events" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              Alle evenementen <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-card border border-border">
                <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nog geen evenementen. Maak je eerste event!</p>
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
            <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">Gebruik</h3>
            <UsageMeter metric="events" current={stats.active} label="Actieve evenementen" />
            <UsageMeter metric="widgets" current={stats.widgets} label="Widgets" />
            <UsageMeter metric="team" current={stats.team} label="Teamleden" />
          </div>

          {/* Upgrade prompt */}
          {upgradePlan && (
            <Link to="/app/billing" className="block rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Upgrade naar {upgradePlan.charAt(0).toUpperCase() + upgradePlan.slice(1)}</p>
                  <p className="text-xs text-muted-foreground">Ontgrendel meer evenementen, widgets en features</p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary ml-auto shrink-0" />
              </div>
            </Link>
          )}

          {/* Quick tip */}
          <div className="rounded-xl bg-secondary/50 border border-border p-4">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">💡 Tip</p>
                <p className="text-xs text-muted-foreground mt-0.5">Gebruik sjablonen om terugkerende events in seconden aan te maken.</p>
                <Link to="/app/templates" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-1">
                  Sjablonen bekijken <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
