import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, Share2, Code2, Zap, Palette, Users, ArrowRight, Check, Star, Shield,
  Clock, Smartphone, MessageCircle, Layout, Repeat, Tags, Power, Ticket, ChevronDown,
  Globe, BarChart3, Target, Plug, Sparkles, Heart, ExternalLink, Mail, Phone
} from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useState } from "react";

/* ────────────────────────── Data ────────────────────────── */

const heroTrust = [
  { icon: Clock, text: "Event live in < 5 minuten" },
  { icon: Smartphone, text: "Mobile-first design" },
  { icon: Shield, text: "GDPR-compliant & veilig" },
  { icon: Code2, text: "Geen developer nodig" },
];

const problems = [
  { emoji: "😩", title: "Event op Facebook, maar niet op je site", desc: "Je post op social media, maar bezoekers vinden niks op je website." },
  { emoji: "🔁", title: "Steeds opnieuw dezelfde info delen", desc: "Elke keer kopieer-plakken naar WhatsApp, socials en je agenda." },
  { emoji: "⏳", title: "Agenda op je website verouderd", desc: "Handmatig bijwerken of afhankelijk van een developer." },
  { emoji: "📱", title: "WhatsApp promotie is rommelig", desc: "Geen gestandaardiseerde teksten, geen visuele consistentie." },
  { emoji: "🎨", title: "Eventpagina's voelen standaard", desc: "Generieke templates die niet bij je merk passen." },
  { emoji: "🏢", title: "Grote tools voor grote festivals", desc: "Ticketing-first platforms die overkill zijn voor jouw events." },
];

const solutionSteps = [
  { num: "01", title: "Maak je event aan", desc: "Gebruik een sjabloon of begin blanco. Vul de details één keer in." },
  { num: "02", title: "Kies template & publiceer", desc: "Kies een categorie, voeg je branding toe en publiceer met één klik." },
  { num: "03", title: "Widget op je website", desc: "Plak een klein stukje code — je agenda of event verschijnt automatisch." },
  { num: "04", title: "Deel via socials & WhatsApp", desc: "Kant-en-klare teksten en links. Direct delen, zonder opnieuw te schrijven." },
];

const features = [
  { icon: Calendar, title: "Slimme event agenda", desc: "Beheer al je evenementen centraal. Dupliceer, plan en herhaal moeiteloos." },
  { icon: Layout, title: "Embedded agenda widget", desc: "Toon je complete agenda op je website. Altijd actueel, altijd responsive." },
  { icon: Target, title: "Enkel event widget", desc: "Highlight één event als compacte promo card. Ideaal voor je homepage." },
  { icon: Globe, title: "Mooie eventpagina's", desc: "Professionele, gebrandede landingspagina's voor elk evenement." },
  { icon: Share2, title: "Delen via socials & WhatsApp", desc: "Kant-en-klare share teksten per kanaal. Kopieer en deel in seconden." },
  { icon: Repeat, title: "Event templates", desc: "Maak terugkerende events in seconden aan vanuit bewezen sjablonen." },
  { icon: Users, title: "Teamleden & rollen", desc: "Nodig collega's uit als redacteur, marketeer of bekijker." },
  { icon: Tags, title: "Eigen categorieën", desc: "Organiseer events op jouw manier met aangepaste labels en kleuren." },
  { icon: Clock, title: "Auto-deactivatie", desc: "Events worden automatisch gedeactiveerd na de einddatum. Geen opruimwerk." },
  { icon: Plug, title: "ClickWise CRM integratie", desc: "Verbind events direct met je CRM, marketing automation en opvolging." },
  { icon: BarChart3, title: "Distributie analytics", desc: "Zie welke kanalen het beste werken voor je promotie." },
  { icon: Ticket, title: "Ticketverkoop (binnenkort)", desc: "Verkoop tickets direct via je eventpagina. In voorbereiding als add-on.", upcoming: true },
];

const useCases = [
  { emoji: "🍺", title: "Cafés & bars", desc: "Pubquizzen, live muziek, thema-avonden — altijd zichtbaar op je site en in WhatsApp-groepen." },
  { emoji: "🍽️", title: "Restaurants & beach clubs", desc: "Proeverijen, speciale diners en seizoensevents. Professioneel gepresenteerd, snel gedeeld." },
  { emoji: "🎵", title: "Poppodia & live muziek", desc: "Programmering beheren, agenda op je website en events promoten bij je publiek." },
  { emoji: "🎪", title: "Eventorganisaties", desc: "Eén dashboard voor al je projecten. Van bedrijfsevent tot community gathering." },
  { emoji: "🎉", title: "Festivalorganisaties", desc: "Meerdere podia, categorieën en teamleden. Alles op één plek, overal zichtbaar." },
];

