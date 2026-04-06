import { Link } from "react-router-dom";
import { Layers, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";

const templates = [
  { id: "sport", emoji: "⚽", name: t.events.categories.sport, desc: "Toernooien, wedstrijden, sportdagen", fields: "Inschrijflink, teams, locatie" },
  { id: "proeverij", emoji: "🍷", name: t.events.categories.proeverij, desc: "Wijn-, bier-, whisky- en foodproeverijen", fields: "Prijs per persoon, max deelnemers" },
  { id: "live-muziek", emoji: "🎵", name: t.events.categories.liveMuziek, desc: "Bands, DJ's, jazz, akoestische sessies", fields: "Artiest, genre, deurentijd" },
  { id: "thema-avond", emoji: "🎭", name: t.events.categories.themaAvond, desc: "Quiz, karaoke, themafeesten, specials", fields: "Thema, dresscode, reservering" },
  { id: "overig", emoji: "✨", name: t.events.categories.overig, desc: "Alles wat niet in een categorie past", fields: "Flexibele indeling" },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.templates}</h1>
        <p className="text-sm text-muted-foreground mt-1">Kies een sjabloon om in seconden een evenement aan te maken</p>
      </div>

      {/* Quick start */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Snel starten?</p>
            <p className="text-xs text-muted-foreground">Kies een sjabloon hieronder. Alle velden worden slim vooringevuld met standaard waarden.</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tmpl, i) => (
          <motion.div
            key={tmpl.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={`/app/events/new?template=${tmpl.id}`}
              className="block p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all group h-full"
            >
              <div className="text-3xl mb-3">{tmpl.emoji}</div>
              <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{tmpl.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{tmpl.desc}</p>
              <p className="text-[11px] text-muted-foreground/70">Vooringevuld: {tmpl.fields}</p>
              <div className="flex items-center gap-1 text-xs text-primary font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Gebruik sjabloon <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </motion.div>
        ))}
        {/* Blank template */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: templates.length * 0.05 }}
        >
          <Link
            to="/app/events/new"
            className="block p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-all group h-full flex flex-col items-center justify-center text-center"
          >
            <Layers className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">Blanco event</h3>
            <p className="text-xs text-muted-foreground">Begin helemaal leeg</p>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
