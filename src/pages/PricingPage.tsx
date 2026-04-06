import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSEO, breadcrumbSchema, faqSchema as faqSchemaLd } from "@/lib/seo";

const plans = [
  { ...t.plans.free, id: "free" as const, popular: false, cta: "Gratis starten" },
  { ...t.plans.basic, id: "basic" as const, popular: true, cta: "14 dagen gratis proberen" },
  { ...t.plans.pro, id: "pro" as const, popular: false, cta: "Start met Pro" },
];

const comparisonRows: { label: string; free: string | boolean; basic: string | boolean; pro: string | boolean }[] = [
  { label: "Actieve evenementen", free: "3", basic: "15", pro: "Onbeperkt" },
  { label: "Widgets", free: "1", basic: "3", pro: "Onbeperkt" },
  { label: "Teamleden", free: "1", basic: "3", pro: "10" },
  { label: "Eigen branding", free: false, basic: true, pro: true },
  { label: "Agenda widget", free: false, basic: true, pro: true },
  { label: "Enkel event widget", free: false, basic: true, pro: true },
  { label: "Distributie centrum", free: false, basic: true, pro: true },
  { label: "Alle sjablonen", free: false, basic: true, pro: true },
  { label: "Eigen categorieën", free: false, basic: true, pro: true },
  { label: "Geavanceerde branding", free: false, basic: false, pro: true },
  { label: "Meerdere locaties", free: false, basic: false, pro: true },
  { label: "ClickWise CRM integratie", free: false, basic: false, pro: true },
  { label: "Geavanceerde analytics", free: false, basic: false, pro: true },
  { label: "Prioriteit support", free: false, basic: false, pro: true },
  { label: "Ticketing module (binnenkort)", free: false, basic: false, pro: "Add-on" },
];

const faqs = [
  { q: "Kan ik op elk moment upgraden of downgraden?", a: "Ja, je kunt op elk moment wisselen van plan. Bij een upgrade start het nieuwe plan direct. Bij een downgrade blijft je huidige plan actief tot het einde van de factureringsperiode." },
  { q: "Is er een opzegperiode?", a: "Nee, je kunt op elk moment opzeggen. Er is geen opzegtermijn of boete." },
  { q: "Hoe werkt de gratis proefperiode?", a: "Het Basic en Pro plan zijn 14 dagen gratis uit te proberen. Je voert pas een betaalmethode in wanneer de proefperiode afloopt." },
  { q: "Wat gebeurt er als ik mijn limiet bereik?", a: "Je krijgt een melding wanneer je je limiet nadert. Bestaande evenementen blijven actief, maar je kunt geen nieuwe aanmaken tot je upgradet of ruimte vrij maakt." },
  { q: "Is ticketing inbegrepen?", a: "Ticketing wordt als toekomstige add-on module ontwikkeld. Pro plan gebruikers krijgen als eerste toegang wanneer deze beschikbaar komt." },
];

const socialProof = [
  { name: "Café De Kroeg", quote: "In 10 minuten onze hele agenda online. Ongelofelijk simpel.", role: "Eigenaar" },
  { name: "Festival Tilburg", quote: "Eindelijk één plek voor al onze promotie in plaats van 5 tools.", role: "Organisator" },
  { name: "Sportclub Eindhoven", quote: "Onze leden zien meteen wat er komt. De widget is geniaal.", role: "Bestuurslid" },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: "Prijzen & Abonnementen — Gratis Starten | TX EventShare",
    description: "Vergelijk de Free, Basic en Pro plannen van TX EventShare. Event promotie software vanaf €0. Meer events, widgets, teamleden en ClickWise integratie naarmate je groeit.",
    canonical: "/pricing",
    jsonLd: [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Prijzen", url: "/pricing" },
      ]),
      faqSchemaLd(faqs.map(f => ({ question: f.q, answer: f.a }))),
    ],
  });

  return (
    <div className="py-16 md:py-24">
      <div className="container px-4">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />14 dagen gratis uitproberen
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            {t.landing.pricing.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t.landing.pricing.subtitle}</p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative rounded-2xl p-6 md:p-8 border flex flex-col",
                plan.popular
                  ? "border-primary bg-card shadow-glow scale-[1.02]"
                  : "border-border bg-card shadow-card"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-hero text-primary-foreground text-xs font-semibold">
                  Meest gekozen
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all",
                  plan.popular
                    ? "gradient-hero text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Social proof */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-center text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-8">Wat organisatoren zeggen</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {socialProof.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="p-5 rounded-xl bg-card border border-border shadow-card">
                <p className="text-sm text-foreground italic mb-3">"{s.quote}"</p>
                <p className="text-xs font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.role}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-center text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-8">Alle features vergelijken</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 bg-secondary/50 text-xs font-semibold text-muted-foreground">
              <div className="p-3"></div>
              <div className="p-3 text-center">Free</div>
              <div className="p-3 text-center text-primary">Basic</div>
              <div className="p-3 text-center">Pro</div>
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className={cn("grid grid-cols-4 text-sm border-t border-border", i % 2 === 0 && "bg-card")}>
                <div className="p-3 text-foreground font-medium">{row.label}</div>
                {(["free", "basic", "pro"] as const).map((plan) => (
                  <div key={plan} className="p-3 flex items-center justify-center">
                    {typeof row[plan] === "boolean" ? (
                      row[plan] ? <Check className="w-4 h-4 text-accent" /> : <X className="w-4 h-4 text-muted-foreground/30" />
                    ) : (
                      <span className="text-xs text-foreground font-medium">{row[plan]}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-center text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-8">Veelgestelde vragen</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <HelpCircle className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Klaar om te starten?</h2>
          <p className="text-muted-foreground mb-6">Begin gratis en upgrade wanneer je wilt. Geen creditcard nodig.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow">
            Gratis account aanmaken <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <footer className="border-t border-border py-8 mt-20">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 TX EventShare. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}
