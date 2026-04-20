import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useUILanguage";
import type { UpgradeVariant } from "@/lib/upgradeCopy";

interface UpgradeBannerProps {
  feature?: string;
  plan?: string;
  compact?: boolean;
  variant?: UpgradeVariant;
}

export function UpgradeBanner({ feature, plan, compact = false, variant }: UpgradeBannerProps) {
  const { t } = useTranslation();

  // Variant-driven copy (preferred). Falls back to legacy feature/plan props.
  const copy = variant
    ? {
        title: t(`upgrade.copy.${variant === "free-to-basic" ? "freeToBasic" : variant === "basic-to-pro" ? "basicToPro" : "addon"}.title`),
        subtitle: t(`upgrade.copy.${variant === "free-to-basic" ? "freeToBasic" : variant === "basic-to-pro" ? "basicToPro" : "addon"}.subtitle`),
        cta: t(`upgrade.copy.${variant === "free-to-basic" ? "freeToBasic" : variant === "basic-to-pro" ? "basicToPro" : "addon"}.cta`),
        targetPlan: variant === "free-to-basic" ? "Basic" : variant === "basic-to-pro" ? "Pro" : "Add-on",
      }
    : null;

  const headline = copy?.title ?? feature ?? t("upgrade.fallbackTitle");
  const subline = copy?.subtitle ?? t("upgrade.fallbackSubtitle", { plan: plan ?? "Pro" });
  const ctaLabel = copy?.cta ?? t("upgrade.fallbackCta");
  const planLabel = copy?.targetPlan ?? plan ?? "Pro";

  if (compact) {
    return (
      <Link
        to="/app/billing"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs hover:bg-primary/10 transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{feature ?? headline}</span> · {t("upgrade.upgradeTo", { plan: planLabel })}
        </span>
        <ArrowRight className="w-3 h-3 text-primary ml-auto" />
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold text-foreground text-sm">{headline}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subline}</p>
        </div>
        <Link
          to="/app/billing"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-hero text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {ctaLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}
