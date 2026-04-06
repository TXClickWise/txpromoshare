import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Utensils, Music, Wine, PartyPopper, Palmtree, Building2 } from "lucide-react";
import { useSEO, breadcrumbSchema, faqSchema } from "@/lib/seo";

const faqs = [
  { question: "Is TX EventShare geschikt voor kleine horeca events?", answer: "Absoluut. TX EventShare is speciaal gebouwd voor evenementen van 10 tot 3.000 bezoekers — precies de schaal waarop de meeste horeca events plaatsvinden." },
  { question: "Kan ik events promoten via WhatsApp?", answer: "Ja. Vanuit TX EventShare kun je direct voorbereide deelteksten kopiëren en via WhatsApp versturen naar je netwerk." },
  { question: "Werkt dit voor terugkerende events zoals weekelijkse quizavonden?", answer: "Ja. Je stelt het event één keer in en TX EventShare herhaalt het automatisch. Na de eindtijd wordt het event automatisch gedeactiveerd." },
  { question: "Kunnen mijn teamleden ook events beheren?", answer: "Ja. Je kunt collega's uitnodigen met specifieke rollen zodat iedereen kan bijdragen zonder dat je de controle verliest." },
  { question: "Kan ik de agenda op mijn website plaatsen?", answer: "Ja, met de embedded agenda widget. Kopieer de code, plak het op je site en je agenda is altijd automatisch up-to-date." },
];

const useCases = [
  { icon: Wine, title: "Cafés en bars", desc: "Quizavonden, live muziek, thema-avonden — alles professioneel gepromoot zonder gedoe.", features: ["Terugkerende events", "WhatsApp delen", "Agenda widget"] },
  { icon: Utensils, title: "Restaurants", desc: "Proeverijen, seizoensdiners en speciale avonden presenteer je met stijlvolle eventpagina's.", features: ["Branded eventpagina's", "Eigen huisstijl", "Social sharing"] },
  { icon: Palmtree, title: "Beach clubs", desc: "Zomerse events en festivals bereiken je publiek direct via website, socials en WhatsApp.", features: ["Distributie centrum", "Templates", "Meerdere kanalen"] },
  { icon: Music, title: "Poppodia", desc: "Beheer je programmering centraal en toon het automatisch op je website en socials.", features: ["Agenda widget", "Event templates", "Team samenwerking"] },
  { icon: PartyPopper, title: "Eventorganisaties", desc: "Meerdere events tegelijk? TX EventShare geeft je overzicht en snelheid.", features: ["Onbeperkt events (Pro)", "Team rollen", "ClickWise integratie"] },
  { icon: Building2, title: "Festivalorganisaties", desc: "Professionele promotie voor festivals van elke omvang, met branded pagina's en distributie.", features: ["Branded pages", "Sponsor sectie", "Geavanceerde distributie"] },
];

export default function EventPromotieHorecaPage() {
  useSEO({
    title: "Event Promotie voor Horeca — Cafés, Restaurants & Venues",
    description: "Promoot je horeca events professioneel via website, WhatsApp en socials. Embedded agenda, branded pagina's en snelle distributie. Gebouwd voor cafés, bars en venues.",
    canonical: "/event-promotie-horeca",
    jsonLd: [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Event Promotie Horeca", url: "/event-promotie-horeca" },
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
              <li className="text-foreground font-medium">Event Promotie Horeca</li>
            </ol>
          </nav>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-5">
            Event promotie software voor de horeca
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Promoot je evenementen professioneel — van quizavond tot festival. TX EventShare helpt cafés, restaurants, bars en venues om events sneller en mooier te verspreiden via website, WhatsApp en social media.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90">
              Gratis starten <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-secondary">
              Demo aanvragen
            </Link>
          </div>
        </div>

        {/* Pain points */}
        <section className="max-w-3xl mx-auto mb-20 text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">Herkenbaar?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Event op Instagram, maar niet op de website",
              "Agenda op de site is handmatig en verouderd",
              "Team deelt steeds losse info via WhatsApp",
              "Eventpagina's voelen standaard en onpersoonlijk",
              "Elk event moet opnieuw worden opgemaakt",
              "Geen overzicht van wat wanneer live staat",
            ].map((p) => (
              <div key={p} className="p-4 rounded-lg bg-destructive/5 border border-destructive/10 text-sm text-foreground text-left">
                ❌ {p}
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section className="max-w-5xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4 text-center">
            Voor elk type horecabedrijf en organisator
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            TX EventShare werkt voor elk bedrijf dat regelmatig evenementen organiseert en professioneel wil promoten.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-xl bg-card border border-border shadow-card">
                <uc.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display font-bold text-foreground mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{uc.desc}</p>
                <ul className="space-y-1">
                  {uc.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Ontdek meer</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { to: "/event-agenda-software", label: "Event agenda software", desc: "Beheer al je evenementen centraal" },
              { to: "/agenda-widget-website", label: "Agenda widget", desc: "Plaats een actuele agenda op je website" },
              { to: "/software-voor-kleine-evenementen", label: "Software voor kleine events", desc: "Speciaal voor 10-3000 bezoekers" },
              { to: "/clickwise-integratie", label: "ClickWise integratie", desc: "Verbind events met je CRM" },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors group">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{link.label}</p>
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

        {/* CTA */}
        <section className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Klaar om je events professioneel te promoten?</h2>
          <p className="text-muted-foreground mb-6">Start gratis en ontdek hoe eenvoudig event promotie kan zijn voor je horecabedrijf.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 shadow-glow">
            Gratis starten <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
