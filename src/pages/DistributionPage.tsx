import { Share2, MessageCircle, Smartphone, Zap, BarChart3 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { mockEvents } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { ChannelBar } from "@/components/distribution/ChannelBar";
import { ShareLinkCard } from "@/components/distribution/ShareLinkCard";
import { ShareTextCard } from "@/components/distribution/ShareTextCard";
import { EmbedCodeCard } from "@/components/distribution/EmbedCodeCard";
import { DistributionStats } from "@/components/distribution/DistributionStats";
import { toast } from "sonner";

export default function DistributionPage() {
  const publishedEvents = mockEvents.filter(e => e.status === "published" || e.status === "scheduled");
  const [selectedEvent, setSelectedEvent] = useState(publishedEvents[0]?.id || "");
  const [activeTab, setActiveTab] = useState("share");
  const event = mockEvents.find((e) => e.id === selectedEvent) || publishedEvents[0];

  if (publishedEvents.length === 0) {
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

  const shareUrl = `https://txpromoshare.nl/e/${event?.slug}`;
  const tenantSlug = "cafe-de-kroeg"; // Will come from auth context

  const whatsappText = event?.whatsappShareText ||
    `🎉 ${event?.title}\n📅 ${new Date(event?.startDate || "").toLocaleDateString("nl-NL")} om ${event?.startTime}\n📍 ${event?.venue}\n\n👉 Meer info & reserveren:\n${shareUrl}`;

  const socialText = event?.socialShareText ||
    `${event?.title} 🎉\n📅 ${new Date(event?.startDate || "").toLocaleDateString("nl-NL")} | ${event?.startTime}\n📍 ${event?.venue}\n\nMeer info: ${shareUrl}`;

  const emailText = `Beste,\n\nGraag nodigen wij u uit voor ${event?.title}.\n\n📅 ${new Date(event?.startDate || "").toLocaleDateString("nl-NL")} om ${event?.startTime}\n📍 ${event?.venue}\n\n${event?.shortDescription || ""}\n\nBekijk alle details en reserveer: ${shareUrl}\n\nMet vriendelijke groet`;

  const mockStats = [
    { channel: "link", count: 24 },
    { channel: "whatsapp", count: 18 },
    { channel: "embed", count: 156 },
    { channel: "social", count: 12 },
  ];

  const trackAction = (channel: string) => {
    // Will track to distribution_actions table
    console.log("Track distribution action:", channel, event?.id);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.distribution.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Eén event, overal verspreid. Snel, consistent en on-brand.</p>
        </div>
      </div>

      {/* Event selector */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-card">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground shrink-0">Evenement:</span>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {publishedEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                <div className="flex items-center gap-2">
                  <span>{e.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(e.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick channel bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <ChannelBar
          shareUrl={shareUrl}
          whatsappText={whatsappText}
          onChannelClick={(ch) => {
            trackAction(ch);
            if (ch === "embed") setActiveTab("widgets");
            if (ch === "social") setActiveTab("share");
          }}
        />
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="share" className="gap-2 text-xs">
            <Share2 className="w-3.5 h-3.5" />Delen
          </TabsTrigger>
          <TabsTrigger value="widgets" className="gap-2 text-xs">
            <Zap className="w-3.5 h-3.5" />Widgets
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 text-xs">
            <BarChart3 className="w-3.5 h-3.5" />Statistieken
          </TabsTrigger>
        </TabsList>

        {/* Share Tab */}
        <TabsContent value="share" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ShareLinkCard url={shareUrl} />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <ShareTextCard
                icon={<MessageCircle className="w-4 h-4 text-accent" />}
                title="WhatsApp bericht"
                description="Klaar om te sturen naar je gasten of groepen"
                text={whatsappText}
                onTextChange={(text) => toast.success("WhatsApp tekst opgeslagen")}
                actions={
                  <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-2 gradient-accent text-accent-foreground border-0 hover:opacity-90">
                      <Smartphone className="w-3.5 h-3.5" />Stuur via WhatsApp
                    </Button>
                  </a>
                }
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ShareTextCard
                icon={<Share2 className="w-4 h-4 text-primary" />}
                title="Social media tekst"
                description="Voor Instagram, Facebook, LinkedIn of X"
                text={socialText}
                onTextChange={(text) => toast.success("Social tekst opgeslagen")}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="md:col-span-2">
              <ShareTextCard
                icon={<span className="text-sm">✉️</span>}
                title="E-mail tekst"
                description="Kopieer en plak in je eigen e-mail of nieuwsbrief"
                text={emailText}
                onTextChange={(text) => toast.success("E-mail tekst opgeslagen")}
              />
            </motion.div>
          </div>
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="mt-4 space-y-4">
          <div className="rounded-xl bg-secondary/30 border border-border p-4">
            <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">1</span>
                Kies widget type
              </div>
              <span className="text-muted-foreground/30">→</span>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">2</span>
                Kopieer de code
              </div>
              <span className="text-muted-foreground/30">→</span>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">3</span>
                Plak op je website
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <EmbedCodeCard type="agenda" tenantSlug={tenantSlug} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <EmbedCodeCard type="single_event" tenantSlug={tenantSlug} eventSlug={event?.slug} />
            </motion.div>
          </div>

          <UpgradeBanner feature="Onbeperkt widgets, geavanceerde stijlopties & eigen branding" plan="Pro" compact />
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <DistributionStats stats={mockStats} />
          </motion.div>

          <div className="p-6 rounded-xl bg-card border border-border shadow-card text-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-foreground text-sm mb-1">Gedetailleerde analytics</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
              Bekijk precies hoe je evenementen verspreid worden: welke kanalen het beste werken, hoeveel kliks, en wanneer je gasten het meest actief zijn.
            </p>
            <UpgradeBanner feature="Geavanceerde distributie-analytics met klik-tracking en conversie-inzichten" plan="Pro" compact />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
