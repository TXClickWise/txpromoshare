import { motion } from "framer-motion";
import { CreditCard, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlanPresentation } from "@/lib/planPricing";
import { useTranslation } from "@/hooks/useUILanguage";
import type { PlanId } from "@/lib/plans";

interface CurrentPlanCardProps {
  planId: PlanId;
  effectivePlanId: PlanId;
  hasOverride: boolean;
  overrideEndsAt: string | null;
  onManage: () => void;
  manageLoading: boolean;
}

export function CurrentPlanCard({
  planId,
  effectivePlanId,
  hasOverride,
  overrideEndsAt,
  onManage,
  manageLoading,
}: CurrentPlanCardProps) {
  const { t, language } = useTranslation();
  const plans = getPlanPresentation(t);
  const preset = plans[effectivePlanId];
  const dateLocale = language === "en" ? "en-US" : "nl-NL";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-foreground text-lg">{t("nav.plan", { plan: preset.name })}</h3>
              {hasOverride && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wide">
                  <Sparkles className="w-3 h-3" /> {t("billing.tempUpgrade")}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{preset.tagline}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {hasOverride ? (
                t("billing.activeUntil", {
                  date: overrideEndsAt ? new Date(overrideEndsAt).toLocaleDateString(dateLocale) : "—",
                  plan: plans[planId].name,
                })
              ) : effectivePlanId === "free" ? (
                t("billing.noBillingPeriod")
              ) : (
                <>
                  {preset.priceLabel}
                  <span className="text-muted-foreground/80">{preset.priceSuffix}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {planId !== "free" && (
          <Button variant="outline" size="sm" onClick={onManage} disabled={manageLoading}>
            {manageLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            )}
            {t("plans.manageSubscription")}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
