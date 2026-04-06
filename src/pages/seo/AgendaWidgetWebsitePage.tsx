import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Code, Palette, RefreshCw, Smartphone, Monitor, Zap } from "lucide-react";
import { useSEO, breadcrumbSchema, faqSchema } from "@/lib/seo";

const faqs = [
  { question: "Hoe werkt een embedded agenda widget?", answer: "Je plaatst een klein stukje code op je website. De widget toont automatisch je actuele evenementen en past zich aan je huisstijl aan. Alle wijzigingen in TX EventShare verschijnen direct op je site." },
  { question: "Moet ik een developer hebben om de widget te installeren?", answer: "Nee. Je kopieert de embed code en plakt deze in je website. Werkt met WordPress, Wix, Squarespace, custom HTML en de meeste website builders." },
  { question: "Past de widget bij mijn website design?", answer: "Ja, de widget is volledig aanpasbaar qua kleuren, lettertypen en lay-out zodat deze naadloos past bij je huisstijl." },
  { question: "Wordt de widget automatisch bijgewerkt?", answer: "Ja. Zodra je een event aanmaakt, wijzigt of archiveert in TX EventShare, is de widget op je website direct actueel. Geen handmatige updates nodig." },
  { question: "Is de widget geschikt voor mobiel?", answer: "Absoluut. De agenda widget en single event widget zijn volledig responsive en werken perfect op desktop, tablet en mobiel." },
];

export default function AgendaWidgetWebsitePage() {
  useSEO({
    title: "Agenda Widget voor je Website — Altijd Actueel, Geen Developer Nodig",
    description: "Embed een professionele evenementenkalender op je website. Automatisch gesynchroniseerd, volledig branded en responsive. Kopieer de code en je agenda staat live.",
    canonical: "/agenda-widget-website",
    jsonLd: [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Agenda Widget Website", url: "/agenda-widget-website" },
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
              <li className="text-foreground font-medium">Agenda Widget</li>
            </ol>
          </nav>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-5">
            Embedded agenda widget voor je website
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Toon je evenementen automatisch op je website met een stijlvolle, altijd actuele agenda widget. Eenvoudig te installeren, past bij je huisstijl en werkt op elk apparaat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90">
              Gratis uitproberen <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-secondary">
              Demo bekijken
            </Link>
          </div>
        </div>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8 text-center">
            Waarom een embedded agenda widget?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: RefreshCw, title: "Altijd actueel", desc: "Wijzigingen in TX EventShare verschijnen direct op je website. Nooit meer een verouderde agenda." },
              { icon: Palette, title: "Eigen huisstijl", desc: "Kleuren, lettertypen en lay-out passen naadloos bij je website design." },
              { icon: Code, title: "Simpele installatie", desc: "Kopieer en plak de embed code. Werkt met WordPress, Wix, Squarespace en custom sites." },
              { icon: Smartphone, title: "Volledig responsive", desc: "Ziet er perfect uit op desktop, tablet en mobiel. Altijd." },
              { icon: Monitor, title: "Twee widget types", desc: "Kies tussen een agenda overzicht of een uitgelicht single event blok." },
              { icon: Zap, title: "Razendsnel laden", desc: "Lichte, performante widget die je website niet vertraagt." },
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

        {/* How it works */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">Zo werkt het</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Maak je events aan in TX EventShare", desc: "Voer je evenementen in, kies een template en publiceer." },
              { step: "2", title: "Kopieer de widget code", desc: "Ga naar Widgets, kies agenda of single event en kopieer de embed code." },
              { step: "3", title: "Plak op je website", desc: "Voeg de code toe aan je website. De widget verschijnt direct met je actuele evenementen." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
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

        {/* CTA */}
        <section className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Probeer de agenda widget gratis</h2>
          <p className="text-muted-foreground mb-6">Start gratis en plaats binnen minuten een professionele agenda op je website.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 shadow-glow">
            Gratis starten <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
