import { createContext, useContext, ReactNode, useMemo, useEffect, useState } from "react";
import { PlanId, planLimits, PlanLimits } from "@/lib/plans";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";

interface PlanContextValue {
  planId: PlanId;
  limits: PlanLimits;
  canUse: (feature: keyof PlanLimits) => boolean;
  isAtLimit: (metric: "events" | "widgets" | "team", current: number) => boolean;
  usagePercent: (metric: "events" | "widgets" | "team", current: number) => number;
  upgradePlan: PlanId | null;
}

const PlanContext = createContext<PlanContextValue | null>(null);

const metricToLimit: Record<string, keyof PlanLimits> = {
  events: "maxActiveEvents",
  widgets: "maxWidgets",
  team: "maxTeamMembers",
};

function getNextPlan(current: PlanId): PlanId | null {
  if (current === "free") return "basic";
  if (current === "basic") return "pro";
  return null;
}

export function PlanProvider({ children, planId: defaultPlanId = "free" }: { children: ReactNode; planId?: PlanId }) {
  const { tenantId } = useTenant();
  const [planId, setPlanId] = useState<PlanId>(defaultPlanId);

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.plan_id) {
          setPlanId(data.plan_id as PlanId);
        }
      });
  }, [tenantId]);

  const value = useMemo<PlanContextValue>(() => {
    const limits = planLimits[planId];
    return {
      planId,
      limits,
      canUse: (feature) => !!limits[feature],
      isAtLimit: (metric, current) => {
        const key = metricToLimit[metric] as keyof PlanLimits;
        const max = limits[key] as number;
        return current >= max;
      },
      usagePercent: (metric, current) => {
        const key = metricToLimit[metric] as keyof PlanLimits;
        const max = limits[key] as number;
        if (max === Infinity) return 0;
        return Math.min(100, Math.round((current / max) * 100));
      },
      upgradePlan: getNextPlan(planId),
    };
  }, [planId]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}

/** Feature names mapped to which plan unlocks them */
export const featureUnlockPlan: Record<string, PlanId> = {
  customCategories: "basic",
  customBranding: "basic",
  agendaWidget: "basic",
  singleEventWidget: "basic",
  allTemplates: "basic",
  distributionCenter: "basic",
  advancedBranding: "pro",
  multipleLocations: "pro",
  clickwiseIntegration: "pro",
  advancedDistribution: "pro",
  advancedAnalytics: "pro",
  ticketingReady: "pro",
};
