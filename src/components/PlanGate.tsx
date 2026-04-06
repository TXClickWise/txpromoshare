import { ReactNode } from "react";
import { usePlan, featureUnlockPlan } from "@/hooks/usePlan";
import { PlanLimits } from "@/lib/plans";
import { UpgradeBanner } from "@/components/UpgradeBanner";

interface PlanGateProps {
  feature: keyof PlanLimits;
  label: string;
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
}

/** Renders children only if current plan has the feature, otherwise shows upgrade prompt */
export function PlanGate({ feature, label, children, fallback, compact = false }: PlanGateProps) {
  const { canUse } = usePlan();

  if (canUse(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const plan = featureUnlockPlan[feature] === "basic" ? "Basic" : "Pro";
  return <UpgradeBanner feature={label} plan={plan} compact={compact} />;
}
