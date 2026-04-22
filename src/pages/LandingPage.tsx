import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, Share2, Code2, Zap, Palette, Users, ArrowRight, Check, Star, Shield,
  Clock, Smartphone, MessageCircle, Layout, Repeat, Tags, Ticket, ChevronDown,
  Globe, BarChart3, Target, Plug, Sparkles, Heart, Mail, Phone,
  TrendingUp, Eye, Layers, RefreshCw
} from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSEO, organizationSchema, websiteSchema, softwareSchema, faqSchema } from "@/lib/seo";
import logoTxEventShare from "@/assets/logo-tx-eventshare.png";

/* ────────────────────────── Data ────────────────────────── */

const heroTrust = [
  { icon: Clock, text: "Event live in < 5 minuten" },
  { icon: Smartphone, text: "Mobile-first design" },
  { icon: Shield, text: "GDPR-compliant & veilig" },
  { icon: Code2, text: "Geen developer nodig" },
];

const problems = [
  { emoji: "😩", title: "Event op Instagram, maar niet op je site", desc: "Je promoot op social media, maar je website vertelt een ander verhaal. Bezoekers raken de weg kwijt." },
  { emoji: "🔁", title: "Elke keer dezelfde info opnieuw typen", desc: "Kopieer-plakken naar WhatsApp, Facebook, je website en intern. Dezelfde tekst, steeds opnieuw." },
  { emoji: "⏳", title: "Agenda op je website is verouderd", desc: "Handmatig bijwerken kost tijd. Geen tijd? Dan staat er verouderde info. Of helemaal niks." },
  { emoji: "📱", title: "WhatsApp promotie kost te veel tijd", desc: "Geen vaste teksten, geen consistente stijl. Elk bericht is improvisatie." },
  { emoji: "🎨", title: "Eventpagina's voelen generiek", desc: "Standaard templates zonder jouw branding. Je events verdienen beter." },
  { emoji: "🏗️", title: "Grote tools, gebouwd voor grote festivals", desc: "Ticketing-first platforms met honderden opties die je niet nodig hebt. Overkill voor jouw events." },
];

const benefits = [
  { icon: Zap, title: "Minder handmatig werk", desc: "Voer je event één keer in. TX EventShare genereert automatisch share-teksten, widget-content en je eventpagina." },
  { icon: RefreshCw, title: "Altijd actuele eventinformatie", desc: "Wijzig je event op één plek — je website, widgets en deellinks worden direct bijgewerkt." },
  { icon: Palette, title: "Professionelere uitstraling", desc: "Gebrandede eventpagina's en widgets die passen bij jouw merk. Geen generieke standaardpagina's meer." },
  { icon: TrendingUp, title: "Sneller promoten", desc: "Kant-en-klare teksten voor WhatsApp, social media en e-mail. Kopieer, plak en deel. Klaar." },
  { icon: Users, title: "Beter samenwerken", desc: "Teamleden uitnodigen met de juiste rechten. Iedereen werkt vanuit dezelfde bron, zonder verwarring." },
  { icon: Layers, title: "Alles centraal beheerd", desc: "Eén dashboard voor je agenda, distributie, branding en analytics. Geen vijf losse tools meer." },
];

const solutionSteps = [
  { num: "1", title: "Maak je event aan", desc: "Kies een sjabloon of begin blanco. Vul titel, datum, locatie en beschrijving één keer in.", icon: Calendar },
  { num: "2", title: "Publiceer met één klik", desc: "Voeg je branding toe, kies een categorie en zet je event live. Direct zichtbaar.", icon: Eye },
  { num: "3", title: "Widget op je website", desc: "Kopieer een klein stukje code. Je agenda of event verschijnt automatisch op je website.", icon: Code2 },
  { num: "4", title: "Deel via socials & WhatsApp", desc: "Gebruik de kant-en-klare teksten en links. Deel direct, zonder opnieuw te schrijven.", icon: Share2 },
];

