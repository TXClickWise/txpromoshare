import { Share2, MessageCircle, Smartphone, Zap, BarChart3, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { ChannelBar } from "@/components/distribution/ChannelBar";
import { ShareLinkCard } from "@/components/distribution/ShareLinkCard";
import { ShareTextCard } from "@/components/distribution/ShareTextCard";
import { DistributionStats } from "@/components/distribution/DistributionStats";
import { QRCodeDialog } from "@/components/distribution/QRCodeDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

export default function DistributionPage() {
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [activeTab, setActiveTab] = useState("share");
  const [showQR, setShowQR] = useState(false);

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

  // Auto-select first event
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

  const shareUrl = `https://txeventshare.nl/e/${event.slug}`;

  const whatsappText = event.whatsapp_share_text ||
    `🎉 ${event.title}\n📅 ${new Date(event.start_date).toLocaleDateString("nl-NL")} om ${event.start_time}\n\n👉 Meer info:\n${shareUrl}`;

  const socialText = event.social_share_text ||
    `${event.title} 🎉\n📅 ${new Date(event.start_date).toLocaleDateString("nl-NL")} | ${event.start_time}\n\nMeer info: ${shareUrl}`;

  const emailText = `Beste,\n\nGraag nodigen wij u uit voor ${event.title}.\n\n📅 ${new Date(event.start_date).toLocaleDateString("nl-NL")} om ${event.start_time}\n\n${event.short_description || ""}\n\nBekijk alle details: ${shareUrl}\n\nMet vriendelijke groet`;

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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.distribution.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Kies een evenement en deel het overal — in één klik.</p>
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
          shareUrl={shareUrl}
          whatsappText={whatsappText}
          socialText={socialText}
          eventTitle={event.title}
          onChannelClick={(ch) => {
            trackAction(ch);
          }}
          onShowQR={() => setShowQR(true)}
        />
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="share" className="gap-2 text-xs"><Share2 className="w-3.5 h-3.5" />Teksten</TabsTrigger>
          <TabsTrigger value="widgets" className="gap-2 text-xs"><Zap className="w-3.5 h-3.5" />Widgets</TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 text-xs"><BarChart3 className="w-3.5 h-3.5" />Statistieken</TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ShareLinkCard url={shareUrl} eventId={event.id} />
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <ShareTextCard
                icon={<MessageCircle className="w-4 h-4 text-green-600" />}
                title="WhatsApp bericht"
                description="Klaar om te sturen naar je gasten of groepen"
                text={whatsappText}
                onTextChange={() => toast.success("WhatsApp tekst opgeslagen")}
                actions={
                  <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-2 bg-green-600 text-white hover:bg-green-700 border-0">
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
                onTextChange={() => toast.success("Social tekst opgeslagen")}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="md:col-span-2">
              <ShareTextCard
                icon={<span className="text-sm">✉️</span>}
                title="E-mail tekst"
                description="Kopieer en plak in je eigen e-mail of nieuwsbrief"
                text={emailText}
                onTextChange={() => toast.success("E-mail tekst opgeslagen")}
              />
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="widgets" className="mt-4 space-y-4">
          <div className="p-6 rounded-xl bg-card border border-border shadow-card text-center space-y-4">
            <Zap className="w-8 h-8 text-primary mx-auto" />
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">Widgets beheren</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Maak en configureer je embed widgets op de Widgets pagina. Daar kun je het type kiezen, de stijl aanpassen en de embed-code kopiëren.
              </p>
            </div>
            <Link to="/app/widgets">
              <Button className="gap-2">
                Naar Widgets <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <DistributionStats stats={stats} />
          </motion.div>
        </TabsContent>
      </Tabs>

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
