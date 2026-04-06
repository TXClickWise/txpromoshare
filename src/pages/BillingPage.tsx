import { CreditCard, Check, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const plans = [
  { ...t.plans.free, id: "free", current: false },
  { ...t.plans.basic, id: "basic", current: true },
  { ...t.plans.pro, id: "pro", current: false },
];

const usageLimits = [
  { label: "Actieve evenementen", current: 3, limit: 15, unit: "" },
  { label: "Widgets", current: 1, limit: 3, unit: "" },
  { label: "Teamleden", current: 2, limit: 3, unit: "" },
];

export default function BillingPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.billing}</h1>
        <p className="text-sm text-muted-foreground mt-1">Beheer je abonnement en bekijk je gebruik</p>
      </div>

      {/* Current plan */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Basic plan</h3>
              <p className="text-sm text-muted-foreground">€29/maand · Verlengd op 1 mei 2026</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Beheer abonnement</Button>
        </div>
      </motion.div>

      {/* Usage */}
      <div className="rounded-xl bg-card border border-border shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground text-sm mb-4">Gebruik deze periode</h3>
        <div className="space-y-4">
          {usageLimits.map((u) => (
            <div key={u.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-foreground font-medium">{u.label}</span>
                <span className="text-muted-foreground">{u.current} / {u.limit}</span>
              </div>
              <Progress value={(u.current / u.limit) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-4">Alle plannen vergelijken</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "rounded-xl p-5 border flex flex-col relative",
                plan.current ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card shadow-card"
              )}
            >
              {plan.current && (
                <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold">
                  Huidig plan
                </div>
              )}
              {plan.id === "pro" && !plan.current && (
                <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full gradient-accent text-accent-foreground text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />Aanbevolen
                </div>
              )}
              <h3 className="font-display font-bold text-foreground mt-1">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
              <p className="text-3xl font-display font-bold text-foreground mt-3">{plan.price}<span className="text-sm text-muted-foreground font-normal">{plan.period}</span></p>
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.current ? "outline" : "default"}
                size="sm"
                className={cn("mt-4", !plan.current && plan.id === "pro" && "gradient-hero text-primary-foreground border-0")}
                disabled={plan.current}
              >
                {plan.current ? "Huidig plan" : plan.id === "free" ? "Downgraden" : "Upgraden"}
                {!plan.current && <ArrowRight className="w-3 h-3 ml-1" />}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">
            💳 Stripe betalingsintegratie wordt binnenkort toegevoegd voor automatische facturatie.
            Je kunt nu upgraden door contact op te nemen.
          </p>
        </div>
      </div>
    </div>
  );
}