const features = [
  { icon: Calendar, title: "Slimme event agenda", desc: "Beheer al je evenementen centraal. Dupliceer, plan vooruit en herhaal moeiteloos." },
  { icon: Repeat, title: "Event templates", desc: "Maak terugkerende events in seconden aan vanuit bewezen sjablonen." },
  { icon: Layout, title: "Embedded agenda widget", desc: "Toon je complete programma op je website. Altijd actueel, altijd responsive." },
  { icon: Target, title: "Enkel event widget", desc: "Highlight één event als compacte promo card op je homepage of blogpost." },
  { icon: Globe, title: "Branded eventpagina's", desc: "Professionele landingspagina's in jouw huisstijl voor elk evenement." },
  { icon: Share2, title: "Delen via socials", desc: "Kant-en-klare share teksten per kanaal. Facebook, Instagram, LinkedIn — kopieer en deel." },
  { icon: MessageCircle, title: "Delen via WhatsApp", desc: "Gestandaardiseerde WhatsApp-teksten met link. Consistent, snel en professioneel." },
  { icon: Tags, title: "Eigen categorieën", desc: "Organiseer events op jouw manier met aangepaste labels en kleuren." },
  { icon: Users, title: "Teamleden & rollen", desc: "Nodig collega's uit als redacteur, marketeer of bekijker met afgestemde rechten." },
  { icon: Clock, title: "Auto-deactivatie", desc: "Events worden automatisch gedeactiveerd na de einddatum. Geen handmatig opruimwerk." },
  { icon: Plug, title: "ClickWise koppeling", desc: "Automatische reminders naar je gasten, slimmere opvolging na events en je promotie op de automatische piloot. Apart ClickWise abonnement vereist." },
  { icon: Ticket, title: "Ticketverkoop (uitbreidbaar)", desc: "Bereid je voor op ticketverkoop als toekomstige add-on module. Nu al in de architectuur.", upcoming: true },
];

const useCases = [
  { emoji: "🍺", title: "Cafés & bars", desc: "Pubquizzen, live muziek, thema-avonden — altijd zichtbaar op je site en in WhatsApp-groepen.", value: "Meer gasten bij je events zonder extra promotiewerk." },
  { emoji: "🍽️", title: "Restaurants & beach clubs", desc: "Proeverijen, speciale diners en seizoensevents. Professioneel gepresenteerd, snel gedeeld.", value: "Hogere bezettingsgraad door betere zichtbaarheid." },
  { emoji: "🎵", title: "Poppodia & live muziek", desc: "Programmering beheren, agenda op je website en events promoten bij je publiek.", value: "Professionele uitstraling zonder extra werk voor je team." },
  { emoji: "🎪", title: "Eventorganisaties", desc: "Eén dashboard voor al je projecten. Van bedrijfsevent tot community gathering.", value: "Schaalbaar systeem dat meegroeit met je organisatie." },
  { emoji: "🎉", title: "Festivalorganisaties", desc: "Meerdere podia, categorieën en teamleden. Alles op één plek, overal zichtbaar.", value: "Overzicht en controle, ook bij complexe programma's." },
];

const comparisonHeaders = ["", "Handmatig werken", "Generiek platform", "TX EventShare"];
const comparisonRows = [
  { label: "Event aanmaken", manual: "Langzaam", generic: "Oké", tx: "✅ < 5 min" },
  { label: "Website agenda", manual: "Handmatig", generic: "Beperkt", tx: "✅ Automatisch" },
  { label: "Website widget", manual: "❌", generic: "Beperkt", tx: "✅ Agenda + event" },
  { label: "WhatsApp delen", manual: "Improviserend", generic: "❌", tx: "✅ Kant-en-klaar" },
  { label: "Social media teksten", manual: "Handmatig", generic: "Beperkt", tx: "✅ Per kanaal" },
  { label: "Eigen branding", manual: "Eigen ontwerp", generic: "Beperkt", tx: "✅ Volledig" },
  { label: "Terugkerende events", manual: "Opnieuw maken", generic: "Beperkt", tx: "✅ Templates" },
  { label: "Teamsamenwerking", manual: "WhatsApp/mail", generic: "Beperkt", tx: "✅ Met rollen" },
  { label: "ClickWise koppeling (apart abo)", manual: "❌", generic: "❌", tx: "✅ Inclusief" },
  { label: "Distributie centrum", manual: "❌", generic: "❌", tx: "✅ Alle kanalen" },
  { label: "Focus", manual: "—", generic: "Ticketing-first", tx: "Promotie & agenda" },
];

