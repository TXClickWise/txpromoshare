import { useState, useEffect, useMemo } from "react";
import { Copy, Check, Trash2, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { Plus, Search, LayoutGrid, List, Calendar, Filter, Clock, MapPin, ArrowUpDown, RefreshCw, X } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { EventActionMenu } from "@/components/EventActionMenu";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type StatusTab = "all" | "draft" | "scheduled" | "published" | "ended_archived" | "recurring";

const statusTabs: { value: StatusTab; label: string; hint?: string }[] = [
  { value: "all", label: "Alle" },
  { value: "draft", label: "Concepten" },
  { value: "scheduled", label: "Gepland" },
  { value: "published", label: "Live" },
  { value: "ended_archived", label: "Afgelopen" },
  { value: "recurring", label: "Terugkerend" },
];

const sortOptions = [
  { value: "date_desc", label: "Datum (nieuwst)" },
  { value: "date_asc", label: "Datum (oudst)" },
  { value: "title_asc", label: "Naam (A-Z)" },
  { value: "title_desc", label: "Naam (Z-A)" },
  { value: "updated", label: "Laatst bewerkt" },
];

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { tenantId } = useTenant();

  const copyEventId = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(e => e.id)));
    }
  };

  async function bulkAction(action: "archive" | "delete") {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    if (action === "archive") {
      const { error } = await supabase.from("events").update({ status: "archived" }).in("id", ids);
      if (error) { toast.error(error.message); return; }
      toast.success(`${ids.length} evenement(en) gearchiveerd`);
    } else {
      const { error } = await supabase.from("events").delete().in("id", ids);
      if (error) { toast.error(error.message); return; }
      toast.success(`${ids.length} evenement(en) verwijderd`);
    }
    setSelected(new Set());
    fetchEvents();
  }

  async function fetchEvents() {
    if (!tenantId) return;
    const { data } = await supabase
      .from("events")
      .select("*, featured_image:media!events_featured_image_id_fkey(storage_path, original_url), venue:venues(name, city)")
      .eq("tenant_id", tenantId)
      .order("start_date", { ascending: false });

    const list = data || [];

    // Enrich recurring events with next upcoming occurrence
    const recurringIds = list.filter((e: any) => e.is_recurring).map((e: any) => e.id);
    if (recurringIds.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: occs } = await supabase
        .from("event_occurrences")
        .select("event_id, occurrence_date, start_time, status")
        .in("event_id", recurringIds)
        .eq("status", "active")
        .gte("occurrence_date", today)
        .order("occurrence_date", { ascending: true });

      const nextByEvent = new Map<string, { date: string; time: string | null }>();
      (occs || []).forEach((o: any) => {
        if (!nextByEvent.has(o.event_id)) {
          nextByEvent.set(o.event_id, { date: o.occurrence_date, time: o.start_time });
        }
      });

      list.forEach((e: any) => {
        if (e.is_recurring && nextByEvent.has(e.id)) {
          const next = nextByEvent.get(e.id)!;
          e._nextDate = next.date;
          e._nextTime = next.time;
        }
      });
    }

    setEvents(list);
    setLoading(false);
  }

  async function fetchCategories() {
    if (!tenantId) return;
    const { data } = await supabase
      .from("categories")
      .select("*")
      .or(`is_default.eq.true,tenant_id.eq.${tenantId}`)
      .order("sort_order");
    setCategories(data || []);
  }

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [tenantId]);

  // Counts per tab (independent of active tab so they always show totals)
  const tabCounts = useMemo(() => {
    const base = events.filter(e => categoryFilter === "all" || e.category_id === categoryFilter);
    return {
      all: base.length,
      draft: base.filter(e => e.status === "draft").length,
      scheduled: base.filter(e => e.status === "scheduled").length,
      published: base.filter(e => e.status === "published").length,
      ended_archived: base.filter(e => e.status === "ended" || e.status === "archived").length,
      recurring: base.filter(e => e.is_recurring).length,
    };
  }, [events, categoryFilter]);

  const filtered = events
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const tagsMatch = e.tags?.some((tag: string) => tag.toLowerCase().includes(q));
      const venueMatch = e.venue?.name?.toLowerCase().includes(q) || e.venue?.city?.toLowerCase().includes(q);
      const dateMatch = formatDateLong(e.start_date).toLowerCase().includes(q);
      return e.title.toLowerCase().includes(q)
        || e.short_description?.toLowerCase().includes(q)
        || e.id.toLowerCase().includes(q)
        || e.organizer_name?.toLowerCase().includes(q)
        || venueMatch
        || dateMatch
        || tagsMatch;
    })
    .filter((e) => {
      if (activeTab === "all") return true;
      if (activeTab === "recurring") return e.is_recurring;
      if (activeTab === "ended_archived") return e.status === "ended" || e.status === "archived";
      return e.status === activeTab;
    })
    .filter((e) => categoryFilter === "all" || e.category_id === categoryFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "date_asc": return a.start_date.localeCompare(b.start_date);
        case "title_asc": return a.title.localeCompare(b.title);
        case "title_desc": return b.title.localeCompare(a.title);
        case "updated": return b.updated_at.localeCompare(a.updated_at);
        default: return b.start_date.localeCompare(a.start_date);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.events.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {events.length} {events.length === 1 ? "evenement" : "evenementen"} totaal
          </p>
        </div>
        <Link to="/app/events/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-glow">
          <Plus className="w-4 h-4" />
          {t.events.create}
        </Link>
      </div>

      {/* Status tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {statusTabs.map((tab) => {
            const count = tabCounts[tab.value];
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setSelected(new Set()); }}
                className={cn(
                  "relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.value === "recurring" && <RefreshCw className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                )}>
                  {count}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="active-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op titel, locatie, datum, organisator..."
            className="pl-9 pr-9 h-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary"
              aria-label="Wis zoekopdracht"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <Filter className="w-3 h-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle categorieën</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  {c.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />}
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <ArrowUpDown className="w-3 h-3 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setView("grid")} className={cn("p-2 transition-colors", view === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary")} aria-label="Rasterweergave">
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView("list")} className={cn("p-2 transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary")} aria-label="Lijstweergave">
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Checkbox checked={selected.size === filtered.length} onCheckedChange={selectAll} />
          <span className="text-sm font-medium text-foreground">{selected.size} geselecteerd</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => bulkAction("archive")}>
            <Archive className="w-3 h-3" />Archiveren
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => bulkAction("delete")}>
            <Trash2 className="w-3 h-3" />Verwijderen
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>Deselecteer</Button>
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={search || activeTab !== "all" ? "Geen resultaten" : t.events.noEvents}
          description={
            search
              ? `Geen evenementen gevonden voor "${search}".`
              : activeTab !== "all"
                ? `Geen evenementen in deze categorie. Wissel naar 'Alle' om alles te zien.`
                : t.events.noEventsDesc
          }
          actionLabel={search || activeTab !== "all" ? undefined : "Eerste evenement aanmaken"}
          actionTo={search || activeTab !== "all" ? undefined : "/app/events/new"}
          secondaryLabel={search || activeTab !== "all" ? undefined : "Sjabloon kiezen"}
          secondaryTo={search || activeTab !== "all" ? undefined : "/app/templates"}
        />
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event, i) => {
            const cat = categories.find(c => c.id === event.category_id);
            return (
              <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={`/app/events/${event.id}`} className="block rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/20 transition-all overflow-hidden group relative">
                  {/* Select checkbox */}
                  <div className="absolute top-3 left-3 z-10" onClick={(e) => toggleSelect(e, event.id)}>
                    <Checkbox checked={selected.has(event.id)} className="bg-background/80 backdrop-blur-sm" />
                  </div>
                  <div className="h-32 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center relative overflow-hidden">
                    {(() => {
                      const img = event.featured_image;
                      const src = img?.storage_path
                        ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/${img.storage_path}`
                        : img?.original_url || null;
                      return src ? (
                        <img src={src} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <Calendar className="w-8 h-8 text-muted-foreground/20" />
                      );
                    })()}
                    <div className="absolute top-3 right-3">
                      <EventActionMenu eventId={event.id} eventTitle={event.title} eventSlug={event.slug} status={event.status} onRefresh={fetchEvents} />
                    </div>
                    {cat && (
                      <div className="absolute bottom-2 left-3">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: cat.color || 'hsl(var(--primary))' }}>
                          {cat.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <EventStatusBadge status={event.status} />
                      {event.is_recurring && <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full flex items-center gap-0.5"><RefreshCw className="w-2.5 h-2.5" />Terugkerend</span>}
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors text-sm">{event.title}</h3>
                    {event.short_description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{event.short_description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <Clock className="w-3 h-3" />
                        {new Date(event.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {event.start_time?.slice(0, 5)}
                      </span>
                      {event.venue?.name && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.venue.name}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                      <code className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground truncate flex-1">{event.id.slice(0, 8)}…</code>
                      <button onClick={(e) => copyEventId(e, event.id)} className="shrink-0 p-1 rounded hover:bg-secondary transition-colors" title="Kopieer Event ID">
                        {copiedId === event.id ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* List header */}
          <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="w-5"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={selectAll} /></div>
            <div className="w-9" />
            <div className="flex-1">Evenement</div>
            <div className="w-28 hidden sm:block">Categorie</div>
            <div className="w-32 hidden sm:block">Datum</div>
            <div className="w-20">Status</div>
            <div className="w-8" />
          </div>
          {filtered.map((event, i) => {
            const cat = categories.find(c => c.id === event.category_id);
            return (
              <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                <Link to={`/app/events/${event.id}`} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border hover:shadow-elevated hover:border-primary/20 transition-all group">
                  <div className="w-5" onClick={(e) => toggleSelect(e, event.id)}>
                    <Checkbox checked={selected.has(event.id)} />
                  </div>
                  {(() => {
                    const img = event.featured_image;
                    const src = img?.storage_path
                      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/${img.storage_path}`
                      : img?.original_url || null;
                    return (
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                        {src ? (
                          <img src={src} alt={event.title} className="w-full h-full object-cover" />
                        ) : event.is_recurring ? (
                          <RefreshCw className="w-4 h-4 text-accent" />
                        ) : (
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">{event.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {event.venue?.name && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" />{event.venue.name}
                        </span>
                      )}
                      {event.is_recurring && (
                        <span className="flex items-center gap-0.5 text-accent">
                          <RefreshCw className="w-2.5 h-2.5" />Terugkerend
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-28 hidden sm:block">
                    {cat && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: cat.color || 'hsl(var(--primary))' }}>
                        {cat.name}
                      </span>
                    )}
                  </div>
                  <div className="w-32 hidden sm:block">
                    <p className="text-xs font-medium text-foreground">
                      {new Date(event.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{event.start_time?.slice(0, 5)}</p>
                  </div>
                  <div className="w-20">
                    <EventStatusBadge status={event.status} />
                  </div>
                  <div className="w-8">
                    <EventActionMenu eventId={event.id} eventTitle={event.title} eventSlug={event.slug} status={event.status} onRefresh={fetchEvents} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Results count */}
      {filtered.length > 0 && filtered.length !== events.length && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          {filtered.length} van {events.length} evenementen getoond
        </p>
      )}
    </div>
  );
}
