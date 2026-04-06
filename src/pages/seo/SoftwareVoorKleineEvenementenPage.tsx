import { Link } from "react-router-dom";
import { ArrowRight, Check, Target, Zap, Users, Calendar, BarChart3, Shield } from "lucide-react";
import { useSEO, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { motion } from "framer-motion";

const faqs = [
  { question: "Wat maakt TX PromoShare geschikt voor kleine evenementen?", answer: "TX PromoShare is gebouwd voor events van 10 tot 3.000 bezoekers. Het biedt professionele tools zoals branded eventpagina's, embedded widgets en distributie — zonder de complexiteit van zware enterprise systemen." },
  { question: "Is dit niet te groot voor een klein café?", answer: "Nee, integendeel. TX PromoShare is bewust simpel gehouden zodat ook een café met wekelijkse quizavonden er direct mee uit de voeten kan. Het groeit mee met je behoeften." },
  { question: "Kan ik terugkerende events automatiseren?", answer: "Ja. Stel een terugkerend event één keer in en TX PromoShare maakt automatisch nieuwe instanties aan. Na de eindtijd worden events automatisch gedeactiveerd." },
  { question: "Hoe vergelijkt dit met Eventbrite of Ticketmaster?", answer: "Die platforms zijn primair ticket-georiënteerd. TX PromoShare is agenda-first: gericht op het publiceren en promoten van evenementen. Ticketing komt als optionele uitbreiding." },
  { question: "Wat kost het voor kleine organisatoren?", answer: "Er is een gratis plan waarmee je direct kunt starten. Het Basic plan begint bij €29/maand voor meer events, widgets en branding." },
];

export default function SoftwareVoorKleineEvenementenPage() {
  useSEO({
    title: "Software voor Kleine Evenementen — 10 tot 3000 Bezoekers",
    description: "Het professionele event systeem dat kleinere events verdienen. Agenda, widgets, distributie en branded pagina's — zonder enterprise complexiteit. Gratis starten.",
    canonical: "/software-voor-kleine-evenementen",
    jsonLd: [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Software voor Kleine Evenementen", url: "/software-voor-kleine-evenementen" },
      ]),
      faqSchema(faqs),
    ],
  });

  return (
    <div className="py-16 md:py-24">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">Kleine Evenementen</li>
            </ol>
          </nav>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-5">
            Het professionele systeem dat kleinere events wél verdienen
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Grote platformen zijn te zwaar. Simpele tools zijn te beperkt. TX PromoShare zit precies ertussenin — gebouwd voor evenementen van 10 tot 3.000 bezoekers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90">
              Gratis starten <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-secondary">
              Bekijk prijzen
            </Link>
          </div>
        </div>

        {/* The gap */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8 text-center">
            Waarom kleinere events een ander systeem nodig hebben
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
              <h3 className="font-bold text-foreground mb-3">❌ Te zware systemen</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Ontworpen voor grote festivals en concerten</li>
                <li>• Complexe ticketing als kern</li>
                <li>• Dure abonnementen</li>
                <li>• Veel setup tijd nodig</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
              <h3 className="font-bold text-foreground mb-3">❌ Te simpele tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Geen branded eventpagina's</li>
                <li>• Geen website widgets</li>
                <li>• Geen distributie systeem</li>
                <li>• Geen team samenwerking</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 p-6 rounded-xl border border-accent/30 bg-accent/5">
            <h3 className="font-bold text-foreground mb-3 text-center">✅ TX PromoShare — precies ertussenin</h3>
            <p className="text-sm text-muted-foreground text-center">
              Professionele event promotie zonder enterprise complexiteit. Branded pagina's, embedded widgets, snelle distributie en team samenwerking — gebouwd voor jouw schaal.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">Gemaakt voor snelheid en eenvoud</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "In minuten live", desc: "Event aanmaken, template kiezen, publiceren. Geen uren aan setup." },
              { icon: Target, title: "Precies genoeg features", desc: "Alles wat je nodig hebt, niets wat je in de weg zit." },
              { icon: Users, title: "Team samenwerking", desc: "Collega's kunnen meewerken met eigen rechten en rollen." },
              { icon: Calendar, title: "Terugkerende events", desc: "Wekelijkse quiz of maandelijks event? Stel het één keer in." },
              { icon: BarChart3, title: "Distributie ingebouwd", desc: "Deel via website, WhatsApp, social media — vanuit één dashboard." },
              { icon: Shield, title: "Professionele uitstraling", desc: "Branded eventpagina's en widgets die passen bij je huisstijl." },
            ].map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-xl bg-card border border-border shadow-card">
                <b.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Who is it for */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Voor welke evenementen?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {["Live muziek avonden (20-200 bezoekers)", "Quizavonden en thema-avonden", "Proeverijen en wine tastings", "Seizoensevenementen", "Community events", "Lokale festivals (500-3000 bezoekers)", "Sporttoernooien", "Culturele events en exposities"].map((e) => (
              <div key={e} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm text-foreground">{e}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-xl font-display font-bold text-foreground mb-6 text-center">Bekijk ook</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { to: "/event-promotie-horeca", label: "Event promotie voor horeca", desc: "Speciaal voor cafés, restaurants en venues" },
              { to: "/event-agenda-software", label: "Event agenda software", desc: "Centraal je evenementen beheren" },
              { to: "/agenda-widget-website", label: "Agenda widget", desc: "Altijd actuele agenda op je website" },
              { to: "/clickwise-integratie", label: "ClickWise integratie", desc: "Events in je CRM workflow" },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors group">
                <p className="font-semibold text-foreground group-hover:text-primary">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">Veelgestelde vragen</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="rounded-xl border border-border bg-card overflow-hidden group">
                <summary className="p-4 cursor-pointer text-sm font-medium text-foreground list-none flex justify-between items-center">
                  {faq.question}
                  <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4"><p className="text-sm text-muted-foreground">{faq.answer}</p></div>
              </details>
            ))}
          </div>
        </section>

        <section className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Start vandaag nog gratis</h2>
          <p className="text-muted-foreground mb-6">Ontdek waarom honderden organisatoren kiezen voor TX PromoShare.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 shadow-glow">
            Gratis starten <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
