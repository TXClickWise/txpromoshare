import { Link } from "react-router-dom";
import { ArrowRight, Check, Heart, MessageCircle, RefreshCw, Clock, Users, Shield, Sparkles, Mail } from "lucide-react";
import { useSEO, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { motion } from "framer-motion";

const faqs = [
  { question: "Wat levert de ClickWise koppeling mij concreet op?", answer: "Je gasten ontvangen automatisch herinneringen voor aanvang (WhatsApp, e-mail of SMS), na afloop start je follow-up vanzelf, en je hebt altijd actueel inzicht in wie er interesse toont. Minder handwerk, meer herhaalbezoek." },
  { question: "Zit de ClickWise koppeling in de prijs van TX EventShare?", answer: "Nee, de koppeling vereist een apart ClickWise abonnement. Heb je al een ClickWise account? Dan is de koppeling met TX EventShare gratis inbegrepen." },
  { question: "Kan ik de setup laten doen?", answer: "Ja! Onze Done For You service regelt de volledige inrichting: account, kalender, workflows en koppeling met TX EventShare. Eenmalig v.a. €89,- excl. btw." },
  { question: "Wat gebeurt er als ik een event wijzig?", answer: "De afspraak in je kalender wordt automatisch bijgewerkt. Geen dubbele vermeldingen, geen handmatig opruimwerk. Wijzig het in TX EventShare en de rest volgt." },
  { question: "Werkt het ook met terugkerende events?", answer: "Ja. Bij recurring events wordt elke datum als aparte afspraak in je kalender gezet. Zo krijgen je gasten per keer een herinnering op het juiste moment." },
  { question: "Heb ik technische kennis nodig?", answer: "Nee. De koppeling is plug-and-play. En als je liever alles uit handen geeft, regelen wij het voor je via onze Done For You service." },
  { question: "Welke kanalen kan ik gebruiken voor reminders?", answer: "Via ClickWise kun je automatische berichten sturen via WhatsApp, e-mail en SMS. Je kiest zelf welke kanalen en op welk moment." },
];

export default function ClickWiseIntegratiePage() {
  useSEO({
    title: "ClickWise Integratie — Automatische Reminders & Opvolging",
    description: "Gasten krijgen automatisch een herinnering voor aanvang en je follow-up start vanzelf na afloop. Verbind TX EventShare met ClickWise voor event promotie op de automatische piloot.",
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
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">ClickWise Integratie</li>
            </ol>
          </nav>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" /> Promotie op de automatische piloot
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-5">
            Je gasten herinneren zichzelf.{" "}
            <span className="text-gradient-hero">Jij hoeft niks te doen.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Automatische reminders voor aanvang, slimmere opvolging na afloop en je events altijd zichtbaar in je marketing — zonder extra werk. Verbind TX EventShare met ClickWise en zet je event promotie op de automatische piloot.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90">
              Meer weten over ClickWise <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-secondary">
              Demo bekijken
            </Link>
          </div>
        </div>

        {/* Pricing / subscription info block */}
        <section className="max-w-3xl mx-auto mb-20">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-display font-bold text-foreground text-lg mb-3">Hoe werkt het abonnement?</h2>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">De koppeling is <strong>niet inbegrepen</strong> in de TX EventShare plannen</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">Je hebt een <strong>apart ClickWise abonnement</strong> nodig</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">Heb je al ClickWise? Dan is de koppeling <strong>gratis</strong></span>
                  </li>
                </ul>
              </div>
              <div className="md:border-l md:border-primary/10 md:pl-6">
                <h3 className="font-display font-bold text-foreground text-lg mb-3">Liever alles uit handen geven?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Onze <strong>Done For You</strong> service regelt de volledige setup: ClickWise account, kalender, workflows en de koppeling met TX EventShare.
                </p>
                <p className="text-sm font-semibold text-primary">Eenmalig v.a. €89,- excl. btw</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8 text-center">
            Wat levert het je op?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, title: "Reminders die zichzelf versturen", desc: "Je gasten krijgen automatisch een WhatsApp of e-mail voor aanvang. Jij hoeft niks te doen — het gaat vanzelf." },
              { icon: Heart, title: "Na het event blijf je top-of-mind", desc: "Automatische follow-up na afloop. Bedank bezoekers, deel foto's of promoot je volgende event. Zonder dat je eraan hoeft te denken." },
              { icon: RefreshCw, title: "Nooit meer handmatig kopiëren", desc: "Publiceer een event en het verschijnt automatisch in je marketing. Wijzig iets? De rest wordt direct bijgewerkt." },
              { icon: Clock, title: "Uren per week besparen", desc: "Geen knip-en-plakwerk meer. Geen handmatige berichten. Je event promotie draait op de achtergrond terwijl jij je op je gasten focust." },
              { icon: Users, title: "Eén ecosysteem, geen losse tools", desc: "Event promotie, reminders, opvolging en marketing vanuit één plek. Geen vijf losse tools die niet met elkaar praten." },
              { icon: Shield, title: "Altijd de juiste info", desc: "Wijzig een event en alles wordt overal bijgewerkt. Geen dubbele vermeldingen, geen verouderde informatie bij je gasten." },
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
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">Zo werkt het</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Kies je ClickWise abonnement of koppel je bestaande account", desc: "Heb je al ClickWise? Dan koppel je het direct. Nieuw? Wij helpen je op weg." },
              { step: "2", title: "Wij richten alles voor je in (of je doet het zelf)", desc: "Met onze Done For You service regelen wij de kalender, workflows en koppeling. Of je doet het zelf — ook prima." },
              { step: "3", title: "Publiceer een event — de rest gaat automatisch", desc: "Je event verschijnt in je kalender, reminders worden ingepland en na afloop start de opvolging vanzelf." },
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

        {/* Practical scenarios */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Herkenbare scenario's</h2>
          <div className="space-y-3">
            {[
              "Je publiceert een live muziek avond → je vaste gasten krijgen automatisch een WhatsApp-herinnering",
              "Een proeverij is afgelopen → bezoekers ontvangen een bedankmail met je volgende event",
              "Je wijzigt de starttijd van een event → de herinnering wordt automatisch aangepast",
              "Een nieuw seizoen begint → je contacten krijgen een persoonlijk bericht met het nieuwe programma",
              "Je terugkerend event heeft 6 datums → elke datum krijgt een eigen herinnering op het juiste moment",
            ].map((uc) => (
              <div key={uc} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{uc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* DFY highlight */}
        <section className="max-w-3xl mx-auto mb-20">
          <div className="rounded-2xl gradient-dark p-8 md:p-10 text-center">
            <h2 className="text-xl md:text-2xl font-display font-bold text-primary-foreground mb-3">
              Geen zin om het zelf in te richten?
            </h2>
            <p className="text-primary-foreground/70 text-sm mb-4 max-w-xl mx-auto">
              Onze Done For You service regelt alles: ClickWise account aanmaken, kalender instellen, workflows configureren en de koppeling met TX EventShare activeren. Jij hoeft alleen nog events te publiceren.
            </p>
            <p className="text-primary-foreground font-display font-bold text-lg mb-5">Eenmalig v.a. €89,- <span className="text-sm font-normal text-primary-foreground/50">excl. btw</span></p>
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-foreground text-primary font-semibold hover:opacity-90 transition-opacity">
              <Mail className="w-4 h-4" /> Neem contact op
            </Link>
          </div>
        </section>

        {/* Internal links */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-xl font-display font-bold text-foreground mb-6 text-center">Ontdek meer over TX EventShare</h2>
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

        {/* Final CTA */}
        <section className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Klaar om je event promotie te automatiseren?</h2>
          <p className="text-muted-foreground mb-6">Kies je ClickWise abonnement of laat ons alles voor je inrichten.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 shadow-glow">
              Aan de slag <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
