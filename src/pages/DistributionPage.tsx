import { Share2, Smartphone, Zap, BarChart3, ArrowRight, Sparkles, Loader2, Globe, Mail, QrCode, Code2, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useUILanguage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { ChannelBar } from "@/components/distribution/ChannelBar";
import { ShareLinkCard } from "@/components/distribution/ShareLinkCard";
import { ShareTextCard } from "@/components/distribution/ShareTextCard";
import { ChannelCopyGroup, type CopyVariant } from "@/components/distribution/ChannelCopyGroup";
import { DistributionStats } from "@/components/distribution/DistributionStats";
import { QRCodeDialog } from "@/components/distribution/QRCodeDialog";
import { QualityCheck } from "@/components/distribution/QualityCheck";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useEventCopyAutosave } from "@/hooks/useEventCopyAutosave";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

function buildGoogleCalendarUrl(event: Tables<"events">, venueName: string) {
  const start = `${event.start_date.replace(/-/g, "")}T${event.start_time.replace(/:/g, "")}00`;
  const end = event.end_time
    ? `${(event.end_date || event.start_date).replace(/-/g, "")}T${event.end_time.replace(/:/g, "")}00`
    : start;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&location=${encodeURIComponent(venueName)}&details=${encodeURIComponent(event.short_description || "")}`;
}

/** Map internal channel/variant id -> events table column for autosave */
const CHANNEL_DB_MAP: Record<string, string> = {
  whatsapp: "whatsapp_share_text",
  whatsapp_short: "whatsapp_share_text_short",
  instagram: "instagram_share_text",
  social: "social_share_text",
  teaser: "teaser_text",
  promo: "long_promo_text",
  newsletter: "newsletter_intro",
  website: "website_snippet",
};

export default function DistributionPage() {
  const { t } = useTranslation();
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);

  // Channel-specific texts state (in-memory, hydrated from DB on event change)
  const [channelTexts, setChannelTexts] = useState<Record<string, string>>({});
  const { schedule: scheduleSave, saving, saved } = useEventCopyAutosave(selectedEvent);

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

  // Pre-select event from ?event= URL param (e.g. coming from publish-success modal)
  useEffect(() => {
    const eventParam = searchParams.get("event");
    if (eventParam && !selectedEvent && publishedEvents.some((e) => e.id === eventParam)) {
      setSelectedEvent(eventParam);
    }
  }, [searchParams, publishedEvents, selectedEvent]);

  // Hydrate channel texts from saved DB columns when the selected event changes
  useEffect(() => {
    const ev = publishedEvents.find((e) => e.id === selectedEvent);
    if (!ev) return;
    const next: Record<string, string> = {};
    for (const [channelId, column] of Object.entries(CHANNEL_DB_MAP)) {
      const saved = (ev as unknown as Record<string, string | null>)[column];
      if (saved && saved.trim()) next[channelId] = saved;
    }
    setChannelTexts(next);
  }, [selectedEvent, publishedEvents]);

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
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">{t("distribution.title")}</h1>
        <EmptyState
          icon={Share2}
          title={t("distribution.noPublishedEvents")}
          description={t("distribution.noPublishedEventsDesc")}
          actionLabel={t("distribution.createEventCta")}
          actionTo="/app/events/new"
        />
      </div>
    );
  }

  if (isLoading || !event) {
    return <div className="text-muted-foreground text-sm">{t("distribution.loading")}</div>;
  }

  const publicShareUrl = `https://txeventshare.nl/e/${event.slug}`;
  const ogProxyUrl = `https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/og-proxy?slug=${encodeURIComponent(event.slug)}`;
  const dateStr = new Date(event.start_date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = event.start_time?.slice(0, 5) || "";
  const venueName = venue?.name || t("distribution.venueFallback");
  const calendarUrl = buildGoogleCalendarUrl(event, venueName);
  const ctaText = event.cta_button_text || t("distribution.ctaFallback");

  // Default texts per channel — organisator-perspectief
  const defaultTexts = {
    whatsapp: `${event.title}\n\n📅 ${dateStr}${timeStr ? ` om ${timeStr}` : ""}\n📍 ${venueName}\n\nBekijk alle details van dit evenement in de previewkaart van WhatsApp.`,
    whatsapp_short: `${event.title} — ${dateStr}${timeStr ? ` ${timeStr}` : ""} bij ${venueName}. Kom je ook?`,
    instagram: event.social_share_text ||
      `${event.title}\n\n${dateStr} | ${timeStr}\n${event.short_description || ""}\n\nLink in bio\n\n#event #horeca #uitagenda`,
    tiktok: `${event.title}\n\n${dateStr} om ${timeStr}\n${event.short_description || ""}\n\n#event #uitagenda #horeca`,
    teaser: event.short_description || `${event.title} — ${dateStr}. Wees erbij!`,
    newsletter: `Binnenkort in de agenda: ${event.title}!\n\n${event.short_description || `Op ${dateStr} om ${timeStr} is het zover.`}\n\nBekijk alle details en meld je aan: ${publicShareUrl}`,
    website: `<strong>${event.title}</strong> — ${dateStr} om ${timeStr}. ${event.short_description || "Bekijk de details en schrijf je in."} <a href="${publicShareUrl}">Meer info →</a>`,
    promo: `${event.title}\n\n${event.short_description || ""}\n\n${dateStr}\n${timeStr}\n\nMeer weten? Bekijk alle details op:\n${publicShareUrl}`,
    gbp: `${event.title} — ${dateStr} om ${timeStr}. ${event.short_description || "Bekijk de details op onze pagina."} ${venueName}. Meer informatie: ${publicShareUrl}`,
  };

  const getText = (channel: string) => channelTexts[channel] ?? defaultTexts[channel as keyof typeof defaultTexts] ?? "";
  const setText = (channel: string, text: string) => {
    setChannelTexts((prev) => ({ ...prev, [channel]: text }));
    // Persist to event DB column when one is mapped
    const dbColumn = CHANNEL_DB_MAP[channel];
    if (dbColumn) scheduleSave({ [dbColumn]: text });
  };

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
      toast.success(t("distribution.allGenerated"));
    } catch (err: any) {
      console.error("AI generate error:", err);
      toast.error(t("distribution.generateFailed"));
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
      toast.success(t("distribution.rewritten"));
      return data.result;
    } catch {
      toast.error(t("distribution.rewriteFailed"));
      return text;
    } finally {
      setRewriting(null);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(ogProxyUrl)}`;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">{t("distribution.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("distribution.subtitle")}</p>
        </div>
        <Button onClick={handleGenerateAll} disabled={generating} className="gap-2 shrink-0 w-full sm:w-auto">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? t("distribution.generating") : t("distribution.generateAll")}
        </Button>
      </div>

      {/* Event selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border shadow-card">
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">{t("distribution.eventLabel")}</span>
        </div>
        <Select value={selectedEvent} onValueChange={(v) => { setSelectedEvent(v); setChannelTexts({}); }}>
          <SelectTrigger className="w-full sm:max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {publishedEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                <div className="flex items-center gap-2">
                  <span className="truncate">{e.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(e.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ─────────── SECTIE 1: LINK & SNEL DELEN ─────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Share2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-display font-semibold text-foreground">{t("distribution.section1")}</h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">{t("distribution.section1Hint2")}</span>
        </div>

        <ShareLinkCard url={publicShareUrl} eventId={event.id} />

        <ChannelBar
            shareUrl={publicShareUrl}
            previewShareUrl={ogProxyUrl}
            whatsappText={getText("whatsapp")}
            socialText={getText("instagram")}
            eventTitle={event.title}
            eventImageUrl={featuredImageUrl || undefined}
            onChannelClick={trackAction}
            onShowQR={() => setShowQR(true)}
          />
      </section>

      {/* ─────────── SECTIE 2: KWALITEITSCHECK ─────────── */}
      <QualityCheck
          event={event}
          texts={{
            whatsapp: getText("whatsapp"),
            whatsapp_short: getText("whatsapp_short"),
            instagram: getText("instagram"),
            social: getText("social"),
            teaser: getText("teaser"),
            promo: getText("promo"),
            newsletter: getText("newsletter"),
            website: getText("website"),
          }}
        />

      {/* ─────────── SECTIE 3: COPY PER KANAAL ─────────── */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-display font-semibold text-foreground">{t("distribution.section2")}</h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">{t("distribution.section2Hint2")}</span>
        </div>

      {/* WhatsApp — kort & medium variants */}
      <ChannelCopyGroup
        icon={<img src="/images/whatsapp-icon.png" alt="WhatsApp" className="w-4 h-4 rounded-sm" />}
        title={t("distribution.wa.title")}
        subtitle={t("distribution.wa.subtitle")}
        saving={saving}
        saved={saved}
        onAiRewrite={handleRewrite}
        aiLoading={!!rewriting}
        onVariantChange={(id, t) => setText(id, t)}
        variants={[
          {
            id: "whatsapp_short",
            label: t("distribution.wa.shortLabel"),
            description: t("distribution.wa.shortDesc"),
            text: getText("whatsapp_short"),
            charLimit: 160,
          },
          {
            id: "whatsapp",
            label: t("distribution.wa.medLabel"),
            description: t("distribution.wa.medDesc"),
            text: getText("whatsapp"),
            charLimit: 500,
            recommended: true,
          },
        ]}
        actions={
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2 bg-green-600 text-white hover:bg-green-700 border-0 text-xs">
              <Smartphone className="w-3.5 h-3.5" />{t("distribution.wa.button")}
            </Button>
          </a>
        }
      />

      {/* Social — teaser / Instagram-Facebook / lange promo */}
      <ChannelCopyGroup
        icon={<img src="/images/instagram-icon.png" alt="Instagram" className="w-4 h-4 rounded-sm" />}
        title={t("distribution.social.title")}
        subtitle={t("distribution.social.subtitle")}
        saving={saving}
        saved={saved}
        onAiRewrite={handleRewrite}
        aiLoading={!!rewriting}
        onVariantChange={(id, t) => setText(id, t)}
        variants={[
          {
            id: "teaser",
            label: t("distribution.social.teaserLabel"),
            description: t("distribution.social.teaserDesc"),
            text: getText("teaser"),
            charLimit: 160,
          },
          {
            id: "instagram",
            label: t("distribution.social.postLabel"),
            description: t("distribution.social.postDesc"),
            text: getText("instagram"),
            charLimit: 2200,
            recommended: true,
          },
          {
            id: "promo",
            label: t("distribution.social.longLabel"),
            description: t("distribution.social.longDesc"),
            text: getText("promo"),
          },
        ]}
      />

      {/* TikTok blijft losstaand */}
      <ShareTextCard
        icon={<img src="/images/tiktok-icon.png" alt="TikTok" className="w-4 h-4 rounded-sm" />}
        title={t("distribution.tiktok.title")}
        description={t("distribution.tiktok.desc")}
        text={getText("tiktok")}
        onTextChange={(txt) => setText("tiktok", txt)}
        charLimit={2200}
        onAiRewrite={handleRewrite}
        aiLoading={!!rewriting}
      />

        <div className="space-y-3">
          <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <img src="/images/google-icon.png" alt="Google" className="w-3.5 h-3.5" />
            {t("distribution.gbp.section")}
          </h3>
          <ShareTextCard
            icon={<img src="/images/google-icon.png" alt="Google" className="w-4 h-4" />}
            title={t("distribution.gbp.title")}
            description={t("distribution.gbp.desc")}
            text={getText("gbp")}
            onTextChange={(txt) => setText("gbp", txt)}
            charLimit={1500}
            onAiRewrite={handleRewrite}
            aiLoading={!!rewriting}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-primary" />
            {t("distribution.web.section")}
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <ShareTextCard
              icon={<Globe className="w-4 h-4 text-primary" />}
              title={t("distribution.web.title")}
              description={t("distribution.web.desc")}
              text={getText("website")}
              onTextChange={(txt) => setText("website", txt)}
              onAiRewrite={handleRewrite}
              aiLoading={!!rewriting}
            />
            <ShareTextCard
              icon={<Mail className="w-4 h-4 text-accent" />}
              title={t("distribution.nl.title")}
              description={t("distribution.nl.desc")}
              text={getText("newsletter")}
              onTextChange={(txt) => setText("newsletter", txt)}
              onAiRewrite={handleRewrite}
              aiLoading={!!rewriting}
            />
          </div>
        </div>
      </section>

      {/* ─────────── SECTIE 3: VERSPREIDEN & METEN ─────────── */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-display font-semibold text-foreground">{t("distribution.section3")}</h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">— {t("distribution.section3Hint")}</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground text-sm mb-1">{t("distribution.embedTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("distribution.embedDesc")}
            </p>
          </div>
          <Link to="/app/widgets" className="shrink-0 w-full sm:w-auto">
            <Button variant="outline" className="gap-2 w-full sm:w-auto justify-center">
              {t("distribution.manageWidgets")} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            {t("distribution.statsHeader")}
          </h3>
          <DistributionStats stats={stats} />
        </div>
      </section>

      {/* QR Dialog */}
      <QRCodeDialog
        open={showQR}
        onOpenChange={setShowQR}
        url={publicShareUrl}
        eventTitle={event.title}
      />
    </div>
  );
}