const comparisonHeaders = ["", "Handmatig", "Generiek platform", "TX PromoShare"];
const comparisonRows = [
  { label: "Event aanmaken", manual: "Langzaam", generic: "Oké", tx: "< 5 min" },
  { label: "Website widget", manual: "❌", generic: "Beperkt", tx: "✅ Agenda + event" },
  { label: "WhatsApp delen", manual: "Handmatig", generic: "❌", tx: "✅ Kant-en-klaar" },
  { label: "Eigen branding", manual: "Eigen design", generic: "Beperkt", tx: "✅ Volledig" },
  { label: "Terugkerende events", manual: "Opnieuw maken", generic: "Beperkt", tx: "✅ Templates" },
  { label: "CRM integratie", manual: "❌", generic: "❌", tx: "✅ ClickWise" },
  { label: "Distributie centrum", manual: "❌", generic: "❌", tx: "✅ Alle kanalen" },
  { label: "Focus", manual: "—", generic: "Ticketing", tx: "Promotie & agenda" },
];

const plans = [
  { ...t.plans.free, id: "free", popular: false },
  { ...t.plans.basic, id: "basic", popular: true },
  { ...t.plans.pro, id: "pro", popular: false },
];

const faqs = [
  { q: "Is TX PromoShare geschikt voor kleine events?", a: "Absoluut. Het platform is specifiek ontworpen voor events van 10 tot 3000 bezoekers. Van een pubquiz tot een stadsfeest." },
  { q: "Kan ik de agenda op mijn eigen website plaatsen?", a: "Ja. Je kopieert een klein stukje code en plakt dat op je website. De agenda widget is responsive en altijd automatisch bijgewerkt." },
  { q: "Werkt het ook voor terugkerende events?", a: "Ja. Je kunt sjablonen maken en events dupliceren. Ideaal voor wekelijkse live muziek, maandelijkse proeverijen of seizoensactiviteiten." },
  { q: "Kunnen meerdere teamleden ermee werken?", a: "Ja. Je kunt teamleden uitnodigen met verschillende rollen: eigenaar, beheerder, redacteur, marketeer of bekijker." },
  { q: "Is er een koppeling met ClickWise?", a: "Ja. TX PromoShare integreert native met ClickWise zodat events onderdeel worden van je CRM-workflows, automation en opvolging." },
  { q: "Komt ticketverkoop later beschikbaar?", a: "Ja. Ticketing wordt ontwikkeld als add-on module voor Pro plan gebruikers. Inclusief QR-scanning, betalingen via Stripe/Mollie en bezoekersbeheer." },
  { q: "Is dit geschikt voor cafés én eventorganisaties?", a: "Ja. Het platform schaalt van een klein café met 3 events per maand tot een organisatie met tientallen evenementen en meerdere locaties." },
];

/* ────────────────────────── Helpers ────────────────────────── */

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };
const stagger = (i: number) => ({ ...fadeUp, transition: { duration: 0.5, delay: i * 0.08 } });

function SectionHeader({ eyebrow, title, subtitle, light = false }: { eyebrow?: string; title: string; subtitle?: string; light?: boolean }) {
  return (
    <div className="text-center mb-12 md:mb-16">
      {eyebrow && <p className={cn("text-xs font-semibold uppercase tracking-widest mb-3", light ? "text-primary-foreground/60" : "text-primary")}>{eyebrow}</p>}
      <h2 className={cn("text-2xl md:text-4xl font-display font-bold leading-tight mb-3", light ? "text-primary-foreground" : "text-foreground")}>{title}</h2>
      {subtitle && <p className={cn("text-lg max-w-2xl mx-auto", light ? "text-primary-foreground/70" : "text-muted-foreground")}>{subtitle}</p>}
    </div>
  );
}

