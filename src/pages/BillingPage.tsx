import { CreditCard, Check, ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  { ...t.plans.free, id: "free", current: false },
  { ...t.plans.basic, id: "basic", current: true },
  { ...t.plans.pro, id: "pro", current: false },
];

export default function BillingPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.billing}</h1>
        <p className="text-sm text-muted-foreground mt-1">Beheer je abonnement en facturatie</p>
      </div>

      <div className="p-5 rounded-xl bg-card border border-border shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Huidig plan: Basic</h3>
        </div>
        <p className="text-sm text-muted-foreground">€29/maand · Volgende factuurdatum: 1 mei 2026</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={cn(
            "rounded-xl p-5 border flex flex-col",
            plan.current ? "border-primary bg-primary/5" : "border-border bg-card"
          )}>
            <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
            <p className="text-2xl font-display font-bold text-foreground mt-2">{plan.price}<span className="text-sm text-muted-foreground font-normal">{plan.period}</span></p>
            <ul className="mt-4 space-y-2 flex-1">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant={plan.current ? "outline" : "default"} size="sm" className={cn("mt-4", !plan.current && "gradient-hero text-primary-foreground border-0")} disabled={plan.current}>
              {plan.current ? "Huidig plan" : "Upgraden"}
            </Button>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-dashed border-border opacity-60">
        <p className="text-sm text-muted-foreground">
          💳 Stripe betalingsintegratie wordt binnenkort toegevoegd voor automatische facturatie.
        </p>
      </div>
    </div>
  );
}
