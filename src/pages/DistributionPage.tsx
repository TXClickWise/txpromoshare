import { Share2, Copy, MessageCircle, Link as LinkIcon, Code2, Smartphone, Check, ExternalLink, QrCode, Mail } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { mockEvents } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { UpgradeBanner } from "@/components/UpgradeBanner";

const channels = [
  { id: "link", icon: LinkIcon, label: "Deel link", color: "text-primary", bg: "bg-primary/10" },
  { id: "whatsapp", icon: MessageCircle, label: "WhatsApp", color: "text-accent", bg: "bg-accent/10" },
  { id: "embed", icon: Code2, label: "Embed code", color: "text-primary", bg: "bg-primary/10" },
  { id: "social", icon: Share2, label: "Social media", color: "text-primary", bg: "bg-primary/10" },
  { id: "email", icon: Mail, label: "E-mail", color: "text-highlight", bg: "bg-highlight/10" },
  { id: "qr", icon: QrCode, label: "QR-code", color: "text-foreground", bg: "bg-secondary" },
];

export default function DistributionPage() {
  const publishedEvents = mockEvents.filter(e => e.status === "published");
  const [selectedEvent, setSelectedEvent] = useState(publishedEvents[0]?.id || "");
  const [copied, setCopied] = useState<string | null>(null);
  const event = mockEvents.find((e) => e.id === selectedEvent) || publishedEvents[0];

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

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
  const embedCode = `<div id="tx-agenda" data-tenant="cafe-de-kroeg"></div>\n<script src="https://txpromoshare.nl/widget.js"></script>`;
  const whatsappText = event?.whatsappShareText || `🎉 ${event?.title}\n📅 ${new Date(event?.startDate || "").toLocaleDateString("nl-NL")} om ${event?.startTime}\n📍 ${event?.venue}\n\n👉 Meer info: ${shareUrl}`;
  const socialText = event?.socialShareText || `${event?.title} 🎉 ${new Date(event?.startDate || "").toLocaleDateString("nl-NL")} bij ${event?.venue}. Meer info: ${shareUrl}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.distribution.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.distribution.subtitle}</p>
      </div>

      {/* Event selector */}
      <div className="flex items-center gap-3">
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
          <SelectContent>
            {publishedEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />Publieke pagina
          </Button>
        </a>
      </div>

      {/* Channel quick-access bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {channels.map((ch) => (
          <button
            key={ch.id}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:shadow-card transition-all ${ch.bg}`}
            onClick={() => {
              if (ch.id === "link") copyText("link", shareUrl);
              if (ch.id === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank");
            }}
          >
            <ch.icon className={`w-5 h-5 ${ch.color}`} />
            <span className="text-[10px] font-medium text-foreground">{ch.label}</span>
          </button>
        ))}
      </div>

      {/* Distribution cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Share link */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground text-sm">{t.distribution.shareLink}</h3>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-secondary p-3 rounded-lg text-muted-foreground overflow-x-auto">{shareUrl}</code>
            <Button variant="outline" size="sm" onClick={() => copyText("link", shareUrl)}>
              {copied === "link" ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        {/* WhatsApp */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-foreground text-sm">{t.distribution.shareWhatsApp}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3 bg-secondary p-3 rounded-lg whitespace-pre-line">{whatsappText}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => copyText("wa", whatsappText)} className="gap-2">
              {copied === "wa" ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              Kopieer
            </Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2 gradient-accent text-accent-foreground border-0 hover:opacity-90">
                <Smartphone className="w-4 h-4" />Stuur via WhatsApp
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Embed code */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground text-sm">{t.distribution.embedCode}</h3>
          </div>
          <code className="block text-xs bg-secondary p-3 rounded-lg text-muted-foreground mb-3 overflow-x-auto whitespace-pre-wrap">{embedCode}</code>
          <Button variant="outline" size="sm" onClick={() => copyText("embed", embedCode)} className="gap-2">
            {copied === "embed" ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            Kopieer code
          </Button>
        </motion.div>

        {/* Social snippet */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground text-sm">{t.distribution.socialSnippet}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3 bg-secondary p-3 rounded-lg">{socialText}</p>
          <Button variant="outline" size="sm" onClick={() => copyText("social", socialText)} className="gap-2">
            {copied === "social" ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            Kopieer snippet
          </Button>
        </motion.div>
      </div>

      {/* Upgrade banner for advanced distribution */}
      <UpgradeBanner feature="Geavanceerde distributie: QR-codes, e-mail templates, automatische CRM sync" plan="Pro" />
    </div>
  );
}
