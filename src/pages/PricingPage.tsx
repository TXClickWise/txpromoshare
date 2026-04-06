import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const plans = [
  { ...t.plans.free, id: "free" as const, popular: false },
  { ...t.plans.basic, id: "basic" as const, popular: true },
  { ...t.plans.pro, id: "pro" as const, popular: false },
];

export default function PricingPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container px-4">
        <div className="text-center mb-14">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            {t.landing.pricing.title}
          </h1>
          <p className="text-lg text-muted-foreground">{t.landing.pricing.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative rounded-2xl p-6 md:p-8 border flex flex-col",
                plan.popular
                  ? "border-primary bg-card shadow-glow"
                  : "border-border bg-card shadow-card"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-hero text-primary-foreground text-xs font-semibold">
                  Populair
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
                {plan.id === "free" ? "Gratis starten" : "Kies dit plan"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 TX PromoShare. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}
