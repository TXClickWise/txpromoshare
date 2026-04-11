import { Share2, Smartphone, Zap, BarChart3, ArrowRight, Sparkles, Loader2, Globe, Mail, QrCode, Code2, Shield } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { ChannelBar } from "@/components/distribution/ChannelBar";
import { ShareLinkCard } from "@/components/distribution/ShareLinkCard";
import { ShareTextCard } from "@/components/distribution/ShareTextCard";
import { DistributionStats } from "@/components/distribution/DistributionStats";
import { QRCodeDialog } from "@/components/distribution/QRCodeDialog";
import { QualityCheck } from "@/components/distribution/QualityCheck";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

function buildGoogleCalendarUrl(event: Tables<"events">, venueName: string) {
  const start = `${event.start_date.replace(/-/g, "")}T${event.start_time.replace(/:/g, "")}00`;
  const end = event.end_time
    ? `${(event.end_date || event.start_date).replace(/-/g, "")}T${event.end_time.replace(/:/g, "")}00`
    : start;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&location=${encodeURIComponent(venueName)}&details=${encodeURIComponent(event.short_description || "")}`;
}

export default function DistributionPage() {
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);

  // Channel-specific texts state
  const [channelTexts, setChannelTexts] = useState<Record<string, string>>({});

  const { data: publishedEvents = [], isLoading } = useQuery({
    queryKey: ["events-published", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("status", ["published", "scheduled"])
        .order("start_date", { ascending: true });
      return (data ?? []) as Tables<"events">[];
    },
    enabled: !!tenantId,
  });

  // Fetch venue for selected event
  const { data: venue } = useQuery({
    queryKey: ["event-venue", selectedEvent],
    queryFn: async () => {
      const ev = publishedEvents.find((e) => e.id === selectedEvent);
      if (!ev?.venue_id) return null;
      const { data } = await supabase.from("venues").select("*").eq("id", ev.venue_id).maybeSingle();
      return data;
    },
    enabled: !!selectedEvent && publishedEvents.length > 0,
  });

  // Fetch featured image URL for selected event
  const { data: featuredImageUrl } = useQuery({
    queryKey: ["event-image", selectedEvent],
    queryFn: async () => {
      const ev = publishedEvents.find((e) => e.id === selectedEvent);
      if (!ev?.featured_image_id) return null;
      const { data } = await supabase.from("media").select("original_url").eq("id", ev.featured_image_id).maybeSingle();
      return data?.original_url || null;
    },
    enabled: !!selectedEvent && publishedEvents.length > 0,
  });

  const { data: stats = [] } = useQuery({
    queryKey: ["distribution-stats", tenantId, selectedEvent],
    queryFn: async () => {
      if (!tenantId || !selectedEvent) return [];
      const { data } = await supabase
        .from("distribution_actions")
        .select("channel")
        .eq("tenant_id", tenantId)
        .eq("event_id", selectedEvent);
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach((d) => { counts[d.channel] = (counts[d.channel] || 0) + 1; });
      return Object.entries(counts).map(([channel, count]) => ({ channel, count }));
    },
    enabled: !!tenantId && !!selectedEvent,
  });

  if (publishedEvents.length > 0 && !selectedEvent) {
    setSelectedEvent(publishedEvents[0].id);
  }

  const event = publishedEvents.find((e) => e.id === selectedEvent) || publishedEvents[0];

  if (!isLoading && publishedEvents.length === 0) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">{t.distribution.title}</h1>
        <EmptyState
          icon={Share2}
          title="Nog geen gepubliceerde evenementen"
          description="Publiceer eerst een evenement om het te kunnen verspreiden via WhatsApp, je website of social media."
          actionLabel="Evenement aanmaken"
          actionTo="/app/events/new"
        />
      </div>
    );
  }

  if (isLoading || !event) {
    return <div className="text-muted-foreground text-sm">Laden...</div>;
  }

  const publicShareUrl = `https://txeventshare.nl/e/${event.slug}`;
  const previewShareUrl = `https://txeventshare.nl/s/${event.slug}.html`;
  const dateStr = new Date(event.start_date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = event.start_time?.slice(0, 5) || "";
  const venueName = venue?.name || "Locatie volgt";
  const calendarUrl = buildGoogleCalendarUrl(event, venueName);
  const ctaText = event.cta_button_text || "Meer info";

  // Default texts per channel — organisator-perspectief
  const defaultTexts = {
    whatsapp: `${event.title}\n\n📅 ${dateStr}${timeStr ? ` om ${timeStr}` : ""}\n📍 ${venueName}\n\nBekijk alle details van dit evenement in de previewkaart van WhatsApp.`,
    instagram: event.social_share_text ||
      `${event.title}\n\n${dateStr} | ${timeStr}\n${event.short_description || ""}\n\nLink in bio\n\n#event #horeca #uitagenda`,
    tiktok: `${event.title}\n\n${dateStr} om ${timeStr}\n${event.short_description || ""}\n\n#event #uitagenda #horeca`,
    teaser: event.short_description || `${event.title} — ${dateStr}. Wees erbij!`,
    newsletter: `Binnenkort in de agenda: ${event.title}!\n\n${event.short_description || `Op ${dateStr} om ${timeStr} is het zover.`}\n\nBekijk alle details en meld je aan: ${publicShareUrl}`,
    website: `<strong>${event.title}</strong> — ${dateStr} om ${timeStr}. ${event.short_description || "Bekijk de details en schrijf je in."} <a href="${publicShareUrl}">Meer info →</a>`,
    promo: `${event.title}\n\n${event.short_description || ""}\n\n${dateStr}\n${timeStr}\n\nMeer weten? Bekijk alle details op:\n${publicShareUrl}`,
    gbp: `${event.title} — ${dateStr} om ${timeStr}. ${event.short_description || "Bekijk de details op onze pagina."} ${venueName}. Meer informatie: ${publicShareUrl}`,
  };

  const getText = (channel: string) => channelTexts[channel] || defaultTexts[channel as keyof typeof defaultTexts] || "";
  const setText = (channel: string, text: string) => setChannelTexts((prev) => ({ ...prev, [channel]: text }));

  const trackAction = async (channel: string) => {
    if (!tenantId || !user) return;
    await supabase.from("distribution_actions").insert({
      tenant_id: tenantId,
      event_id: event.id,
      channel: channel as any,
      performed_by: user.id,
      action_type: "share",
    });
  };

  // AI: generate all channel texts at once
  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      const prompt = `Genereer promotieteksten voor dit evenement:
Titel: ${event.title}
Datum: ${dateStr}
Tijd: ${timeStr}
Locatie: ${venueName}
Beschrijving: ${event.short_description || "Geen beschrijving"}
Volledige beschrijving: ${event.full_description || "Geen"}
Link: ${publicShareUrl}
CTA: ${ctaText}
Agenda link: ${calendarUrl}
Organisatie: ${tenant?.name || ""}
${tenant?.tone_of_voice ? `Tone of voice: ${tenant.tone_of_voice}` : ""}
${tenant?.tagline ? `Tagline: ${tenant.tagline}` : ""}`;

      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: { prompt, task: "distribution_content" },
      });
      if (error) throw error;

      const parsed = JSON.parse(data.result);
      setChannelTexts({
        whatsapp: getText("whatsapp"),
        instagram: parsed.instagram || getText("instagram"),
        tiktok: parsed.tiktok || getText("tiktok"),
        teaser: parsed.teaser || getText("teaser"),
        newsletter: parsed.newsletter || getText("newsletter"),
        website: parsed.website || getText("website"),
        promo: parsed.promo || getText("promo"),
        gbp: parsed.gbp || getText("gbp"),
      });
      toast.success("Alle teksten gegenereerd!");
    } catch (err: any) {
      console.error("AI generate error:", err);
      toast.error("Genereren mislukt. Probeer het opnieuw.");
    } finally {
      setGenerating(false);
    }
  };

  // AI: rewrite single channel text
  const handleRewrite = async (text: string, instruction: string): Promise<string> => {
    setRewriting(instruction);
    try {
      const prompt = `Herschrijf deze tekst. Instructie: "${instruction}"

Oorspronkelijke tekst:
${text}

Context:
Event: ${event.title}
Datum: ${dateStr}
Link: ${publicShareUrl}
${tenant?.tone_of_voice ? `Tone of voice: ${tenant.tone_of_voice}` : ""}`;

      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: { prompt, task: "rewrite_channel" },
      });
      if (error) throw error;
      toast.success("Tekst herschreven");
      return data.result;
    } catch {
      toast.error("Herschrijven mislukt");
      return text;
    } finally {
      setRewriting(null);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(previewShareUrl)}`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.distribution.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Bereid je content voor en deel je event overal — in één klik.</p>
        </div>
        <Button onClick={handleGenerateAll} disabled={generating} className="gap-2 shrink-0">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Genereren..." : "Genereer alle teksten"}
        </Button>
      </div>

      {/* Event selector */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-card">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground shrink-0">Event:</span>
        <Select value={selectedEvent} onValueChange={(v) => { setSelectedEvent(v); setChannelTexts({}); }}>
          <SelectTrigger className="max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {publishedEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                <div className="flex items-center gap-2">
                  <span>{e.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(e.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick share bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <ChannelBar
          shareUrl={publicShareUrl}
          previewShareUrl={previewShareUrl}
          whatsappText={getText("whatsapp")}
          socialText={getText("instagram")}
          eventTitle={event.title}
          eventImageUrl={featuredImageUrl || undefined}
          onChannelClick={trackAction}
          onShowQR={() => setShowQR(true)}
        />
      </motion.div>

      {/* Quality Check */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <QualityCheck
          event={event}
          texts={{
            whatsapp: getText("whatsapp"),
            social: getText("instagram"),
            newsletter: getText("newsletter"),
            website: getText("website"),
          }}
        />
      </motion.div>

      {/* Event Link & QR */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <ShareLinkCard url={publicShareUrl} eventId={event.id} />
      </motion.div>

      {/* Channel-specific content sections */}
      <div className="space-y-3">
        <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <img src="/images/whatsapp-icon.png" alt="WhatsApp" className="w-4 h-4 rounded-sm" />
          WhatsApp
        </h2>
        <ShareTextCard
          icon={<img src="/images/whatsapp-icon.png" alt="WhatsApp" className="w-4 h-4 rounded-sm" />}
          title="WhatsApp bericht"
          description="Vanuit jou als organisator aan je relaties"
          text={getText("whatsapp")}
          onTextChange={(t) => setText("whatsapp", t)}
          charLimit={500}
          onAiRewrite={handleRewrite}
          aiLoading={!!rewriting}
          actions={
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2 bg-green-600 text-white hover:bg-green-700 border-0 text-xs">
                <Smartphone className="w-3.5 h-3.5" />WhatsApp
              </Button>
            </a>
          }
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <img src="/images/instagram-icon.png" alt="Instagram" className="w-4 h-4 rounded-sm" />
          Social media
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <ShareTextCard
            icon={<img src="/images/instagram-icon.png" alt="Instagram" className="w-4 h-4 rounded-sm" />}
            title="Instagram / Facebook post"
            description="Met hashtags, visueel gericht"
            text={getText("instagram")}
            onTextChange={(t) => setText("instagram", t)}
            charLimit={2200}
            onAiRewrite={handleRewrite}
            aiLoading={!!rewriting}
          />
          <ShareTextCard
            icon={<img src="/images/tiktok-icon.png" alt="TikTok" className="w-4 h-4 rounded-sm" />}
            title="TikTok caption"
            description="Korte, pakkende tekst voor TikTok"
            text={getText("tiktok")}
            onTextChange={(t) => setText("tiktok", t)}
            charLimit={2200}
            onAiRewrite={handleRewrite}
            aiLoading={!!rewriting}
          />
        </div>
        <ShareTextCard
          icon={<Share2 className="w-4 h-4 text-primary" />}
          title="Korte teaser"
          description="Voor stories of advertenties"
          text={getText("teaser")}
          onTextChange={(t) => setText("teaser", t)}
          charLimit={160}
          onAiRewrite={handleRewrite}
          aiLoading={!!rewriting}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <img src="/images/google-icon.png" alt="Google" className="w-4 h-4" />
          Google Bedrijfsprofiel
        </h2>
        <ShareTextCard
          icon={<img src="/images/google-icon.png" alt="Google" className="w-4 h-4" />}
          title="Google Bedrijfsprofiel post"
          description="Zakelijke post voor lokale vindbaarheid"
          text={getText("gbp")}
          onTextChange={(t) => setText("gbp", t)}
          charLimit={1500}
          onAiRewrite={handleRewrite}
          aiLoading={!!rewriting}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          Website & nieuwsbrief
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <ShareTextCard
            icon={<Globe className="w-4 h-4 text-blue-600" />}
            title="Website promo snippet"
            description="HTML-klaar voor je website"
            text={getText("website")}
            onTextChange={(t) => setText("website", t)}
            onAiRewrite={handleRewrite}
            aiLoading={!!rewriting}
          />
          <ShareTextCard
            icon={<Mail className="w-4 h-4 text-orange-600" />}
            title="Nieuwsbrief introductie"
            description="Kopieer en plak in je mailing tool"
            text={getText("newsletter")}
            onTextChange={(t) => setText("newsletter", t)}
            onAiRewrite={handleRewrite}
            aiLoading={!!rewriting}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          Uitgebreide promotietekst
        </h2>
        <ShareTextCard
          icon={<Share2 className="w-4 h-4 text-primary" />}
          title="Langere promotietekst"
          description="Voor persberichten, uitnodigingen of uitgebreide promotie"
          text={getText("promo")}
          onTextChange={(t) => setText("promo", t)}
          onAiRewrite={handleRewrite}
          aiLoading={!!rewriting}
        />
      </div>

      {/* Widgets section */}
      <div className="space-y-3">
        <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          Widgets & embeds
        </h2>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground text-sm mb-1">Embed op je website</h3>
            <p className="text-xs text-muted-foreground">
              Plaats een agenda- of eventwidget op je eigen website. Altijd up-to-date, in jouw huisstijl.
            </p>
          </div>
          <Link to="/app/widgets">
            <Button variant="outline" className="gap-2 shrink-0">
              Widgets beheren <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats section */}
      <div className="space-y-3">
        <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Statistieken
        </h2>
        <DistributionStats stats={stats} />
      </div>

      {/* QR Dialog */}
      <QRCodeDialog
        open={showQR}
        onOpenChange={setShowQR}
        url={shareUrl}
        eventTitle={event.title}
      />
    </div>
  );
}
