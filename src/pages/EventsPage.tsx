import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, LayoutGrid, List, Calendar } from "lucide-react";
import { t } from "@/lib/i18n";
import { mockEvents } from "@/lib/mock-data";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function EventsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const filtered = mockEvents.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">{t.events.title}</h1>
        <Link to="/app/events/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />
          {t.events.create}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t.common.search}...`} className="pl-9" />
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setView("grid")} className={cn("p-2.5", view === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={cn("p-2.5", view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground mb-1">{t.events.noEvents}</h3>
          <p className="text-sm text-muted-foreground">{t.events.noEventsDesc}</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => (
            <Link key={event.id} to={`/app/events/${event.id}`} className="rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow overflow-hidden">
              <div className="h-32 bg-secondary flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <EventStatusBadge status={event.status} />
                  {event.isRecurring && <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Wekelijks</span>}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1 truncate">{event.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} · {event.startTime}
                </p>
                {event.venue && <p className="text-xs text-muted-foreground mt-1">{event.venue}</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <Link key={event.id} to={`/app/events/${event.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(event.startDate).toLocaleDateString("nl-NL")} · {event.startTime} · {event.venue}</p>
              </div>
              <EventStatusBadge status={event.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
