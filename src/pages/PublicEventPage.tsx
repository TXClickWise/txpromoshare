import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Clock, MapPin, User, Share2, ExternalLink, ChevronLeft,
  Tag, CalendarPlus, MessageCircle, Facebook, Twitter, Copy, Check, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}
function formatTime(t: string) {
  return t.replace(/^(\d{2}):(\d{2}).*/, "$1:$2");
}
function daysUntil(dateStr: string) {
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function useSEO(title: string, description: string, image?: string, url?: string) {
  useEffect(() => {
    document.title = `${title} | TX EventShare`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(name.startsWith("og:") || name.startsWith("twitter:") ? "property" : "name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", description);
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:type", "website");
    if (image) setMeta("og:image", image);
    if (url) setMeta("og:url", url);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);
    return () => { document.title = "TX EventShare"; };
  }, [title, description, image, url]);
}

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);
  const [event, setEvent] = useState<Tables<"events"> | null>(null);
  const [venue, setVenue] = useState<Tables<"venues"> | null>(null);
  const [category, setCategory] = useState<{ name: string; color: string | null } | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<(Tables<"events"> & { _imageUrl?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsors, setSponsors] = useState<Tables<"event_sponsors">[]>([]);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug || "")
        .in("status", ["published", "scheduled"])
        .maybeSingle();

      if (!ev) { setLoading(false); return; }
      setEvent(ev);

      const promises: Promise<any>[] = [
        ev.venue_id ? supabase.from("venues").select("*").eq("id", ev.venue_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("event_sponsors").select("*").eq("event_id", ev.id).order("sort_order"),
        supabase.from("events").select("*, media!events_featured_image_id_fkey(original_url)").eq("tenant_id", ev.tenant_id).eq("status", "published").neq("id", ev.id).order("start_date").limit(4),
        ev.category_id ? supabase.from("categories").select("name, color").eq("id", ev.category_id).maybeSingle() : Promise.resolve({ data: null }),
        ev.featured_image_id ? supabase.from("media").select("original_url").eq("id", ev.featured_image_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("event_gallery").select("media(original_url)").eq("event_id", ev.id).order("sort_order"),
      ];

      const [venueRes, sponsorsRes, relatedRes, catRes, imgRes, galleryRes] = await Promise.all(promises);
      setVenue(venueRes.data);
      setSponsors(sponsorsRes.data ?? []);
      setCategory(catRes.data);
      if (imgRes.data?.original_url) setFeaturedImageUrl(imgRes.data.original_url);

      // Map related events with images
      const related = (relatedRes.data ?? []).map((r: any) => ({
        ...r,
        _imageUrl: r.media?.original_url || null,
      }));
      setRelatedEvents(related);

      // Gallery
      const galleryUrls = (galleryRes.data ?? [])
        .map((g: any) => g.media?.original_url)
        .filter(Boolean);
      setGallery(galleryUrls);

      setLoading(false);
    }
    load();
  }, [slug]);

  const shareUrl = `https://txeventshare.nl/e/${slug}`;
  const heroImg = featuredImageUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop";

  useSEO(
    event?.seo_title || event?.title || "Evenement",
    event?.seo_description || event?.short_description || "",
    heroImg,
    shareUrl,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <h1 className="text-2xl font-display font-bold text-foreground">Evenement niet gevonden</h1>
          <p className="text-muted-foreground">Dit evenement bestaat niet of is niet meer beschikbaar.</p>
          <Link to="/evenementen" className="text-primary hover:underline text-sm">Bekijk alle evenementen</Link>
        </div>
      </div>
    );
  }

  const shareText = event.social_share_text || `${event.title} — ${formatDate(event.start_date)}`;
  const venueName = venue?.name || "Locatie volgt";
  const venueAddress = venue ? [venue.address, venue.city].filter(Boolean).join(", ") : "";
  const days = daysUntil(event.start_date);
  const countdownLabel = days === 0 ? "Vandaag!" : days === 1 ? "Morgen" : days > 0 ? `Nog ${days} dagen` : "Afgelopen";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "min(55vh, 440px)" }}>
        <img src={heroImg} alt={event.title} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-4">
          <Link to="/evenementen" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors backdrop-blur-sm bg-white/10 rounded-full px-3 py-1">
            <ChevronLeft className="w-4 h-4" />Alle evenementen
          </Link>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col justify-end" style={{ minHeight: "min(55vh, 440px)", paddingBottom: "2rem" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex gap-2 mb-3 flex-wrap">
              {category && (
                <Badge className="text-xs border-0 backdrop-blur-sm" style={{
                  backgroundColor: category.color ? `${category.color}33` : "rgba(255,255,255,0.15)",
                  color: "white",
                }}>
                  {category.name}
                </Badge>
              )}
              {days >= 0 && (
                <Badge variant="secondary" className="bg-white/15 text-white border-0 backdrop-blur-sm text-xs">
                  {countdownLabel}
                </Badge>
              )}
              {event.tags && event.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-white/10 text-white/80 border-0 backdrop-blur-sm text-xs">
                  <Tag className="w-3 h-3 mr-1" />{tag}
                </Badge>
              ))}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{event.title}</h1>
            {event.subtitle && <p className="text-lg sm:text-xl text-white/80 mt-2 max-w-2xl">{event.subtitle}</p>}
            {/* Quick meta row */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-white/70 text-sm">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatShortDate(event.start_date)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatTime(event.start_time)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{venueName}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 -mt-6 relative z-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick info cards */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-xl bg-card border border-border shadow-elevated p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Datum</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{formatDate(event.start_date)}</p>
                  {event.end_date && event.end_date !== event.start_date && (
                    <p className="text-xs text-muted-foreground">t/m {formatDate(event.end_date)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tijd</p>
                  <p className="text-sm font-semibold text-foreground">{formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ""}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Locatie</p>
                  <p className="text-sm font-semibold text-foreground">{venueName}</p>
                  {venueAddress && <p className="text-xs text-muted-foreground">{venueAddress}</p>}
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-xl bg-card border border-border shadow-card p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-3">Over dit evenement</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.full_description || event.short_description || "Meer informatie volgt binnenkort."}
              </div>
              {event.is_recurring && (
                <div className="mt-4 flex items-center gap-2 text-xs text-primary font-medium bg-primary/5 rounded-lg px-3 py-2">
                  <Calendar className="w-3.5 h-3.5" />Terugkerend evenement
                </div>
              )}
            </motion.div>

            {/* Gallery */}
            {gallery.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-xl bg-card border border-border shadow-card p-6">
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Foto's</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {gallery.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-colors aspect-square">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Organizer */}
            {event.organizer_name && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="rounded-xl bg-card border border-border shadow-card p-6">
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Organisator</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{event.organizer_name}</p>
                    {venueAddress && <p className="text-xs text-muted-foreground">{venueAddress}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sponsors */}
            {sponsors.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-xl bg-card border border-border shadow-card p-6">
                <h2 className="font-display text-lg font-bold text-foreground mb-4">Sponsoren & Partners</h2>
                <div className="flex flex-wrap items-center gap-6">
                  {sponsors.map((s) => s.logo_url ? (
                    <a key={s.id} href={s.website_url || "#"} target="_blank" rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-100 opacity-60">
                      <img src={s.logo_url} alt={s.name} className="h-8 grayscale hover:grayscale-0 transition-all" loading="lazy" />
                    </a>
                  ) : (
                    <span key={s.id} className="text-sm text-muted-foreground font-medium">{s.name}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Related events */}
            {relatedEvents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Meer van deze organisator</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedEvents.map((re) => (
                    <Link to={`/e/${re.slug}`} key={re.id}
                      className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-elevated transition-shadow group flex">
                      {(re as any)._imageUrl && (
                        <img src={(re as any)._imageUrl} alt={re.title}
                          className="w-20 h-20 object-cover shrink-0" loading="lazy" />
                      )}
                      <div className="p-3 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{re.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{formatShortDate(re.start_date)}
                          <span className="mx-1">•</span>
                          <Clock className="w-3 h-3" />{formatTime(re.start_time)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* CTA card */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-xl bg-card border border-border shadow-elevated p-6 space-y-4">
              {event.cta_link ? (
                <>
                  <Button asChild className="w-full h-12 text-base font-semibold gap-2">
                    <a href={event.cta_link} target="_blank" rel="noopener noreferrer">
                      {event.cta_button_text || "Aanmelden"}<ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">Direct bevestigd • Geen account nodig</p>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">Vrije toegang — geen aanmelding nodig</p>
                </div>
              )}
            </motion.div>

            {/* Add to calendar */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-primary" />Toevoegen aan agenda
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8"
                  onClick={() => {
                    const start = `${event.start_date.replace(/-/g, "")}T${event.start_time.replace(/:/g, "")}00`;
                    const end = event.end_time ? `${event.start_date.replace(/-/g, "")}T${event.end_time.replace(/:/g, "")}00` : start;
                    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&location=${encodeURIComponent(venueName)}&details=${encodeURIComponent(event.short_description || "")}`, "_blank");
                  }}>Google</Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8"
                  onClick={() => {
                    const ics = [
                      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TX EventShare//NL", "BEGIN:VEVENT",
                      `DTSTART:${event.start_date.replace(/-/g, "")}T${event.start_time.replace(/:/g, "")}00`,
                      event.end_time ? `DTEND:${(event.end_date || event.start_date).replace(/-/g, "")}T${event.end_time.replace(/:/g, "")}00` : "",
                      `SUMMARY:${event.title}`,
                      `LOCATION:${venueName}${venueAddress ? ", " + venueAddress : ""}`,
                      `DESCRIPTION:${(event.short_description || "").replace(/\n/g, "\\n")}`,
                      `URL:${shareUrl}`,
                      "END:VEVENT", "END:VCALENDAR"
                    ].filter(Boolean).join("\r\n");
                    const blob = new Blob([ics], { type: "text/calendar" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${event.slug}.ics`; a.click();
                  }}>.ics downloaden</Button>
              </div>
            </motion.div>

            {/* Share */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />Delen
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" asChild>
                  <a href={`https://wa.me/?text=${encodeURIComponent(event.whatsapp_share_text || shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" asChild>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-3.5 h-3.5" />Facebook
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" asChild>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-3.5 h-3.5" />X / Twitter
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={copyLink}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Gekopieerd!" : "Kopieer link"}
                </Button>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8" asChild>
                <a href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`}>
                  <Mail className="w-3.5 h-3.5" />Deel via e-mail
                </a>
              </Button>
            </motion.div>

            <div className="text-center pt-2">
              <Link to="/" className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                Gepresenteerd via <span className="font-semibold">TX EventShare</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        description: event.seo_description || event.short_description || event.full_description,
        startDate: `${event.start_date}T${event.start_time}`,
        endDate: event.end_date ? `${event.end_date}T${event.end_time || event.start_time}` : undefined,
        location: venue ? {
          "@type": "Place",
          name: venue.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: venue.address || undefined,
            addressLocality: venue.city || undefined,
            postalCode: venue.postal_code || undefined,
          },
          ...(venue.latitude && venue.longitude ? { geo: { "@type": "GeoCoordinates", latitude: venue.latitude, longitude: venue.longitude } } : {}),
        } : undefined,
        organizer: event.organizer_name ? { "@type": "Organization", name: event.organizer_name } : undefined,
        image: heroImg,
        url: shareUrl,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        ...(event.cta_link ? { offers: { "@type": "Offer", url: event.cta_link, availability: "https://schema.org/InStock" } } : {}),
      }) }} />
    </div>
  );
}
