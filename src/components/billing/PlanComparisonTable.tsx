import { Check, ArrowRight, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { planPresentation } from "@/lib/planPricing";
import type { PlanId } from "@/lib/plans";

interface PlanComparisonTableProps {
  currentPlanId: PlanId;
  loadingPlan: string | null;
  onUpgrade: (planId: PlanId) => void;
  onManage: () => void;
}

const planOrder: PlanId[] = ["free", "basic", "pro"];

export function PlanComparisonTable({
  currentPlanId,
  loadingPlan,
  onUpgrade,
  onManage,
}: PlanComparisonTableProps) {
  const currentRank = planOrder.indexOf(currentPlanId);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {planOrder.map((id, i) => {
        const plan = planPresentation[id];
        const rank = i;
        const isCurrent = id === currentPlanId;
        const isUpgrade = rank > currentRank;
        const isDowngrade = rank < currentRank;
        const isLoading = loadingPlan === id;
        const isRecommended = id === "pro" && currentPlanId !== "pro";

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "relative rounded-2xl border p-5 flex flex-col bg-card",
              isCurrent ? "border-primary shadow-glow bg-primary/5" : "border-border shadow-card",
            )}
          >
            {isCurrent && (
              <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold uppercase tracking-wide">
                Huidig plan
              </span>
            )}
            {!isCurrent && isRecommended && (
              <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full gradient-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Aanbevolen
              </span>
            )}

            <h3 className="font-display font-bold text-foreground text-base mt-1">{plan.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 min-h-[2.5rem]">{plan.tagline}</p>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-display font-bold text-foreground">{plan.priceLabel}</span>
              <span className="text-xs text-muted-foreground">{plan.priceSuffix}</span>
            </div>

            <ul className="mt-4 space-y-2 flex-1">
              {plan.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span className="text-foreground">{h}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] text-muted-foreground italic">{plan.bestFor}</p>

            <Button
              variant={isCurrent ? "outline" : "default"}
              size="sm"
              className={cn("mt-4", isUpgrade && id === "pro" && "gradient-hero text-primary-foreground border-0")}
              disabled={isCurrent || (isUpgrade && id === "free") || !!loadingPlan}
              onClick={() => {
                if (isUpgrade) onUpgrade(id);
                else if (isDowngrade) onManage();
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Even geduld…
                </>
              ) : isCurrent ? (
                "Je huidige plan"
              ) : isDowngrade ? (
                <>
                  Beheer abonnement
                  <ExternalLink className="w-3 h-3 ml-1" />
                </>
              ) : id === "free" ? (
                "Gratis plan"
              ) : (
                <>
                  Kies {plan.name}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