const plans = [
  { ...t.plans.free, id: "free", popular: false },
  { ...t.plans.basic, id: "basic", popular: true },
  { ...t.plans.pro, id: "pro", popular: false },
];

const faqs = [
  { q: "Is TX EventShare geschikt voor kleine events?", a: "Absoluut. Het platform is specifiek ontworpen voor events van 10 tot 3000 bezoekers. Van een wekelijkse pubquiz tot een stadsfeest — het werkt voor alles daartussenin." },
  { q: "Kan ik de agenda op mijn eigen website plaatsen?", a: "Ja. Je kopieert een klein stukje code en plakt dat op je website. De agenda widget is responsive, altijd automatisch bijgewerkt en past zich aan aan jouw huisstijl." },
  { q: "Werkt het ook voor terugkerende events?", a: "Ja. Je kunt sjablonen maken en events dupliceren met één klik. Ideaal voor wekelijkse live muziek, maandelijkse proeverijen of seizoensgebonden activiteiten." },
  { q: "Kunnen meerdere teamleden ermee werken?", a: "Ja. Je kunt teamleden uitnodigen met verschillende rollen: eigenaar, beheerder, redacteur, marketeer of bekijker. Iedereen werkt vanuit dezelfde actuele informatie." },
  { q: "Is er een koppeling met ClickWise?", a: "Ja. Via de ClickWise koppeling krijgen je gasten automatisch reminders voor aanvang en start je follow-up vanzelf na afloop. De koppeling vereist een apart ClickWise abonnement. Heb je al ClickWise? Dan is de koppeling gratis. We bieden ook een Done For You service aan waarbij wij alles voor je inrichten (v.a. €89,- excl. btw)." },
  { q: "Komt ticketverkoop later beschikbaar?", a: "Ja. Ticketing wordt ontwikkeld als add-on module voor Pro plan gebruikers. Inclusief QR-scanning, betalingen via Stripe/Mollie en bezoekersbeheer." },
  { q: "Is dit alleen voor horeca of ook voor eventorganisaties?", a: "Beide. Het platform schaalt van een klein café met 3 events per maand tot een professionele organisatie met tientallen evenementen, meerdere locaties en een volledig team." },
];

/* ────────────────────────── Helpers ────────────────────────── */

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };
const stagger = (i: number) => ({ ...fadeUp, transition: { duration: 0.5, delay: i * 0.08 } });

function SectionHeader({ eyebrow, title, subtitle, light = false }: { eyebrow?: string; title: string; subtitle?: string; light?: boolean }) {
  return (
    <div className="text-center mb-12 md:mb-16">
      {eyebrow && <p className={cn("text-xs font-semibold uppercase tracking-widest mb-3", light ? "text-primary-foreground/60" : "text-primary")}>{eyebrow}</p>}
      <h2 className={cn("text-2xl md:text-4xl font-display font-bold leading-tight mb-3", light ? "text-primary-foreground" : "text-foreground")}>{title}</h2>
      {subtitle && <p className={cn("text-lg max-w-2xl mx-auto leading-relaxed", light ? "text-primary-foreground/70" : "text-muted-foreground")}>{subtitle}</p>}
    </div>
  );
}

