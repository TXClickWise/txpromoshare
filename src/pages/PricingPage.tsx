import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, ArrowRight, Sparkles, ChevronDown, Zap, Users, Tag, Globe, Ticket } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSEO, breadcrumbSchema, faqSchema as faqSchemaLd } from "@/lib/seo";
import { STRIPE_ADDONS } from "@/lib/stripePrices";

type PlanId = "free" | "basic" | "pro";

interface PlanCard {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  popular: boolean;
  cta: string;
}

const plans: PlanCard[] = [
  { ...t.plans.free, id: "free", popular: false, cta: "Start gratis" },
  { ...t.plans.basic, id: "basic", popular: true, cta: "Start met Basic" },
  { ...t.plans.pro, id: "pro", popular: false, cta: "Kies Pro" },
];

const comparisonRows: { label: string; free: string | boolean; basic: string | boolean; pro: string | boolean }[] = [
  { label: "Actieve evenementen", free: "3", basic: "15", pro: "Onbeperkt" },
  { label: "Widgets", free: "1", basic: "3", pro: "Onbeperkt" },
  { label: "Teamleden", free: "1", basic: "3", pro: "10" },
  { label: "Event templates", free: "Basis", basic: "Alle", pro: "Alle" },
  { label: "Publieke eventpagina's", free: true, basic: true, pro: true },
  { label: "Stockfoto's", free: true, basic: true, pro: true },
  { label: "Basis branding", free: true, basic: true, pro: true },
  { label: "Uitgebreide branding", free: false, basic: "Beperkt", pro: "Volledig" },
  { label: "Eigen categorieën", free: false, basic: true, pro: true },
  { label: "Recurring events", free: false, basic: "Basis", pro: "Geavanceerd" },
  { label: "Scheduled publishing", free: false, basic: true, pro: true },
  { label: "Kanaalspecifieke distributie", free: false, basic: true, pro: true },
  { label: "Analytics", free: false, basic: "Basis", pro: "Uitgebreid" },
  { label: "Firecrawl brand import", free: false, basic: "Basis", pro: "Uitgebreid" },
  { label: "AI assistentie", free: false, basic: "Light", pro: "Pro" },
  { label: "Remove TX EventShare branding", free: false, basic: false, pro: true },
  { label: "Multi-location", free: false, basic: "Light", pro: "Volledig" },
  { label: "Prioriteit support", free: false, basic: false, pro: true },
];

const addOns = [
  { ...STRIPE_ADDONS.ai_plus, icon: Zap },
  { ...STRIPE_ADDONS.extra_member, icon: Users },
  { ...STRIPE_ADDONS.white_label_basic, icon: Tag },
  { ...STRIPE_ADDONS.extra_widget, icon: Globe },
];

const faqs = [
  {
    q: "Kan ik gratis starten?",
    a: "Ja. Free is gratis te gebruiken zonder creditcard. Je kunt direct evenementen aanmaken, publiceren en delen. Upgrade pas wanneer je meer nodig hebt.",
  },
  {
    q: "Kan ik later upgraden of downgraden?",
    a: "Ja, op elk moment. Bij een upgrade start het nieuwe plan direct. Bij een downgrade blijft je huidige plan actief tot het einde van de factureringsperiode.",
  },
  {
    q: "Wat telt als 'actief evenement'?",
    a: "Een evenement is actief zodra het de status concept, ingepland of gepubliceerd heeft en de einddatum nog niet voorbij is. Afgelopen of gearchiveerde evenementen tellen niet mee voor je limiet.",
  },
  {
    q: "Hoe werken teamleden?",
    a: "Elk teamlid is een gebruiker met een eigen rol (eigenaar, beheerder, redacteur, marketeer of bekijker). Op Basic kun je 3 leden uitnodigen, op Pro 10. Heb je meer nodig? Voeg extra leden toe als add-on.",
  },
  {
    q: "Kan ik meerdere locaties beheren?",
    a: "Free ondersteunt één primaire locatie. Basic biedt lichte multi-location ondersteuning. Pro geeft je volledige multi-location: meerdere locaties, eigen pagina's per locatie en bulkbeheer.",
  },
  {
    q: "Is AI inbegrepen?",
    a: "Ja. Basic bevat AI light voor titels, beschrijvingen en social-snippets. Pro bevat AI Pro met uitgebreide herschrijvingen, kwaliteitschecks en kanaalvarianten. Heb je nog meer nodig? Kies dan de AI Plus add-on.",
  },
  {
    q: "Komt ticketverkoop later beschikbaar?",
    a: "Ja, ticketing wordt als toekomstige add-on module ontwikkeld. Pro plan gebruikers krijgen als eerste toegang. Het wordt geen onderdeel van de basisprijs — je betaalt alleen wanneer je het écht gebruikt.",
  },
  {
    q: "Zijn de prijzen inclusief btw?",
    a: "Nee. Alle prijzen op deze pagina zijn exclusief 21% btw. Op je factuur wordt de btw apart vermeld zodat je deze kunt aftrekken.",
  },
];

