import { Code2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function WidgetsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const agendaCode = `<div id="tx-agenda-widget" data-tenant="cafe-de-kroeg"></div>\n<script src="https://txpromoshare.nl/widget.js"></script>`;
  const eventCode = `<div id="tx-event-widget" data-event="live-jazz-avond"></div>\n<script src="https://txpromoshare.nl/widget.js"></script>`;

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.widgets.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Embed je agenda of een enkel evenement op je website</p>
      </div>

      {[
        { key: "agenda", title: t.widgets.agenda, desc: "Toon al je aankomende evenementen in een overzichtelijke agenda op je website.", code: agendaCode },
        { key: "event", title: t.widgets.singleEvent, desc: "Highlight één specifiek evenement als een compacte promo block.", code: eventCode },
      ].map((w) => (
        <div key={w.key} className="p-6 rounded-xl bg-card border border-border shadow-card space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">{w.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{w.desc}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-2">{t.widgets.embedInstructions}:</p>
            <code className="block text-xs bg-secondary p-3 rounded-lg text-muted-foreground whitespace-pre-wrap">{w.code}</code>
          </div>
          <Button variant="outline" size="sm" onClick={() => copy(w.key, w.code)} className="gap-2">
            {copied === w.key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Kopieer embed code
          </Button>
        </div>
      ))}
    </div>
  );
}