/* ────────────────────────── Page ────────────────────────── */

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: "Event Promotie Software voor Horeca & Organisatoren | TX EventShare",
    description: "Maak je event één keer aan en verspreid het direct naar je website, socials en WhatsApp. Agenda software met embedded widgets, branded eventpagina's en ClickWise integratie. Gratis starten.",
    canonical: "/",
    jsonLd: [
      organizationSchema,
      websiteSchema,
      softwareSchema,
      faqSchema(faqs.map(f => ({ question: f.q, answer: f.a }))),
    ],
  });
  return (
    <div>

      {/* ═══════ 1. HERO ═══════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
        <div className="container px-4 pt-20 pb-24 md:pt-28 md:pb-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
                <Star className="w-3.5 h-3.5" />
                 Het perfecte systeem voor kleinere events
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-[1.12] mb-5">
                Maak je event één keer aan.{" "}
                <span className="text-gradient-hero">Verspreid het overal.</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-3 leading-relaxed max-w-xl">
                Publiceer, beheer en promoot je evenementen vanuit één slim platform. Gebouwd voor horeca, organisatoren en festivals in Nederland.
              </p>
              <p className="text-sm text-muted-foreground/50 mb-7">
                Made with <Heart className="w-3 h-3 inline text-primary" /> on Texel by ClickWise
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow">
                  Start gratis <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#hoe-het-werkt" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors">
                  Bekijk hoe het werkt <ChevronDown className="w-4 h-4" />
                </a>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {heroTrust.map((item) => (
                  <div key={item.text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5 text-accent" />
                    {item.text}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Product mockup */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:block">
              <div className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/30">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-destructive/40" /><div className="w-2.5 h-2.5 rounded-full bg-highlight/40" /><div className="w-2.5 h-2.5 rounded-full bg-accent/40" /></div>
                  <div className="flex-1 text-center"><span className="text-[10px] text-muted-foreground font-mono">app.txeventshare.nl</span></div>
                </div>
                <div className="p-5 bg-gradient-to-br from-surface-cool to-card">
                  {/* Mini dashboard mockup */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { icon: Calendar, label: "3 events", sub: "Actief" },
                      { icon: Share2, label: "12 shares", sub: "Deze week" },
                      { icon: Code2, label: "2 widgets", sub: "Live" },
                    ].map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.12 }} className="p-3 rounded-lg bg-card border border-border shadow-card text-center">
                        <div className="w-8 h-8 rounded-md gradient-hero flex items-center justify-center mx-auto mb-2">
                          <m.icon className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <p className="font-display font-bold text-foreground text-xs">{m.label}</p>
                        <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                  {/* Mini event list */}
                  <div className="space-y-2">
                    {["Live Jazz Avond", "Wijnproeverij", "Pubquiz Vrijdag"].map((title, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{title}</p>
                          <p className="text-[10px] text-muted-foreground">18 apr · 20:00</p>
                        </div>
                        <div className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-semibold">Live</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile mockup summary */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-12 lg:hidden">
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {[
                { icon: Calendar, label: "3 events", sub: "Actief" },
                { icon: Share2, label: "12 shares", sub: "Deze week" },
                { icon: Code2, label: "2 widgets", sub: "Live" },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-card border border-border shadow-card text-center">
                  <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center mx-auto mb-2">
                    <m.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="font-display font-bold text-foreground text-xs">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ 2. PROBLEM ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Herkenbaar?"
            title="Je eventpromotie is versnipperd"
            subtitle="Horeca en organisatoren worstelen dagelijks met dezelfde frustraties. Herken jij dit?"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {problems.map((p, i) => (
              <motion.div key={i} {...stagger(i)} className="p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow">
                <span className="text-2xl mb-3 block">{p.emoji}</span>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1.5">{p.title}</h3>
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
            subtitle="Maak je event één keer aan, beheer het centraal en verspreid het direct naar je website, socials, WhatsApp en je bredere marketingflow."
          />
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 items-start mb-14">
              {[
                { label: "Aanmaken", desc: "Eén keer invoeren met slimme defaults en sjablonen", icon: Calendar },
                { label: "Centraal beheren", desc: "Eén dashboard voor al je events, branding en team", icon: Layout },
                { label: "Overal verspreiden", desc: "Website, WhatsApp, socials en CRM — automatisch", icon: Share2 },
              ].map((item, i) => (
                <motion.div key={i} {...stagger(i)} className="text-center relative">
                  <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                  {i < 2 && <ArrowRight className="w-5 h-5 text-muted-foreground/20 absolute -right-3 top-7 hidden md:block" />}
                </motion.div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Globe, label: "Agenda-first", text: "Je programma staat altijd centraal — niet ticketing" },
                { icon: Code2, label: "Widget-ready", text: "Direct embeddable op elke website, zonder developer" },
                { icon: MessageCircle, label: "Share-ready", text: "Kant-en-klare teksten voor elk promotiekanaal" },
                { icon: Plug, label: "ClickWise connected", text: "Native CRM integratie voor slimmere opvolging" },
              ].map((item, i) => (
                <motion.div key={i} {...stagger(i)} className="flex items-start gap-3 p-4 rounded-xl bg-surface-cool border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 4. KEY BENEFITS ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Resultaten"
            title="Wat TX EventShare je oplevert"
            subtitle="Geen feature-lijstje, maar echte resultaten voor jouw business"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div key={i} {...stagger(i)} className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow">
                <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 5. FEATURE GRID ═══════ */}
      <section className="py-20 md:py-28">
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
                  <span className="absolute top-3 right-3 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Uitbreidbaar</span>
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

      {/* ═══════ 6. HOW IT WORKS ═══════ */}
      <section id="hoe-het-werkt" className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Hoe het werkt"
            title="Van event naar promotie in 4 stappen"
            subtitle="Zo simpel dat je team het direct kan gebruiken — zonder training"
          />
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {solutionSteps.map((step, i) => (
              <motion.div key={i} {...stagger(i)} className="text-center relative">
                <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 md:right-auto md:left-1/2 md:ml-5 md:-top-1 w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{step.num}</span>
                </div>
                <h3 className="font-display font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < 3 && <ArrowRight className="w-5 h-5 text-muted-foreground/15 absolute -right-4 top-7 hidden md:block" />}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow">
              Probeer het zelf <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ 7. EMBEDDED WIDGETS ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Widgets"
            title="Je agenda, automatisch op je website"
            subtitle="Kopieer een klein stukje code en je events verschijnen direct. Altijd actueel, altijd in jouw huisstijl."
          />
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Agenda Widget",
                desc: "Toon je volledige programma als een overzichtelijke, gebrandede agenda op je website. Automatisch bijgewerkt wanneer je een event toevoegt, wijzigt of verwijdert.",
                features: ["Responsive op alle schermen", "Jouw kleuren en branding", "Automatisch gesynchroniseerd", "Klikt door naar je eventpagina"],
                mockupType: "agenda" as const
              },
              {
                title: "Enkel Event Widget",
                desc: "Highlight één specifiek evenement als compacte promo card. Ideaal voor je homepage, een blogpost of een speciale landingspagina.",
                features: ["Compacte, aantrekkelijke weergave", "CTA knop inbegrepen", "Verdwijnt automatisch na afloop", "Past bij elk website-ontwerp"],
                mockupType: "single" as const
              },
            ].map((widget, i) => (
              <motion.div key={i} {...stagger(i)} className="rounded-2xl bg-card border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow">
                <div className="h-44 bg-gradient-to-br from-primary/5 via-secondary to-surface-cool flex items-center justify-center border-b border-border p-6">
                  {widget.mockupType === "agenda" ? (
                    <div className="w-full max-w-[280px] rounded-xl bg-card border border-border shadow-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded gradient-hero" />
                        <div className="h-2 w-20 rounded-full bg-secondary" />
                      </div>
                      <div className="space-y-2.5">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-secondary shrink-0" />
                            <div className="flex-1 space-y-1">
                              <div className="h-2 w-full rounded-full bg-secondary" />
                              <div className="h-1.5 w-2/3 rounded-full bg-secondary/60" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-[260px] rounded-xl bg-card border border-border shadow-card overflow-hidden">
                      <div className="h-16 gradient-hero" />
                      <div className="p-3 space-y-2">
                        <div className="h-2.5 w-3/4 rounded-full bg-secondary" />
                        <div className="h-1.5 w-full rounded-full bg-secondary/60" />
                        <div className="h-6 w-20 rounded-md gradient-hero mt-2" />
                      </div>
                    </div>
                  )}
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

      {/* ═══════ 8. CLICKWISE INTEGRATION ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Promotie op de automatische piloot</p>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight mb-4">
                Je gasten herinneren.{" "}
                <span className="text-gradient-hero">Zonder dat jij eraan denkt.</span>
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Verbind TX EventShare met ClickWise en je gasten krijgen automatisch een herinnering voor aanvang. Na afloop start je follow-up vanzelf. Jij focust op je event, de rest draait op de achtergrond.
              </p>
              <ul className="space-y-3 mb-4">
                {[
                  "Gasten krijgen automatisch een herinnering voor aanvang",
                  "Na afloop start je follow-up vanzelf",
                  "Wijzig een event — alles wordt automatisch bijgewerkt",
                  "Eén ecosysteem in plaats van vijf losse tools",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mb-5">Apart ClickWise abonnement vereist. Al ClickWise klant? Koppeling is gratis. DFY setup v.a. €89,- excl. btw.</p>
              <Link to="/clickwise-integratie" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Ontdek de mogelijkheden <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl gradient-dark p-8 md:p-10">
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center shadow-glow">
                    <span className="text-primary-foreground font-display font-bold text-xl">TX</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-0.5 bg-primary/40" />
                    <Zap className="w-6 h-6 text-primary" />
                    <div className="w-10 h-0.5 bg-primary/40" />
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-display font-bold text-base">CW</span>
                  </div>
                </div>
                <p className="text-primary-foreground/80 text-sm text-center mb-4">Event publiceren → de rest gaat automatisch</p>
                <div className="space-y-2">
                  {["Event → Afspraak in je kalender", "Afspraak → Automatische reminder", "Event afgelopen → Follow-up campagne"].map((flow) => (
                    <div key={flow} className="flex items-center gap-2 text-xs text-primary-foreground/50">
                      <ArrowRight className="w-3 h-3 text-primary/60" />
                      {flow}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ 9. BUILT FOR SMALLER EVENTS ═══════ */}
      <section className="py-20 md:py-28 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container px-4 relative">
          <SectionHeader
            light
            eyebrow="Onze positionering"
            title="Het professionele systeem dat kleinere events wél verdienen"
            subtitle="De meeste tools zijn te basic of te zwaar. TX EventShare zit precies in de sweet spot: professioneel, schaalbaar, simpel en snel."
          />
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: "Te basic", desc: "Facebook-events, Google Docs, WhatsApp-chaos en handmatig kopieer-plakken. Geen structuur, geen branding, geen overzicht.", icon: "👎", highlight: false },
              { title: "Te zwaar", desc: "Enterprise ticketing platforms met complexe instellingen. Ticket-first, hoge kosten en overkill voor events tot 3000 bezoekers.", icon: "🏗️", highlight: false },
              { title: "TX EventShare", desc: "Professioneel, schaalbaar, simpel en snel. Agenda-first, distributie-first. Gebouwd voor events van 10 tot 3000 bezoekers.", icon: "✅", highlight: true },
            ].map((item, i) => (
              <motion.div key={i} {...stagger(i)} className={cn("p-6 rounded-2xl border", item.highlight ? "bg-primary/10 border-primary/30 shadow-glow" : "bg-primary-foreground/5 border-primary-foreground/10")}>
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h3 className={cn("font-display font-bold text-lg mb-2", item.highlight ? "text-primary-foreground" : "text-primary-foreground/60")}>{item.title}</h3>
                <p className={cn("text-sm leading-relaxed", item.highlight ? "text-primary-foreground/80" : "text-primary-foreground/40")}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow">
              Start gratis <Sparkles className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ 10. USE CASES ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Voor wie"
            title="Van café tot festival — TX EventShare past bij jou"
            subtitle="Ontdek hoe het platform werkt voor jouw type organisatie"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {useCases.map((uc, i) => (
              <motion.div key={i} {...stagger(i)} className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow group">
                <span className="text-3xl block mb-3">{uc.emoji}</span>
                <h3 className="font-display font-bold text-foreground mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{uc.desc}</p>
                <p className="text-xs font-semibold text-primary">{uc.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 11. COMPARISON TABLE ═══════ */}
      <section className="py-20 md:py-28 bg-surface-cool">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Vergelijking"
            title="Waarom TX EventShare de betere keuze is"
            subtitle="Vergelijk met handmatig werken en generieke eventplatformen"
          />
          <div className="max-w-4xl mx-auto rounded-2xl border border-border overflow-hidden bg-card shadow-card">
            <div className="grid grid-cols-4 bg-secondary/50">
              {comparisonHeaders.map((h, i) => (
                <div key={i} className={cn("p-3 md:p-4 text-xs font-bold", i === 3 ? "text-primary" : "text-muted-foreground")}>{h}</div>
              ))}
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className={cn("grid grid-cols-4 text-sm border-t border-border", i % 2 === 0 && "bg-secondary/20")}>
                <div className="p-3 md:p-4 text-foreground font-medium text-xs md:text-sm">{row.label}</div>
                <div className="p-3 md:p-4 text-muted-foreground text-xs">{row.manual}</div>
                <div className="p-3 md:p-4 text-muted-foreground text-xs">{row.generic}</div>
                <div className="p-3 md:p-4 text-foreground font-semibold text-xs">{row.tx}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 12. PRICING ═══════ */}
      <section id="prijzen" className="py-20 md:py-28 scroll-mt-20">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Prijzen"
            title="Eenvoudige, eerlijke prijzen"
            subtitle="Start gratis en groei mee met je evenementen. Geen verrassingen."
          />
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.id} {...stagger(i)} className={cn("relative rounded-2xl p-6 md:p-8 border flex flex-col", plan.popular ? "border-primary bg-card shadow-glow md:scale-[1.03]" : "border-border bg-card shadow-card")}>
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
                <Link to="/register" className={cn("flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all", plan.popular ? "gradient-hero text-primary-foreground hover:opacity-90 shadow-glow" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                  {plan.id === "free" ? "Gratis starten" : "14 dagen gratis proberen"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            <Link to="/pricing" className="text-primary font-semibold hover:underline">Bekijk de volledige vergelijking →</Link>
          </p>
        </div>
      </section>

      {/* ═══════ 13. TICKETING ADD-ON ═══════ */}
      <section className="py-16 md:py-20 bg-surface-cool">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto rounded-2xl border border-dashed border-primary/20 bg-card p-8 md:p-10 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Ticket className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3">Binnenkort: ticketverkoop als add-on</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed">
              TX EventShare wordt uitgebreid met een ticketing module. Verkoop tickets direct via je eventpagina, inclusief QR-scanning, betalingen via Stripe en Mollie, en volledig bezoekersbeheer.
            </p>
            <p className="text-sm text-primary font-semibold">Pro plan gebruikers krijgen als eerste toegang</p>
          </div>
        </div>
      </section>

      {/* ═══════ 14. FAQ ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <SectionHeader
            eyebrow="Veelgestelde vragen"
            title="Alles wat je wilt weten"
            subtitle="Heb je een andere vraag? Neem gerust contact op."
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

      {/* ═══════ 15. FINAL CTA ═══════ */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center p-10 md:p-16 rounded-3xl gradient-dark relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-display font-bold text-primary-foreground mb-4 leading-tight">
                Stop met losse tools en handmatig promotiewerk
              </h2>
              <p className="text-primary-foreground/70 mb-8 text-lg max-w-xl mx-auto leading-relaxed">
                Breng je events samen in één slim systeem. Professioneel, snel en altijd synchroon — zonder technisch gedoe.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow text-base">
                  Vraag een demo aan <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary-foreground/10 text-primary-foreground font-semibold hover:bg-primary-foreground/15 transition-colors text-base border border-primary-foreground/10">
                  Start gratis <Sparkles className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-xs text-primary-foreground/40 mt-6">Geen creditcard nodig · Gratis plan beschikbaar · Opzeggen wanneer je wilt</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 16. FOOTER ═══════ */}
      <footer className="border-t border-border py-12 md:py-16">
        <div className="container px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <img src={logoTxEventShare} alt="TX EventShare" className="w-auto mb-3" style={{ height: '6.075rem' }} />
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Het slimste event promotie platform voor horeca en organisatoren in Nederland.
              </p>
              <p className="text-xs text-muted-foreground/50">Made with <Heart className="w-3 h-3 inline text-primary" /> on Texel by ClickWise</p>
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
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" />info@txeventshare.nl</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" />+31 (0)222 - 000 000</li>
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 shrink-0" /><a href="#" className="hover:text-foreground transition-colors">txeventshare.nl</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 TX EventShare. Alle rechten voorbehouden.</p>
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
