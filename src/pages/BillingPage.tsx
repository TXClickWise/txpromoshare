import { CreditCard, Check, ArrowRight, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UsageMeter } from "@/components/UsageMeter";
import { usePlan } from "@/hooks/usePlan";

const plans = [
  { ...t.plans.free, id: "free" as const },
  { ...t.plans.basic, id: "basic" as const },
  { ...t.plans.pro, id: "pro" as const },
];

export default function BillingPage() {
  const { planId } = usePlan();

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
              <h3 className="font-display font-bold text-foreground">{planId.charAt(0).toUpperCase() + planId.slice(1)} plan</h3>
              <p className="text-sm text-muted-foreground">
                {planId === "free" ? "Gratis · Geen factuurperiode" : planId === "basic" ? "€29/maand · Verlengd op 1 mei 2026" : "€79/maand · Verlengd op 1 mei 2026"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">Beheer abonnement</Button>
        </div>
      </motion.div>

      {/* Usage */}
      <div className="rounded-xl bg-card border border-border shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground text-sm mb-4">Gebruik deze periode</h3>
        <div className="space-y-4">
          <UsageMeter metric="events" current={3} label="Actieve evenementen" />
          <UsageMeter metric="widgets" current={1} label="Widgets" />
          <UsageMeter metric="team" current={2} label="Teamleden" />
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-4">Alle plannen vergelijken</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const isCurrent = plan.id === planId;
            const isUpgrade = (planId === "free" && plan.id !== "free") || (planId === "basic" && plan.id === "pro");
            const isDowngrade = (planId === "pro" && plan.id !== "pro") || (planId === "basic" && plan.id === "free");
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "rounded-xl p-5 border flex flex-col relative",
                  isCurrent ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card shadow-card"
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold">
                    Huidig plan
                  </div>
                )}
                {plan.id === "pro" && !isCurrent && (
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
                  variant={isCurrent ? "outline" : "default"}
                  size="sm"
                  className={cn("mt-4", isUpgrade && plan.id === "pro" && "gradient-hero text-primary-foreground border-0")}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Huidig plan" : isDowngrade ? "Downgraden" : "Upgraden"}
                  {!isCurrent && <ArrowRight className="w-3 h-3 ml-1" />}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Ticketing upsell teaser */}
      <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-5 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">🎟️ Ticketing module — binnenkort beschikbaar</p>
          <p className="text-xs text-muted-foreground mt-1">
            Verkoop tickets direct via je evenementpagina. Beschikbaar als add-on voor Pro plan gebruikers.
            Inclusief QR-scanning, betalingen en bezoekersbeheer.
          </p>
          <p className="text-xs text-primary font-medium mt-2">Pro plan gebruikers krijgen als eerste toegang</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          💳 Stripe betalingsintegratie wordt binnenkort toegevoegd voor automatische facturatie.
          Je kunt nu upgraden door contact op te nemen.
        </p>
      </div>
    </div>
  );
}
