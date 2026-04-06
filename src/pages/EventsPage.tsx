import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, LayoutGrid, List, Calendar, Filter, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { mockEvents } from "@/lib/mock-data";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { EventActionMenu } from "@/components/EventActionMenu";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusFilters = [
  { value: "all", label: "Alle statussen" },
  { value: "published", label: "Gepubliceerd" },
  { value: "draft", label: "Concept" },
  { value: "scheduled", label: "Ingepland" },
  { value: "ended", label: "Afgelopen" },
  { value: "archived", label: "Gearchiveerd" },
];

export default function EventsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockEvents
    .filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => statusFilter === "all" || e.status === statusFilter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.events.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{mockEvents.length} evenementen · {mockEvents.filter(e => e.status === "published").length} gepubliceerd</p>
        </div>
        <Link to="/app/events/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-glow">
          <Plus className="w-4 h-4" />
          {t.events.create}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek op naam, categorie of locatie..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setView("grid")} className={cn("p-2.5 transition-colors", view === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary")}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={cn("p-2.5 transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary")}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={search ? "Geen resultaten gevonden" : t.events.noEvents}
          description={search ? `Geen evenementen gevonden voor "${search}". Probeer een andere zoekterm.` : t.events.noEventsDesc}
          actionLabel={search ? undefined : "Eerste evenement aanmaken"}
          actionTo={search ? undefined : "/app/events/new"}
          secondaryLabel={search ? undefined : "Sjabloon kiezen"}
          secondaryTo={search ? undefined : "/app/templates"}
        />
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/app/events/${event.id}`} className="block rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/20 transition-all overflow-hidden group">
                <div className="h-36 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center relative">
                  <Calendar className="w-8 h-8 text-muted-foreground/20" />
                  <div className="absolute top-3 right-3">
                    <EventActionMenu eventId={event.id} eventTitle={event.title} eventSlug={event.slug} status={event.status} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <EventStatusBadge status={event.status} />
                    {event.isRecurring && <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">♻ Wekelijks</span>}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1.5 truncate group-hover:text-primary transition-colors">{event.title}</h3>
                  {event.shortDescription && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{event.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {event.startTime}
                    </span>
                    {event.venue && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {event.venue}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={`/app/events/${event.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/20 transition-all group">
                <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{event.title}</p>
                    {event.isRecurring && <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">♻</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(event.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {event.startTime}</span>
                    {event.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>}
                  </p>
                </div>
                <EventStatusBadge status={event.status} />
                <EventActionMenu eventId={event.id} eventTitle={event.title} eventSlug={event.slug} status={event.status} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
