import { Code2, Copy, Check, Eye, Plus, Palette, Settings2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { EmptyState } from "@/components/EmptyState";

const widgetTypes = [
  {
    key: "agenda",
    title: t.widgets.agenda,
    desc: "Toon al je aankomende evenementen als een overzichtelijke agenda op je website. Bezoekers zien altijd wat er speelt.",
    preview: "📅 Agenda overzicht",
    code: `<div id="tx-agenda-widget" data-tenant="cafe-de-kroeg" data-theme="light"></div>\n<script src="https://txpromoshare.nl/widget.js" async></script>`,
    features: ["Automatisch bijgewerkt", "Responsive design", "Jouw huisstijl kleuren", "Klikt door naar eventpagina"],
  },
  {
    key: "event",
    title: t.widgets.singleEvent,
    desc: "Highlight één specifiek evenement als een compacte promo card. Ideaal voor je homepage of blogpost.",
    preview: "🎯 Enkel event card",
    code: `<div id="tx-event-widget" data-event="live-jazz-avond" data-theme="light"></div>\n<script src="https://txpromoshare.nl/widget.js" async></script>`,
    features: ["Compacte weergave", "Automatisch verwijderd na afloop", "CTA knop inbegrepen", "Social proof optioneel"],
  },
];

export default function WidgetsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.widgets.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Embed je agenda of een enkel evenement op je website</p>
        </div>
        <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
          <Plus className="w-4 h-4" />Nieuwe widget
        </Button>
      </div>

      {/* How it works */}
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

      <div className="grid md:grid-cols-2 gap-5">
        {widgetTypes.map((w, i) => (
          <motion.div
            key={w.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl bg-card border border-border shadow-card overflow-hidden"
          >
            {/* Preview area */}
            <div className="h-28 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center border-b border-border">
              <span className="text-3xl">{w.preview.split(" ")[0]}</span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-display font-bold text-foreground">{w.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{w.desc}</p>
              </div>

              {/* Features */}
              <ul className="space-y-1.5">
                {w.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Code */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{t.widgets.embedInstructions}:</p>
                <code className="block text-[11px] bg-secondary p-3 rounded-lg text-muted-foreground whitespace-pre-wrap font-mono">{w.code}</code>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copy(w.key, w.code)} className="gap-2 flex-1">
                  {copied === w.key ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                  {copied === w.key ? "Gekopieerd!" : "Kopieer code"}
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Palette className="w-4 h-4" />Stijl
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <UpgradeBanner feature="Onbeperkt widgets & geavanceerde stijlopties" plan="Pro" compact />
    </div>
  );
}
