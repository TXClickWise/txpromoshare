import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Calendar, Star, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/lib/seo";
import { format, isToday, isThisWeek, addDays, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";

interface DiscoverEvent {
  id: string;
  title: string;
  subtitle: string | null;
  short_description: string | null;
  slug: string;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string | null;
  is_featured: boolean;
  featured_until: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_address: string | null;
  organizer_name: string | null;
  tenant_name: string | null;
  image_url: string | null;
  tags: string[] | null;
}

type DateFilter = "all" | "today" | "this-week" | "this-weekend" | "this-month";

const dateFilterOptions: { value: DateFilter; label: string }[] = [
  { value: "all", label: "Alle data" },
  { value: "today", label: "Vandaag" },
  { value: "this-week", label: "Deze week" },
  { value: "this-weekend", label: "Dit weekend" },
  { value: "this-month", label: "Deze maand" },
];

function getDateRange(filter: DateFilter): { from: string | null; to: string | null } {
  const now = new Date();
  const today = startOfDay(now);
  switch (filter) {
    case "today":
      return { from: format(today, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
    case "this-week":
      return { from: format(today, "yyyy-MM-dd"), to: format(addDays(today, 7), "yyyy-MM-dd") };
    case "this-weekend": {
      const dayOfWeek = today.getDay();
      const daysToSat = dayOfWeek <= 6 ? (6 - dayOfWeek) : 0;
      const sat = addDays(today, daysToSat);
      const sun = addDays(sat, 1);
      return { from: format(sat, "yyyy-MM-dd"), to: format(sun, "yyyy-MM-dd") };
    }
    case "this-month":
      return { from: format(today, "yyyy-MM-dd"), to: format(addDays(today, 30), "yyyy-MM-dd") };
    default:
      return { from: null, to: null };
  }
}

function getImagePublicUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith("http")) return storagePath;
  const { data } = supabase.storage.from("media").getPublicUrl(storagePath);
  return data?.publicUrl || null;
}

export default function DiscoverEventsPage() {
  const [events, setEvents] = useState<DiscoverEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [categories, setCategories] = useState<{ slug: string; name: string; color: string | null }[]>([]);

  useSEO({
    title: "Evenementen ontdekken — TX EventShare",
    description: "Ontdek evenementen bij jou in de buurt. Zoek op categorie, stad of datum en vind de leukste events in de horeca.",
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load categories
  useEffect(() => {
    supabase.from("categories").select("slug, name, color").eq("is_default", true).then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  // Load events
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { from, to } = getDateRange(dateFilter);
      const { data, error } = await supabase.rpc("get_discoverable_events", {
        _search: searchDebounced || null,
        _category_slug: categoryFilter === "all" ? null : categoryFilter,
        _city: cityFilter || null,
        _date_from: from,
        _date_to: to,
        _limit: 100,
        _offset: 0,
      });
      if (!error && data) setEvents(data as DiscoverEvent[]);
      setLoading(false);
    }
    load();
  }, [searchDebounced, categoryFilter, cityFilter, dateFilter]);

  const featuredEvents = useMemo(
    () => events.filter((e) => e.is_featured && e.featured_until && new Date(e.featured_until) > new Date()),
    [events]
  );
  const regularEvents = useMemo(
    () => events.filter((e) => !e.is_featured || !e.featured_until || new Date(e.featured_until) <= new Date()),
    [events]
  );

  const hasFilters = search || categoryFilter !== "all" || cityFilter || dateFilter !== "all";

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container px-4 max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Ontdek evenementen
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Vind de leukste evenementen bij jou in de buurt
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op naam, locatie of organisator..."
                className="pl-10 h-11"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Stad"
                className="pl-10 h-11 w-36"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dateFilterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={dateFilter === opt.value ? "default" : "outline"}
                size="sm"
                className="text-xs h-9"
                onClick={() => setDateFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-9 text-muted-foreground"
                onClick={() => { setSearch(""); setCategoryFilter("all"); setCityFilter(""); setDateFilter("all"); }}
              >
                <X className="w-3.5 h-3.5 mr-1" />Wis filters
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="container px-4 max-w-5xl mx-auto pb-16">
        {/* Featured */}
        {featuredEvents.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-highlight fill-highlight" />
              <h2 className="text-lg font-display font-semibold text-foreground">Uitgelicht</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredEvents.map((e) => (
                <EventCard key={e.id} event={e} featured />
              ))}
            </div>
          </section>
        )}

        {/* All events */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : regularEvents.length === 0 && featuredEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">Geen evenementen gevonden</p>
            <p className="text-sm text-muted-foreground">Probeer andere zoektermen of filters</p>
          </div>
        ) : (
          <section>
            {regularEvents.length > 0 && (
              <>
                <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                  {dateFilter === "today" ? "Vandaag" : "Aankomende evenementen"}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularEvents.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function EventCard({ event: e, featured = false }: { event: DiscoverEvent; featured?: boolean }) {
  const imageUrl = getImagePublicUrl(e.image_url);
  const dateStr = (() => {
    try {
      const d = new Date(e.start_date + "T00:00:00");
      return format(d, "d MMM yyyy", { locale: nl });
    } catch {
      return e.start_date;
    }
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link
        to={`/e/${e.slug}`}
        className={`block rounded-xl border overflow-hidden bg-card hover:shadow-lg transition-all group ${
          featured ? "border-highlight/50 ring-1 ring-highlight/20" : "border-border"
        }`}
      >
        {/* Image */}
        <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground/20" />
            </div>
          )}
          {featured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-highlight text-highlight-foreground text-xs gap-1">
                <Star className="w-3 h-3 fill-current" />Uitgelicht
              </Badge>
            </div>
          )}
          {e.category_name && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs" style={e.category_color ? { backgroundColor: e.category_color, color: "#fff" } : {}}>
                {e.category_name}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <h3 className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {e.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{dateStr}</span>
            {e.start_time && <span>• {e.start_time.slice(0, 5)}</span>}
          </div>
          {(e.venue_name || e.venue_city) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{[e.venue_name, e.venue_city].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {e.tenant_name && (
            <p className="text-xs text-muted-foreground/70">door {e.tenant_name}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
