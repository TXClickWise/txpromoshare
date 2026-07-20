import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Share2, Code2, ArrowRight, ChevronDown, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useSEO, organizationSchema, websiteSchema, softwareSchema, faqSchema } from "@/lib/seo";
import { useTranslation } from "@/hooks/useUILanguage";

// Referentie-logo's: vervang `logo` door een import zodra het bestand klaarstaat.
// Voorbeeld: import jutterLogo from "@/assets/refs/cafe-de-jutter.png";
const REFERENCES: Array<{ name: string; href: string; logo?: string }> = [
  { name: "Café De Jutter", href: "https://cafedejutter.nl", logo: undefined },
  { name: "Texels Specialiteiten Restaurant Eigeweis", href: "https://eigeweis.nl", logo: undefined },
  { name: "De Retro Brothers", href: "https://deretrobrothers.nl", logo: undefined },
];

const DEMO_WIDGET_ID = "c703b11a-45c1-4c6c-8ba5-2c1fe58cfda4";
const DEMO_EVENT_PATH = "/e/retro-brothers-dansen-door-de-80s-90s";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
    { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
    { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
    { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
  ];

  const steps = [
    { n: "01", title: t("landing.how.step1Title"), body: t("landing.how.step1Body") },
    { n: "02", title: t("landing.how.step2Title"), body: t("landing.how.step2Body") },
    { n: "03", title: t("landing.how.step3Title"), body: t("landing.how.step3Body") },
  ];

  const results = [
    { title: t("landing.results.block1Title"), body: t("landing.results.block1Body") },
    { title: t("landing.results.block2Title"), body: t("landing.results.block2Body") },
    { title: t("landing.results.block3Title"), body: t("landing.results.block3Body") },
  ];

  const refNames = [
    t("landing.refs.name1"),
    t("landing.refs.name2"),
    t("landing.refs.name3"),
  ];

  useSEO({
    title: "TX EventShare | Eén keer invoeren. Overal actueel.",
    description: "Voor cafés, restaurants en eventorganisatoren. Zet je evenement één keer klaar en het staat op je website, is deelbaar via WhatsApp en social, en je vaste gasten krijgen automatisch bericht.",
    canonical: "/",
    jsonLd: [
      organizationSchema,
      websiteSchema,
      softwareSchema,
      faqSchema(faqs.map((f) => ({ question: f.q, answer: f.a }))),
    ],
  });

  return (
    <div>
      {/* 1. HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
        <div className="container px-4 pt-16 pb-20 md:pt-24 md:pb-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-strong mb-5">
                {t("landing.hero.kicker")}
              </p>
              <h1 className="font-display font-bold text-foreground leading-[1.05] mb-6 text-4xl md:text-5xl lg:text-6xl">
                {t("landing.hero.titleLine1")}
                <span className="block italic text-accent mt-1">{t("landing.hero.titleLine2")}</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                {t("landing.hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-elevated">
                  {t("landing.hero.ctaPrimary")} <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href={DEMO_EVENT_PATH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors"
                >
                  {t("landing.hero.ctaSecondary")} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">{t("landing.hero.proof")}</p>
            </motion.div>

            {/* Hero mockup — responsive, ook op mobiel zichtbaar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="w-full max-w-full">
              <div className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden max-w-full">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/30">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-highlight/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-accent/40" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">app.txeventshare.nl</span>
                  </div>
                </div>
                <div className="p-3 sm:p-5 bg-gradient-to-br from-surface-cool to-card">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                    {[
                      { icon: Calendar, label: "3 events", sub: "Actief" },
                      { icon: Share2, label: "12 shares", sub: "Deze week" },
                      { icon: Code2, label: "2 widgets", sub: "Live" },
                    ].map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.12 }} className="p-2 sm:p-3 rounded-lg bg-card border border-border shadow-card text-center min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md gradient-hero flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                          <m.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                        </div>
                        <p className="font-display font-bold text-foreground text-[11px] sm:text-xs truncate">{m.label}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{m.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {["Live Jazz Avond", "Wijnproeverij", "Pubquiz Vrijdag"].map((title, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{title}</p>
                          <p className="text-xs text-muted-foreground">18 apr · 20:00</p>
                        </div>
                        <div className="px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[9px] font-semibold">Live</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM */}
      <section className="py-20 md:py-24 bg-surface-cool">
        <div className="container px-4">
          <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-5 leading-tight">
              {t("landing.problem.title")}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {t("landing.problem.body")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="hoe-het-werkt" className="py-20 md:py-28">
        <div className="container px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-strong mb-3">
              {t("landing.how.kicker")}
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight">
              {t("landing.how.title")}
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.n} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }} className="relative p-7 rounded-2xl border border-border bg-card">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-display text-4xl font-bold text-accent leading-none">{s.n}</span>
                  <div className="h-px flex-1 bg-accent/30" />
                </div>
                <h3 className="text-lg md:text-xl font-display font-semibold text-foreground mb-3">{s.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Live agenda-widget van Café De Jutter */}
          <motion.div {...fadeUp} className="mt-12 md:mt-16 max-w-3xl mx-auto">
            <LiveWidgetShowcase widgetId={DEMO_WIDGET_ID} loadingLabel={t("landing.how.step2LiveLoading")} />
            <p className="text-xs md:text-sm text-muted-foreground text-center mt-3">
              {t("landing.how.step2LiveCaption")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 4. REFERENCES */}
      <section className="py-14 md:py-16 bg-surface-cool border-y border-border">
        <div className="container px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">{t("landing.refs.eyebrow")}</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center">
            {REFERENCES.map((ref, i) => (
              <a
                key={ref.name}
                href={ref.href}
                target="_blank"
                rel="noopener noreferrer"
                data-ref-slot
                aria-label={ref.name}
                className="group inline-flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
              >
                {ref.logo ? (
                  <img
                    src={ref.logo}
                    alt={ref.name}
                    className="h-10 md:h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-[filter]"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-display text-base md:text-lg font-semibold text-foreground/70 tracking-wide">
                    {refNames[i]}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHAT YOU GET */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-strong mb-3">
              {t("landing.results.kicker")}
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight">
              {t("landing.results.title")}
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {results.map((r, i) => (
              <motion.div key={r.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }} className="p-7 rounded-2xl bg-card border border-border">
                <div className="w-10 h-0.5 bg-accent mb-5" />
                <h3 className="text-lg md:text-xl font-display font-semibold text-foreground mb-3">{r.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{r.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. AUDIENCE */}
      <section className="py-20 md:py-24 bg-surface-cool">
        <div className="container px-4">
          <motion.div {...fadeUp} className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-6 leading-tight text-center">
              {t("landing.audience.title")}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
              {t("landing.audience.body1")}
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {t("landing.audience.body2")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 7. PRICING TEASER */}
      <section id="prijzen" className="py-20 md:py-24">
        <div className="container px-4">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-5 leading-tight">
              {t("landing.pricingTeaser.title")}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
              {t("landing.pricingTeaser.body")}
            </p>
            <Link
              to="/prijzen"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              {t("landing.pricingTeaser.cta")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-20 md:py-24 bg-surface-cool">
        <div className="container px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight">
              {t("landing.faq.title")}
            </h2>
          </motion.div>
          <div className="max-w-2xl mx-auto divide-y divide-border border-y border-border">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-base md:text-lg font-display font-semibold text-foreground">{f.q}</span>
                    <span className={cn("shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-border transition-colors", open ? "bg-primary text-primary-foreground border-primary" : "text-foreground")}>
                      {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </button>
                  {open && (
                    <div className="pb-6 pr-12 text-sm md:text-base text-muted-foreground leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA (navy) */}
      <section className="py-20 md:py-28 bg-primary">
        <div className="container px-4">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-primary-foreground mb-5 leading-tight">
              {t("landing.final.title")}
            </h2>
            <p className="text-base md:text-lg text-primary-foreground/75 leading-relaxed mb-8">
              {t("landing.final.body")}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity shadow-elevated"
            >
              {t("landing.final.cta")} <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// --- Live widget showcase ------------------------------------------------
// Sluit de widget in op exact dezelfde manier als de officiële iframe-embed
// (zie WidgetEmbedInstructions.tsx, tab "iframe"): een iframe naar de
// widget-embed edge function met format=html&v=2. We laden pas wanneer het
// blok in beeld komt, zodat de pagina niet trager wordt.
function LiveWidgetShowcase({ widgetId, loadingLabel }: { widgetId: string; loadingLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!containerRef.current || inView) return;
    const el = containerRef.current;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const src = `${baseUrl}/functions/v1/widget-embed?widget_id=${widgetId}&format=html&v=2`;

  return (
    <div ref={containerRef} className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-highlight/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent/40" />
        </div>
        <div className="flex-1 mx-2 px-3 py-1 rounded-md bg-background/70 text-[11px] md:text-xs text-muted-foreground font-mono truncate text-center">
          cafedejutter.nl
        </div>
      </div>
      <div className="bg-white">
        {inView ? (
          <iframe
            src={src}
            title="Live agenda Café De Jutter"
            loading="lazy"
            className="block w-full border-0"
            style={{ height: 640 }}
          />
        ) : (
          <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: 320 }}>
            {loadingLabel}
          </div>
        )}
      </div>
    </div>
  );
}
