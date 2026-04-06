import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Clock, MapPin, User, Share2, ExternalLink, ChevronLeft,
  Tag, CalendarPlus, MessageCircle, Facebook, Twitter, Copy, Check, Heart
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockEvents } from "@/lib/mock-data";

/* ── helpers ─────────────────────────────────────────── */
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatTime(t: string) {
  return t.replace(/^(\d{2}):(\d{2}).*/, "$1:$2");
}

/* ── SEO head helper (set document title + meta) ─────── */
function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} | TX PromoShare`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", description);
    return () => { document.title = "TX PromoShare"; };
  }, [title, description]);
}

/* ── mock gallery images ─────────────────────────────── */
const galleryImages = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&h=400&fit=crop",
];

const mockSponsors = [
  { name: "Heineken", logo: "https://placehold.co/120x50/e8e8e8/666?text=Heineken" },
  { name: "Local Brew Co", logo: "https://placehold.co/120x50/e8e8e8/666?text=Local+Brew" },
  { name: "Sound Systems NL", logo: "https://placehold.co/120x50/e8e8e8/666?text=Sound+NL" },
];

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const event = mockEvents.find((e) => e.slug === slug) ?? mockEvents[0];
  const relatedEvents = mockEvents.filter((e) => e.id !== event.id && e.status === "published").slice(0, 3);

  useSEO(
    event.seoTitle || event.title,
    event.seoDescription || event.shortDescription || event.title,
  );

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = event.socialShareText || `${event.title} — ${formatDate(event.startDate)} bij ${event.venue}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const heroImg = event.featuredImage || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop";

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "min(60vh, 480px)" }}>
        <img src={heroImg} alt={event.title} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        {/* Back */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-5">
          <Link to="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" />Terug
          </Link>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col justify-end" style={{ minHeight: "min(60vh, 480px)", paddingBottom: "2.5rem" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {event.tags && event.tags.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/15 text-white border-0 backdrop-blur-sm text-xs">
                    <Tag className="w-3 h-3 mr-1" />{tag}
                  </Badge>
                ))}
              </div>
            )}
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{event.title}</h1>
            {event.subtitle && <p className="text-lg sm:text-xl text-white/80 mt-2 max-w-2xl">{event.subtitle}</p>}
          </motion.div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 -mt-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick info bar */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-xl bg-card border border-border shadow-elevated p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Datum</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{formatDate(event.startDate)}</p>
                  {event.endDate && event.endDate !== event.startDate && (
                    <p className="text-xs text-muted-foreground">t/m {formatDate(event.endDate)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tijd</p>
                  <p className="text-sm font-semibold text-foreground">{formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ""}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Locatie</p>
                  <p className="text-sm font-semibold text-foreground">{event.venue || "Locatie volgt"}</p>
                  {event.address && <p className="text-xs text-muted-foreground">{event.address}</p>}
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-xl bg-card border border-border shadow-card p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-3">Over dit evenement</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                <p>{event.fullDescription || event.shortDescription || "Meer informatie volgt binnenkort."}</p>
              </div>
              {event.isRecurring && (
                <div className="mt-4 flex items-center gap-2 text-xs text-primary font-medium bg-primary/5 rounded-lg px-3 py-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Terugkerend evenement — {event.recurringPattern === "weekly" ? "wekelijks" : event.recurringPattern}
                </div>
              )}
            </motion.div>

            {/* Gallery */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-xl bg-card border border-border shadow-card p-6">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Sfeerimpressie</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {galleryImages.map((img, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer">
                    <img src={img} alt={`Sfeerbeeld ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Organizer */}
            {event.organizer && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-xl bg-card border border-border shadow-card p-6">
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Organisator</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-dark flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{event.organizer}</p>
                    <p className="text-xs text-muted-foreground">{event.address}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sponsors */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="rounded-xl bg-card border border-border shadow-card p-6">
              <h2 className="font-display text-lg font-bold text-foreground mb-4">Sponsoren & Partners</h2>
              <div className="flex flex-wrap items-center gap-6">
                {mockSponsors.map((s) => (
                  <img key={s.name} src={s.logo} alt={s.name} className="h-8 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" loading="lazy" />
                ))}
              </div>
            </motion.div>

            {/* Related events */}
            {relatedEvents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Meer evenementen</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {relatedEvents.map((re) => (
                    <Link to={`/e/${re.slug}`} key={re.id}
                      className="rounded-xl border border-border bg-card p-4 hover:shadow-elevated transition-shadow group">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{re.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{formatDate(re.startDate)}</p>
                      <p className="text-xs text-muted-foreground">{re.venue}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right sidebar: sticky CTA + share + calendar */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* CTA card */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-xl bg-card border border-border shadow-elevated p-6 space-y-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Gratis toegang</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">€0</p>
              </div>
              {event.ctaLink ? (
                <Button asChild className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 text-base font-semibold gap-2">
                  <a href={event.ctaLink} target="_blank" rel="noopener noreferrer">
                    {event.ctaButtonText || "Aanmelden"}<ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              ) : (
                <Button className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 text-base font-semibold">
                  Aanmelden
                </Button>
              )}
              <p className="text-[11px] text-center text-muted-foreground">Direct bevestigd • Geen account nodig</p>
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
                    const start = `${event.startDate.replace(/-/g, "")}T${event.startTime.replace(/:/g, "")}00`;
                    const end = event.endTime ? `${event.startDate.replace(/-/g, "")}T${event.endTime.replace(/:/g, "")}00` : start;
                    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&location=${encodeURIComponent(event.venue || "")}&details=${encodeURIComponent(event.shortDescription || "")}`, "_blank");
                  }}>
                  Google
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8"
                  onClick={() => {
                    const ics = [
                      "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
                      `DTSTART:${event.startDate.replace(/-/g, "")}T${event.startTime.replace(/:/g, "")}00`,
                      `SUMMARY:${event.title}`,
                      `LOCATION:${event.venue || ""}`,
                      `DESCRIPTION:${event.shortDescription || ""}`,
                      "END:VEVENT", "END:VCALENDAR"
                    ].join("\r\n");
                    const blob = new Blob([ics], { type: "text/calendar" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${event.slug}.ics`; a.click();
                  }}>
                  .ics downloaden
                </Button>
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
                  <a href={`https://wa.me/?text=${encodeURIComponent(event.whatsappShareText || shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer">
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
            </motion.div>

            {/* Powered by */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-muted-foreground/50">
                Gepresenteerd via <span className="font-semibold text-muted-foreground/70">TX PromoShare</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer spacer */}
      <div className="h-16" />

      {/* JSON-LD for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        description: event.shortDescription || event.fullDescription,
        startDate: `${event.startDate}T${event.startTime}`,
        endDate: event.endDate ? `${event.endDate}T${event.endTime || event.startTime}` : undefined,
        location: event.venue ? { "@type": "Place", name: event.venue, address: event.address } : undefined,
        organizer: event.organizer ? { "@type": "Organization", name: event.organizer } : undefined,
        image: heroImg,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      }) }} />
    </div>
  );
}
