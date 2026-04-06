import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Calendar, Globe, Share2, Zap, Users, Palette } from "lucide-react";
import { useSEO, breadcrumbSchema, faqSchema, softwareSchema } from "@/lib/seo";

const faqs = [
  { question: "Wat is event agenda software?", answer: "Event agenda software helpt je om evenementen centraal te beheren, publiceren en verspreiden. TX PromoShare biedt daarnaast embedded widgets zodat je agenda altijd gesynchroniseerd is met je website." },
  { question: "Kan ik de agenda op mijn eigen website plaatsen?", answer: "Ja, TX PromoShare biedt een embedded agenda widget die je met een simpele code op elke website kunt plaatsen. De widget past zich aan je huisstijl aan en is altijd automatisch up-to-date." },
  { question: "Is dit geschikt voor kleine evenementen?", answer: "Absoluut. TX PromoShare is speciaal gebouwd voor evenementen van 10 tot 3.000 bezoekers. Het is het professionele systeem dat kleinere events verdienen." },
  { question: "Hoe verschilt dit van een Google Calendar?", answer: "TX PromoShare biedt branded eventpagina's, embedded widgets, distributie via WhatsApp en social media, teamrollen, templates en CRM-integratie. Veel meer dan alleen een kalender." },
  { question: "Werkt het ook voor terugkerende events?", answer: "Ja, je kunt eenvoudig terugkerende evenementen instellen met automatische herhalingen en auto-deactivering na de eindtijd." },
];

export default function EventAgendaSoftwarePage() {
  useSEO({
    title: "Event Agenda Software — Evenementenkalender voor je Website",
    description: "Beheer je evenementen centraal en plaats een altijd actuele agenda op je website. Event agenda software speciaal voor horeca, venues en organisatoren. Probeer gratis.",
    canonical: "/event-agenda-software",
    jsonLd: [
      softwareSchema,
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Event Agenda Software", url: "/event-agenda-software" },
      ]),
      faqSchema(faqs),
    ],
  });

  return (
    <div className="py-16 md:py-24">
      <div className="container px-4">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">Event Agenda Software</li>
            </ol>
          </nav>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-5">
            Event agenda software die écht werkt voor je website
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Beheer al je evenementen op één plek en laat ze automatisch verschijnen op je website met een stijlvolle embedded widget. Ideaal voor cafés, restaurants, venues en eventorganisaties.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
              Gratis starten <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-secondary transition-colors">
              Demo aanvragen
            </Link>
          </div>
        </div>

        {/* What is it */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4 text-center">
            Wat is event agenda software?
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">
            Event agenda software is een systeem waarmee je evenementen centraal beheert en automatisch publiceert naar je website, socials en andere kanalen. In plaats van handmatig je website bij te werken, synchroniseert TX PromoShare alles automatisch.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: "Centraal beheer", desc: "Alle evenementen op één plek. Geen losse spreadsheets of verouderde pagina's meer." },
              { icon: Globe, title: "Embedded widget", desc: "Plaats een altijd actuele agenda op je website met één stukje code." },
              { icon: Share2, title: "Direct verspreiden", desc: "Deel via WhatsApp, social media en je ClickWise workflow vanuit hetzelfde systeem." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border shadow-card">
                <item.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8 text-center">
            Wat maakt TX PromoShare anders dan standaard agenda tools?
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: Palette, title: "Eigen branding", desc: "Je agenda en eventpagina's passen bij je huisstijl. Geen standaard uiterlijk." },
              { icon: Zap, title: "Razendsnel publiceren", desc: "Event aanmaken, template kiezen en direct live. In minuten, niet uren." },
              { icon: Users, title: "Teamrollen", desc: "Werk samen met collega's. Ieder met eigen rechten en toegang." },
              { icon: Calendar, title: "Terugkerende events", desc: "Wekelijkse quiz of maandelijks event? Stel het één keer in." },
              { icon: Share2, title: "WhatsApp & social distributie", desc: "Deel je event direct via WhatsApp en social media met voorbereide teksten." },
              { icon: Globe, title: "ClickWise integratie", desc: "Verbind je events met je CRM en marketingflows voor slimmere opvolging." },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-xl bg-card border border-border">
                <f.icon className="w-5 h-5 text-accent shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* For whom */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4 text-center">
            Voor wie is event agenda software?
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            TX PromoShare is gebouwd voor iedereen die regelmatig evenementen organiseert en deze professioneel wil promoten.
          </p>
          <ul className="space-y-3 max-w-lg mx-auto">
            {["Cafés en bars met live muziek of thema-avonden", "Restaurants met proeverijen of seizoensevenementen", "Beach clubs met terugkerende events", "Poppodia en muzieklocaties", "Eventbureaus die meerdere locaties beheren", "Festivalorganisaties die snel willen schakelen"].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                <span className="text-foreground text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">Veelgestelde vragen over event agenda software</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="rounded-xl border border-border bg-card overflow-hidden group">
                <summary className="p-4 cursor-pointer text-sm font-medium text-foreground list-none flex justify-between items-center">
                  {faq.question}
                  <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Klaar om je event agenda te professionaliseren?</h2>
          <p className="text-muted-foreground mb-6">Start gratis en ontdek hoe eenvoudig event promotie kan zijn.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow">
              Gratis starten <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition-colors">
              Bekijk prijzen
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
