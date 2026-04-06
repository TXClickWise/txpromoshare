import { Link } from "react-router-dom";
import { ArrowRight, Check, Workflow, RefreshCw, Zap, Send, BarChart3, Users } from "lucide-react";
import { useSEO, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { motion } from "framer-motion";

const faqs = [
  { question: "Wat is de ClickWise integratie?", answer: "TX PromoShare verbindt direct met je ClickWise / HighLevel subaccount. Events worden automatisch gesynchroniseerd zodat je ze kunt gebruiken in CRM workflows, automatiseringen en follow-up campagnes." },
  { question: "Heb ik een ClickWise account nodig?", answer: "Ja, de integratie werkt met een bestaand ClickWise / HighLevel subaccount. De koppeling is beschikbaar in het Pro plan." },
  { question: "Welke data wordt gesynchroniseerd?", answer: "Event titels, data, beschrijvingen, locaties en links worden gesynchroniseerd. Dit maakt het mogelijk om automatische e-mails, herinneringen en opvolgingen te triggeren." },
  { question: "Kan ik automatisch workflows starten bij een nieuw event?", answer: "Ja. Wanneer je een event publiceert in TX PromoShare, kan dit automatisch een workflow triggeren in ClickWise voor promotie, herinneringen of follow-up." },
  { question: "Is de integratie veilig?", answer: "Ja. De verbinding gebruikt versleutelde API keys en alle data wordt veilig uitgewisseld via beveiligde kanalen." },
];

export default function ClickWiseIntegratiePage() {
  useSEO({
    title: "ClickWise Integratie — Event Promotie met CRM & Marketing Automation",
    description: "Verbind TX PromoShare met ClickWise / HighLevel. Synchroniseer events met je CRM, trigger automatische workflows en volg bezoekers op. Event promotie software met native CRM integratie.",
    canonical: "/clickwise-integratie",
    jsonLd: [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Integraties", url: "/clickwise-integratie" },
        { name: "ClickWise Integratie", url: "/clickwise-integratie" },
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
              <li className="text-foreground font-medium">ClickWise Integratie</li>
            </ol>
          </nav>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Workflow className="w-3 h-3" /> Native CRM integratie
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-5">
            Event promotie verbonden met je CRM en marketing automation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            TX PromoShare integreert native met ClickWise / HighLevel. Synchroniseer events, trigger workflows en volg bezoekers op — allemaal vanuit één ecosysteem.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90">
              Pro plan starten <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-secondary">
              Demo bekijken
            </Link>
          </div>
        </div>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8 text-center">
            Waarom event promotie + CRM een gouden combinatie is
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: RefreshCw, title: "Automatische sync", desc: "Events verschijnen automatisch in je ClickWise account zodra je ze publiceert." },
              { icon: Zap, title: "Workflow triggers", desc: "Start automatisch campagnes, herinneringen en follow-ups bij nieuwe events." },
              { icon: Send, title: "Slimmere opvolging", desc: "Gebruik eventdata voor gerichte marketing en betere bezoekerscommunicatie." },
              { icon: BarChart3, title: "Beter inzicht", desc: "Combineer eventdata met CRM data voor een completer beeld van je publiek." },
              { icon: Users, title: "Minder losse tools", desc: "Event promotie en CRM in één flow — geen handmatig kopiëren meer." },
              { icon: Workflow, title: "Schaalbaar ecosysteem", desc: "Groei van simpele promotie naar volledige marketing automation rond je events." },
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

        {/* How it works */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">Zo werkt de koppeling</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Verbind je ClickWise account", desc: "Voer je API key in en selecteer het juiste subaccount." },
              { step: "2", title: "Configureer synchronisatie", desc: "Kies welke eventdata gesynchroniseerd wordt en welke triggers actief zijn." },
              { step: "3", title: "Publiceer events", desc: "Bij elke publicatie wordt eventdata automatisch naar ClickWise gestuurd." },
              { step: "4", title: "Automatiseer je marketing", desc: "Gebruik de gesynchroniseerde data voor workflows, e-mails en opvolging." },
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

        {/* Use cases */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Praktische toepassingen</h2>
          <div className="space-y-3">
            {[
              "Event gepubliceerd → automatische e-mail campagne naar je contactenlijst",
              "Event gewijzigd → gekoppelde content automatisch bijgewerkt",
              "Event afgelopen → follow-up workflow voor bezoekers",
              "Nieuw event → reminder serie via SMS of e-mail",
              "Seizoensevent → automatische re-engagement campagne",
            ].map((uc) => (
              <div key={uc} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{uc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-xl font-display font-bold text-foreground mb-6 text-center">Ontdek meer over TX PromoShare</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { to: "/event-agenda-software", label: "Event agenda software", desc: "Centraal je events beheren" },
              { to: "/event-promotie-horeca", label: "Event promotie horeca", desc: "Speciaal voor cafés en venues" },
              { to: "/agenda-widget-website", label: "Agenda widget", desc: "Altijd actuele agenda op je site" },
              { to: "/software-voor-kleine-evenementen", label: "Kleine evenementen", desc: "10 tot 3000 bezoekers" },
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
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Klaar om events en marketing te verbinden?</h2>
          <p className="text-muted-foreground mb-6">Start met het Pro plan en verbind TX PromoShare met je ClickWise account.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 shadow-glow">
            Pro plan starten <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
