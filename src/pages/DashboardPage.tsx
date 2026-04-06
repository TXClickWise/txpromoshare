import { Calendar, Eye, TrendingUp, Plus, ArrowRight, Share2, Code2, Layers, Zap, Clock, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { mockEvents } from "@/lib/mock-data";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { QuickActionCard } from "@/components/QuickActionCard";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { EventActionMenu } from "@/components/EventActionMenu";
import { toast } from "sonner";

const statCards = [
  { label: t.dashboard.activeEvents, value: "3", icon: Calendar, color: "gradient-hero", change: "+1 deze week" },
  { label: t.dashboard.upcomingEvents, value: "2", icon: TrendingUp, color: "gradient-accent", change: "Volgende: 18 apr" },
  { label: t.dashboard.totalViews, value: "1.247", icon: Eye, color: "gradient-dark", change: "+23% vs vorige maand" },
];

const quickActions = [
  { icon: Plus, title: "Nieuw evenement", description: "Begin blanco of kies een sjabloon", to: "/app/events/new", gradient: "gradient-hero" },
  { icon: Copy, title: "Event dupliceren", description: "Kopieer een bestaand evenement", to: "/app/events", gradient: "gradient-accent" },
  { icon: Share2, title: "Verspreid nu", description: "Deel via WhatsApp, link of embed", to: "/app/distribution", gradient: "gradient-hero" },
  { icon: Code2, title: "Widget plaatsen", description: "Agenda op je website tonen", to: "/app/widgets", gradient: "gradient-dark" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.dashboard.welcome}, Jan 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Café De Kroeg · Basic plan</p>
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
            {mockEvents.slice(0, 4).map((event) => (
              <Link key={event.id} to={`/app/events/${event.id}`} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-all group">
                <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                    {event.isRecurring && <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">Wekelijks</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(event.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {event.startTime}
                    {event.venue && <span>· {event.venue}</span>}
                  </p>
                </div>
                <EventStatusBadge status={event.status} />
                <EventActionMenu eventId={event.id} eventTitle={event.title} eventSlug={event.slug} status={event.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Activity feed */}
          <div className="rounded-xl bg-card border border-border shadow-card p-4">
            <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recente activiteit</h3>
            <div className="space-y-3">
              {[
                { text: "Live Jazz Avond gepubliceerd", time: "2 uur geleden", color: "bg-accent" },
                { text: "Wijnproeverij concept opgeslagen", time: "5 uur geleden", color: "bg-primary" },
                { text: "Lisa Bakker uitgenodigd", time: "Gisteren", color: "bg-highlight" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${a.color} mt-1.5 shrink-0`} />
                  <div>
                    <p className="text-xs text-foreground">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade prompt */}
          <UpgradeBanner feature="Onbeperkt evenementen & geavanceerde analytics" plan="Pro" />

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