const productSchemas = plans
  .filter((p) => p.id !== "free")
  .map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `TX EventShare ${p.name}`,
    description: p.description,
    brand: { "@type": "Brand", name: "TX EventShare" },
    offers: {
      "@type": "Offer",
      price: p.id === "basic" ? "24.00" : "69.00",
      priceCurrency: "EUR",
      url: "https://txeventshare.nl/pricing",
      availability: "https://schema.org/InStock",
    },
  }));

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobilePlan, setMobilePlan] = useState<PlanId>("basic");

  useSEO({
    title: "Prijzen TX EventShare — Vanaf €0. Eerlijk, slim, schaalbaar",
    description:
      "Vergelijk Free, Basic (€24) en Pro (€69) — eventpromotie software voor horeca, locaties en organisatoren. Excl. btw. Start gratis.",
    canonical: "/pricing",
    jsonLd: [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Prijzen", url: "/pricing" },
      ]),
      faqSchemaLd(faqs.map((f) => ({ question: f.q, answer: f.a }))),
      ...productSchemas,
    ],
  });

  return (
    <div className="py-16 md:py-24">
      <div className="container px-4">
        {/* Section 1 — Hero */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Start gratis · Upgrade wanneer je groeit
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Eerlijke prijzen voor slimme eventpromotie
          </h1>
          <p className="text-lg text-muted-foreground mb-3">
            Kies het plan dat past bij jouw events, team en ambities. Geen verborgen kosten, geen verrassingen.
          </p>
          <p className="text-xs text-muted-foreground">{t.plans.vatNote}</p>
        </div>

        {/* Section 2 — Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative rounded-2xl p-6 md:p-8 border flex flex-col",
                plan.popular
                  ? "border-primary bg-card shadow-glow md:scale-[1.04] md:-my-2"
                  : "border-border bg-card shadow-card"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-hero text-primary-foreground text-xs font-semibold whitespace-nowrap">
                  Meest gekozen
                </div>
              )}
              <div className="mb-5">
                <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{plan.description}</p>
              </div>
              <div className="mb-6 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
                {plan.id !== "free" && (
                  <span className="text-xs text-muted-foreground">· {t.plans.priceSuffix}</span>
                )}
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
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
                    ? "gradient-hero text-primary-foreground hover:opacity-90 shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Section 3 — Comparison table */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Vergelijk alle features
            </h2>
            <p className="text-sm text-muted-foreground">{t.plans.vatNote}</p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-4 bg-secondary/50 text-xs font-semibold text-muted-foreground sticky top-0">
              <div className="p-4">Feature</div>
              <div className="p-4 text-center">Free</div>
              <div className="p-4 text-center text-primary">Basic</div>
              <div className="p-4 text-center">Pro</div>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "grid grid-cols-4 text-sm border-t border-border",
                  i % 2 === 1 && "bg-secondary/20"
                )}
              >
                <div className="p-3.5 text-foreground font-medium">{row.label}</div>
                {(["free", "basic", "pro"] as const).map((plan) => (
                  <div key={plan} className="p-3.5 flex items-center justify-center text-center">
                    {typeof row[plan] === "boolean" ? (
                      row[plan] ? (
                        <Check className="w-4 h-4 text-accent" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/30" />
                      )
                    ) : (
                      <span className="text-xs text-foreground font-medium">{row[plan]}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile stacked plan picker */}
          <div className="md:hidden">
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-secondary/40 mb-4">
              {(["free", "basic", "pro"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setMobilePlan(p)}
                  className={cn(
                    "py-2 rounded-md text-xs font-semibold capitalize transition-colors",
                    mobilePlan === p
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {comparisonRows.map((row, i) => {
                const v = row[mobilePlan];
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 text-sm border-t border-border first:border-t-0",
                      i % 2 === 1 && "bg-secondary/20"
                    )}
                  >
                    <span className="text-foreground">{row.label}</span>
                    <span className="text-xs font-medium">
                      {typeof v === "boolean" ? (
                        v ? (
                          <Check className="w-4 h-4 text-accent" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/30" />
                        )
                      ) : (
                        <span className="text-foreground">{v}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4 — Add-ons */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Haal meer uit TX EventShare
            </h2>
            <p className="text-sm text-muted-foreground">
              Slimme uitbreidingen die met je organisatie meegroeien · {t.plans.priceSuffix}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {addOns.map((addon) => {
              const Icon = addon.icon;
              return (
                <div
                  key={addon.id}
                  className="rounded-xl border border-border bg-card p-5 flex gap-4 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-display font-semibold text-foreground text-sm">{addon.name}</h3>
                      <span className="text-sm font-bold text-foreground whitespace-nowrap">
                        {addon.priceLabel}
                        <span className="text-xs font-normal text-muted-foreground"> {addon.priceSuffix}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{addon.pitch}</p>
                  </div>
                </div>
              );
            })}
            {/* Ticketing teaser */}
            <div className="sm:col-span-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <h3 className="font-display font-semibold text-foreground text-sm">Ticketing module</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10">
                    Binnenkort beschikbaar
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Verkoop tickets direct via je evenementpagina — inclusief QR-scanning, betalingen en bezoekersbeheer.
                  Pro plan gebruikers krijgen als eerste toegang.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5 — FAQ */}
        <div className="max-w-2xl mx-auto mb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Veelgestelde vragen
            </h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left gap-4"
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                      openFaq === i && "rotate-180"
                    )}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-4 pb-4"
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 6 — Final CTA */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-3">
            Start gratis en maak je events overal beter zichtbaar
          </h2>
          <p className="text-muted-foreground mb-7">
            Geen creditcard nodig. Upgrade wanneer je toe bent aan meer events, widgets of teamleden.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow"
            >
              Start gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors"
            >
              Bekijk hoe het werkt
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-8 mt-20">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 TX EventShare. Alle rechten voorbehouden. Alle prijzen excl. 21% btw.</p>
        </div>
      </footer>
    </div>
  );
}
