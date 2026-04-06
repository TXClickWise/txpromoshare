import { Calendar, Eye, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";
import { mockEvents } from "@/lib/mock-data";
import { EventStatusBadge } from "@/components/EventStatusBadge";

const statCards = [
  { label: t.dashboard.activeEvents, value: "3", icon: Calendar, color: "gradient-hero" },
  { label: t.dashboard.upcomingEvents, value: "2", icon: TrendingUp, color: "gradient-accent" },
  { label: t.dashboard.totalViews, value: "1.247", icon: Eye, color: "gradient-dark" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.dashboard.welcome}, Jan 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Café De Kroeg · Basic plan</p>
        </div>
        <Link to="/app/events/new" className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          {t.dashboard.createEvent}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                <s.icon className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions mobile */}
      <Link to="/app/events/new" className="sm:hidden flex items-center justify-center gap-2 p-3 rounded-xl gradient-hero text-primary-foreground font-semibold">
        <Plus className="w-4 h-4" />
        {t.dashboard.createEvent}
      </Link>

      {/* Recent events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">{t.dashboard.recentEvents}</h2>
          <Link to="/app/events" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Alles bekijken <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {mockEvents.slice(0, 3).map((event) => (
            <Link key={event.id} to={`/app/events/${event.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })} · {event.startTime}
                </p>
              </div>
              <EventStatusBadge status={event.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