/* ────────────────────────── Page ────────────────────────── */

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div>

      {/* ═══════ 1. HERO ═══════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
        <div className="container px-4 pt-20 pb-24 md:pt-28 md:pb-32 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Star className="w-3.5 h-3.5" />
              Het perfecte grote systeem voor kleinere events
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-display font-bold text-foreground leading-[1.15] mb-6">
              Maak je event één keer aan.{" "}
              <span className="text-gradient-hero">Verspreid het overal.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              De slimste manier om evenementen te publiceren, beheren en promoten. Gebouwd voor horeca, organisatoren en festivals in Nederland.
            </p>
            <p className="text-sm text-muted-foreground/60 mb-8">
              Made with <Heart className="w-3 h-3 inline text-primary" /> on Texel by ClickWise
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow text-base">
                Vraag demo aan
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#hoe-het-werkt" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors text-base">
                Bekijk hoe het werkt
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {heroTrust.map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-accent" />
                  {item.text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Product mockup placeholder */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-16 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-destructive/40" /><div className="w-3 h-3 rounded-full bg-highlight/40" /><div className="w-3 h-3 rounded-full bg-accent/40" /></div>
                <div className="flex-1 text-center"><span className="text-[10px] text-muted-foreground font-mono">app.txpromoshare.nl/dashboard</span></div>
              </div>
              <div className="p-6 md:p-8 bg-gradient-to-br from-surface-cool to-card min-h-[280px] md:min-h-[360px] flex items-center justify-center">
                <div className="grid md:grid-cols-3 gap-4 w-full max-w-2xl">
                  {[
                    { icon: Calendar, label: "3 actieve events", sub: "Agenda beheer" },
                    { icon: Share2, label: "12 deelacties", sub: "Deze week" },
                    { icon: Code2, label: "2 widgets live", sub: "Op je website" },
                  ].map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.15 }} className="p-4 rounded-xl bg-card border border-border shadow-card text-center">
                      <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center mx-auto mb-3">
                        <m.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <p className="font-display font-bold text-foreground text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.sub}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ 2. PROBLEM ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Het probleem"
            title="Herkenbaar? Je eventpromotie is versnipperd."
            subtitle="Horeca en organisatoren worstelen dagelijks met dezelfde frustraties"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {problems.map((p, i) => (
              <motion.div key={i} {...stagger(i)} className="p-5 rounded-xl bg-card border border-border shadow-card">
                <span className="text-2xl mb-3 block">{p.emoji}</span>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 3. SOLUTION ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <SectionHeader
            eyebrow="De oplossing"
            title="Eén systeem voor je volledige eventpromotie"
            subtitle="Maak je event één keer aan, beheer het centraal en verspreid het overal"
          />
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 items-center mb-12">
              {["Aanmaken", "Centraal beheren", "Overal verspreiden"].map((label, i) => (
                <motion.div key={i} {...stagger(i)} className="text-center">
                  <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-3">
                    {i === 0 && <Calendar className="w-6 h-6 text-primary-foreground" />}
                    {i === 1 && <Layout className="w-6 h-6 text-primary-foreground" />}
                    {i === 2 && <Share2 className="w-6 h-6 text-primary-foreground" />}
                  </div>
                  <p className="font-display font-bold text-foreground">{label}</p>
                  {i < 2 && <ArrowRight className="w-5 h-5 text-muted-foreground/30 mx-auto mt-3 hidden md:block" />}
                </motion.div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Globe, text: "Agenda-first: je programma staat altijd centraal" },
                { icon: Code2, text: "Widget-ready: direct embeddable op elke website" },
                { icon: MessageCircle, text: "Share-ready: kant-en-klare teksten voor elk kanaal" },
                { icon: Plug, text: "ClickWise connected: native CRM integratie" },
              ].map((item, i) => (
                <motion.div key={i} {...stagger(i)} className="flex items-start gap-3 p-4 rounded-xl bg-surface-cool border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 4. KEY FEATURES ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Features"
            title="Alles wat je nodig hebt, niks wat je niet nodig hebt"
            subtitle="Gebouwd voor snelheid, eenvoud en professionele uitstraling"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <motion.div key={i} {...stagger(i)} className={cn("p-5 rounded-xl border shadow-card transition-shadow hover:shadow-elevated relative", f.upcoming ? "bg-card/60 border-dashed border-primary/20" : "bg-card border-border")}>
                {f.upcoming && (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Binnenkort</span>
                )}
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", f.upcoming ? "bg-primary/10" : "gradient-hero")}>
                  <f.icon className={cn("w-5 h-5", f.upcoming ? "text-primary" : "text-primary-foreground")} />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 5. HOW IT WORKS ═══════ */}
      <section id="hoe-het-werkt" className="py-20 md:py-28">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Hoe het werkt"
            title="Van event naar promotie in 4 stappen"
            subtitle="Zo simpel dat je team het direct kan gebruiken"
          />
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {solutionSteps.map((step, i) => (
              <motion.div key={i} {...stagger(i)} className="text-center relative">
                <div className="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-display font-bold text-lg">{step.num.replace("0", "")}</span>
                </div>
                <h3 className="font-display font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < 3 && <ArrowRight className="w-5 h-5 text-muted-foreground/20 absolute -right-3 top-6 hidden md:block" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 6. EMBEDDED WIDGETS ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Widgets"
            title="Je agenda, automatisch op je website"
            subtitle="Kopieer een klein stukje code en je events verschijnen direct — altijd actueel"
          />
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { title: "Agenda Widget", desc: "Toon je volledige programma als een overzichtelijke, gebrandede agenda. Automatisch bijgewerkt wanneer je een event toevoegt of wijzigt.", features: ["Responsive op alle schermen", "Jouw kleuren en branding", "Automatisch gesynchroniseerd", "Klikt door naar eventpagina"] },
              { title: "Enkel Event Widget", desc: "Highlight één specifiek evenement als compacte promo card. Ideaal voor je homepage, blogpost of landingspagina.", features: ["Compacte weergave", "CTA knop inbegrepen", "Verdwijnt automatisch na afloop", "Past bij elk website-ontwerp"] },
            ].map((widget, i) => (
              <motion.div key={i} {...stagger(i)} className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-primary/5 via-secondary to-surface-cool flex items-center justify-center border-b border-border">
                  <div className="w-3/4 rounded-xl bg-card border border-border shadow-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded gradient-hero" />
                      <div className="h-2.5 w-24 rounded-full bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded-full bg-secondary" />
                      <div className="h-2 w-3/4 rounded-full bg-secondary" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-foreground text-lg mb-2">{widget.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{widget.desc}</p>
                  <ul className="space-y-2">
                    {widget.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-accent shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 7. CLICKWISE INTEGRATION ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Native integratie</p>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight mb-4">
                ClickWise & je events, naadloos verbonden
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                TX PromoShare integreert native met ClickWise zodat je events onderdeel worden van je bredere marketing- en automatiseringsworkflow. Minder losse tools, betere opvolging, slimmer werken.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Event gepubliceerd → automatisch in je CRM",
                  "Opvolging en remarketing na events",
                  "Promotie en CRM dichter bij elkaar",
                  "Werk vanuit één ecosysteem",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Ontdek de integratie <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl gradient-dark p-8 text-center">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <span className="text-primary-foreground font-display font-bold text-lg">TX</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-0.5 bg-primary/40" />
                    <Zap className="w-5 h-5 text-primary" />
                    <div className="w-8 h-0.5 bg-primary/40" />
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-display font-bold text-sm">CW</span>
                  </div>
                </div>
                <p className="text-primary-foreground/80 text-sm">Eén ecosysteem voor promotie, CRM en automation</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ 8. BUILT FOR SMALLER EVENTS ═══════ */}
      <section className="py-20 md:py-28 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
        <div className="container px-4 relative">
          <SectionHeader
            light
            eyebrow="Positionering"
            title="Het professionele systeem dat kleinere events wél verdienen"
            subtitle="De meeste tools zijn te basic of te zwaar. TX PromoShare zit precies in de sweet spot."
          />
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: "Te basic", desc: "Handmatig werken, Facebook-events, Google Docs en WhatsApp-chaos. Geen structuur, geen branding, geen overzicht.", icon: "👎" },
              { title: "Te zwaar", desc: "Enterprise ticketing platforms met honderden instellingen. Ticket-first, overkill voor events tot 3000 bezoekers.", icon: "🏗️" },
              { title: "TX PromoShare", desc: "Professioneel, schaalbaar, simpel en snel. Agenda-first, distributie-first. Gebouwd voor events van 10 tot 3000 bezoekers.", icon: "✅", highlight: true },
            ].map((item, i) => (
              <motion.div key={i} {...stagger(i)} className={cn("p-6 rounded-2xl border", item.highlight ? "bg-primary/10 border-primary/30" : "bg-primary-foreground/5 border-primary-foreground/10")}>
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h3 className={cn("font-display font-bold mb-2", item.highlight ? "text-primary-foreground" : "text-primary-foreground/60")}>{item.title}</h3>
                <p className={cn("text-sm leading-relaxed", item.highlight ? "text-primary-foreground/80" : "text-primary-foreground/40")}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 9. USE CASES ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Voor wie"
            title="Van café tot festival — TX PromoShare past bij jou"
            subtitle="Ontdek hoe het platform werkt voor jouw type organisatie"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {useCases.map((uc, i) => (
              <motion.div key={i} {...stagger(i)} className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow">
                <span className="text-3xl block mb-3">{uc.emoji}</span>
                <h3 className="font-display font-bold text-foreground mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 10. COMPARISON TABLE ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Vergelijking"
            title="Waarom TX PromoShare wint"
            subtitle="Vergelijk met handmatig werken en generieke eventplatformen"
          />
          <div className="max-w-4xl mx-auto rounded-2xl border border-border overflow-hidden bg-card shadow-card">
            <div className="grid grid-cols-4 bg-secondary/50 text-xs font-semibold text-muted-foreground">
              {comparisonHeaders.map((h, i) => (
                <div key={i} className={cn("p-3 md:p-4", i === 3 && "text-primary font-bold")}>{h}</div>
              ))}
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className="grid grid-cols-4 text-sm border-t border-border">
                <div className="p-3 md:p-4 text-foreground font-medium text-xs md:text-sm">{row.label}</div>
                <div className="p-3 md:p-4 text-muted-foreground text-xs">{row.manual}</div>
                <div className="p-3 md:p-4 text-muted-foreground text-xs">{row.generic}</div>
                <div className="p-3 md:p-4 text-foreground font-semibold text-xs">{row.tx}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 11. PRICING ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Prijzen"
            title="Eenvoudige, eerlijke prijzen"
            subtitle="Start gratis en groei mee met je evenementen"
          />
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.id} {...stagger(i)} className={cn("relative rounded-2xl p-6 md:p-8 border flex flex-col", plan.popular ? "border-primary bg-card shadow-glow scale-[1.02]" : "border-border bg-card shadow-card")}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-hero text-primary-foreground text-xs font-semibold">
                    Meest gekozen
                  </div>
                )}
                <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="my-5">
                  <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={cn("flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all", plan.popular ? "gradient-hero text-primary-foreground hover:opacity-90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                  {plan.id === "free" ? "Gratis starten" : "14 dagen gratis proberen"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 12. TICKETING ADD-ON ═══════ */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto rounded-2xl border border-dashed border-primary/20 bg-primary/[0.03] p-8 md:p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Ticket className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3">Binnenkort: ticketverkoop als add-on</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed">
              TX PromoShare wordt uitgebreid met een ticketing module. Verkoop tickets direct via je eventpagina, inclusief QR-scanning, betalingen via Stripe en Mollie, en bezoekersbeheer.
            </p>
            <p className="text-sm text-primary font-semibold">Pro plan gebruikers krijgen als eerste toegang</p>
          </div>
        </div>
      </section>

      {/* ═══════ 13. FAQ ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="FAQ"
            title="Veelgestelde vragen"
            subtitle="Alles wat je wilt weten over TX PromoShare"
          />
          <div className="max-w-2xl mx-auto space-y-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} {...stagger(i)} className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 md:p-5 text-left gap-4">
                  <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 md:px-5 pb-4 md:pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 14. FINAL CTA ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center p-10 md:p-14 rounded-3xl gradient-dark relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-display font-bold text-primary-foreground mb-4 leading-tight">
                Stop met losse tools en handmatig promotiewerk
              </h2>
              <p className="text-primary-foreground/70 mb-8 text-lg max-w-xl mx-auto">
                Breng je events samen in één slim systeem. Professioneel, snel en altijd synchroon.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow text-base">
                  Vraag een demo aan <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary-foreground/10 text-primary-foreground font-semibold hover:bg-primary-foreground/15 transition-colors text-base">
                  Start gratis <Sparkles className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-xs text-primary-foreground/40 mt-6">Geen creditcard nodig · Gratis plan beschikbaar · Opzeggen wanneer je wilt</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 15. FOOTER ═══════ */}
      <footer className="border-t border-border py-12 md:py-16">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-sm">TX</span>
                </div>
                <span className="font-display font-bold text-lg text-foreground">PromoShare</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Het slimste event promotie platform voor horeca en organisatoren in Nederland.
              </p>
              <p className="text-xs text-muted-foreground/60">Made with <Heart className="w-3 h-3 inline text-primary" /> on Texel by ClickWise</p>
            </div>
            <div>
              <p className="font-display font-semibold text-foreground text-sm mb-3">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#hoe-het-werkt" className="hover:text-foreground transition-colors">Hoe het werkt</a></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Prijzen</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Widgets</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integraties</a></li>
              </ul>
            </div>
            <div>
              <p className="font-display font-semibold text-foreground text-sm mb-3">Bedrijf</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Over ons</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacybeleid</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Algemene voorwaarden</a></li>
              </ul>
            </div>
            <div>
              <p className="font-display font-semibold text-foreground text-sm mb-3">Contact</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" />info@txpromoshare.nl</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" />+31 (0) 222 - 000 000</li>
                <li className="flex items-center gap-2"><Globe className="w-4 h-4" /><a href="#" className="hover:text-foreground transition-colors">txpromoshare.nl</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 TX PromoShare. Alle rechten voorbehouden.</p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-foreground transition-colors">Inloggen</Link>
              <Link to="/register" className="hover:text-foreground transition-colors">Registreren</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
