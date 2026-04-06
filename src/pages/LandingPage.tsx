import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Share2, Code2, Zap, Palette, Users, ArrowRight, Check, Star } from "lucide-react";
import { t } from "@/lib/i18n";

const features = [
  { icon: Calendar, title: "Slim evenementbeheer", desc: "Maak, dupliceer en plan evenementen in seconden. Met sjablonen, terugkerende events en auto-deactivatie." },
  { icon: Share2, title: "Eén-klik distributie", desc: "Verspreid naar je website, WhatsApp, social media en CRM — vanuit één scherm." },
  { icon: Code2, title: "Embeddable widgets", desc: "Plak een agenda of event widget op je website. Responsive, snel en volledig in jouw huisstijl." },
  { icon: Palette, title: "Jouw branding", desc: "Geen generieke eventpagina's meer. Pas kleuren, logo en stijl aan. Jouw merk, altijd." },
  { icon: Zap, title: "ClickWise / HighLevel", desc: "Native integratie met je CRM. Automatiseer opvolging, campagnes en promotie." },
  { icon: Users, title: "Teamsamenwerking", desc: "Nodig collega's uit met de juiste rechten. Eigenaar, redacteur, marketeer of bekijker." },
];

const stats = [
  { value: "10-3000", label: "bezoekers per event" },
  { value: "<5 min", label: "event live" },
  { value: "1x", label: "invoeren, overal delen" },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-dark opacity-[0.03]" />
        <div className="container px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Star className="w-3.5 h-3.5" />
              {t.landing.hero.badge}
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-5">
              {t.landing.hero.title.split(",")[0]},
              <span className="text-gradient-hero"> overal zichtbaar</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t.landing.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow">
                {t.landing.hero.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors">
                Bekijk prijzen
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface-cool">
        <div className="container px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-3">
              {t.landing.features.title}
            </h2>
            <p className="text-muted-foreground text-lg">{t.landing.features.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center p-10 rounded-2xl gradient-dark">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-3">
              {t.landing.cta.title}
            </h2>
            <p className="text-primary-foreground/70 mb-8">{t.landing.cta.subtitle}</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
              {t.landing.cta.button}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-[10px]">TX</span>
            </div>
            <span className="font-display font-semibold text-foreground">TX PromoShare</span>
          </div>
          <p>© 2026 TX PromoShare. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}
