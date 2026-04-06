import { Link } from "react-router-dom";
import { ArrowRight, Send, Mail, Phone, MapPin } from "lucide-react";
import { useSEO, breadcrumbSchema } from "@/lib/seo";

export default function DemoPage() {
  useSEO({
    title: "Gratis Demo Aanvragen — Zie TX EventShare in Actie",
    description: "Plan een vrijblijvende demo en ontdek hoe TX EventShare je event promotie vereenvoudigt. Agenda software, widgets, distributie en ClickWise integratie — in één platform.",
    canonical: "/demo",
    jsonLd: [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Demo aanvragen", url: "/demo" },
      ]),
    ],
  });

  return (
    <div className="py-16 md:py-24">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">Demo aanvragen</li>
            </ol>
          </nav>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Ontdek TX EventShare in een persoonlijke demo
              </h1>
              <p className="text-muted-foreground mb-8">
                Wil je zien hoe TX EventShare werkt voor jouw bedrijf? Plan een vrijblijvende demo en ontdek hoe je evenementen sneller en professioneler kunt promoten.
              </p>

              <div className="space-y-6 mb-8">
                <h2 className="text-lg font-display font-bold text-foreground">Wat je leert in de demo</h2>
                <ul className="space-y-3">
                  {[
                    "Hoe je in minuten een event aanmaakt en publiceert",
                    "Hoe de embedded agenda widget werkt op je website",
                    "Hoe je events verspreidt via WhatsApp en social media",
                    "Hoe de ClickWise integratie je marketing versterkt",
                    "Welk plan het beste past bij jouw organisatie",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <Send className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@txpromoshare.nl</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> +31 (0)222 123 456</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Texel, Nederland</div>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-card">
              <h2 className="text-xl font-display font-bold text-foreground mb-6">Plan je demo</h2>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Naam</label>
                  <input id="name" type="text" placeholder="Je volledige naam" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">E-mailadres</label>
                  <input id="email" type="email" placeholder="naam@bedrijf.nl" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">Bedrijfsnaam</label>
                  <input id="company" type="text" placeholder="Je bedrijf of organisatie" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">Type organisatie</label>
                  <select id="type" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Selecteer...</option>
                    <option value="cafe">Café / Bar</option>
                    <option value="restaurant">Restaurant / Beach club</option>
                    <option value="podium">Poppodium / Muzieklocatie</option>
                    <option value="event">Eventorganisatie</option>
                    <option value="festival">Festivalorganisatie</option>
                    <option value="other">Anders</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Bericht (optioneel)</label>
                  <textarea id="message" rows={3} placeholder="Vertel kort wat je zoekt..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                  Demo aanvragen <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-muted-foreground text-center">Vrijblijvend • Reactie binnen 24 uur</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
