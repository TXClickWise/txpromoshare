import { Share2, Copy, MessageCircle, Link as LinkIcon, Code2, Smartphone, Check } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { mockEvents } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DistributionPage() {
  const [selectedEvent, setSelectedEvent] = useState(mockEvents[0].id);
  const [copied, setCopied] = useState<string | null>(null);
  const event = mockEvents.find((e) => e.id === selectedEvent) || mockEvents[0];

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareUrl = `https://txpromoshare.nl/e/${event.slug}`;
  const embedCode = `<iframe src="${shareUrl}/embed" width="100%" height="400" frameborder="0"></iframe>`;
  const whatsappText = event.whatsappShareText || `${event.title} - ${new Date(event.startDate).toLocaleDateString("nl-NL")} om ${event.startTime} bij ${event.venue}. Meer info: ${shareUrl}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.distribution.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.distribution.subtitle}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Selecteer evenement</label>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {mockEvents.filter(e => e.status === "published").map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {/* Share link */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground text-sm">{t.distribution.shareLink}</h3>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-secondary p-3 rounded-lg text-muted-foreground overflow-x-auto">{shareUrl}</code>
            <Button variant="outline" size="sm" onClick={() => copyText("link", shareUrl)}>
              {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-foreground text-sm">{t.distribution.shareWhatsApp}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3 bg-secondary p-3 rounded-lg">{whatsappText}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => copyText("wa", whatsappText)} className="gap-2">
              {copied === "wa" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Kopieer tekst
            </Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2 gradient-accent text-accent-foreground border-0 hover:opacity-90">
                <Smartphone className="w-4 h-4" />Open WhatsApp
              </Button>
            </a>
          </div>
        </div>

        {/* Embed code */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground text-sm">{t.distribution.embedCode}</h3>
          </div>
          <code className="block text-xs bg-secondary p-3 rounded-lg text-muted-foreground mb-3 overflow-x-auto whitespace-pre-wrap">{embedCode}</code>
          <Button variant="outline" size="sm" onClick={() => copyText("embed", embedCode)} className="gap-2">
            {copied === "embed" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {t.common.copy}
          </Button>
        </div>

        {/* Social snippet */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground text-sm">{t.distribution.socialSnippet}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3 bg-secondary p-3 rounded-lg">
            {event.socialShareText || `${event.title} 🎉 ${new Date(event.startDate).toLocaleDateString("nl-NL")} bij ${event.venue}. Meer info: ${shareUrl}`}
          </p>
          <Button variant="outline" size="sm" onClick={() => copyText("social", event.socialShareText || "")} className="gap-2">
            {copied === "social" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Kopieer snippet
          </Button>
        </div>
      </div>
    </div>
  );
}
