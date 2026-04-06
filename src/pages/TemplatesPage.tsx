import { Link } from "react-router-dom";
import { Layers, Calendar } from "lucide-react";
import { t } from "@/lib/i18n";

const templates = [
  { id: "sport", emoji: "⚽", name: t.events.categories.sport, desc: "Toernooien, wedstrijden, sportdagen" },
  { id: "proeverij", emoji: "🍷", name: t.events.categories.proeverij, desc: "Wijn-, bier-, whisky- en foodproeverijen" },
  { id: "live-muziek", emoji: "🎵", name: t.events.categories.liveMuziek, desc: "Bands, DJ's, jazz, akoestische sessies" },
  { id: "thema-avond", emoji: "🎭", name: t.events.categories.themaAvond, desc: "Quiz, karaoke, themafeesten, specials" },
  { id: "overig", emoji: "✨", name: t.events.categories.overig, desc: "Alles wat niet in een categorie past" },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.templates}</h1>
        <p className="text-sm text-muted-foreground mt-1">Gebruik een sjabloon om snel een evenement aan te maken</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tmpl) => (
          <Link
            key={tmpl.id}
            to={`/app/events/new?template=${tmpl.id}`}
            className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all"
          >
            <div className="text-3xl mb-3">{tmpl.emoji}</div>
            <h3 className="font-display font-semibold text-foreground mb-1">{tmpl.name}</h3>
            <p className="text-sm text-muted-foreground">{tmpl.desc}</p>
          </Link>
        ))}
        <div className="p-6 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center opacity-60">
          <Layers className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Meer sjablonen volgen binnenkort</p>
        </div>
      </div>
    </div>
  );
}
