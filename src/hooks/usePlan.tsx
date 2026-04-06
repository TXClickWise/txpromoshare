import { createContext, useContext, ReactNode, useMemo, useEffect, useState } from "react";
import { PlanId, planLimits, PlanLimits } from "@/lib/plans";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";

interface PlanContextValue {
  planId: PlanId;
  effectivePlanId: PlanId;
  limits: PlanLimits;
  canUse: (feature: keyof PlanLimits) => boolean;
  isAtLimit: (metric: "events" | "widgets" | "team", current: number) => boolean;
  usagePercent: (metric: "events" | "widgets" | "team", current: number) => number;
  upgradePlan: PlanId | null;
  hasOverride: boolean;
  overrideEndsAt: string | null;
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
  const [overridePlanId, setOverridePlanId] = useState<PlanId | null>(null);
  const [overrideEndsAt, setOverrideEndsAt] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    
    async function fetchPlanData() {
      // Fetch subscription plan
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("plan_id")
        .eq("tenant_id", tenantId!)
        .eq("status", "active")
        .maybeSingle();
      
      if (subError) {
        console.error("[PlanProvider] subscription fetch error:", subError.message);
      } else if (subData?.plan_id) {
        setPlanId(subData.plan_id as PlanId);
      }

      // Fetch active override
      const { data: overrideData, error: overrideError } = await supabase
        .from("plan_overrides")
        .select("override_plan_slug, ends_at")
        .eq("tenant_id", tenantId!)
        .eq("is_active", true)
        .maybeSingle();

      if (overrideError) {
        console.error("[PlanProvider] override fetch error:", overrideError.message);
      }

      if (overrideData) {
        const overrideSlug = overrideData.override_plan_slug as PlanId;
        if (overrideData.ends_at && new Date(overrideData.ends_at) < new Date()) {
          setOverridePlanId(null);
          setOverrideEndsAt(null);
        } else {
          setOverridePlanId(overrideSlug);
          setOverrideEndsAt(overrideData.ends_at);
        }
      } else {
        setOverridePlanId(null);
        setOverrideEndsAt(null);
      }
    }

    fetchPlanData();
  }, [tenantId]);

  const value = useMemo<PlanContextValue>(() => {
    const effectivePlanId = overridePlanId || planId;
    const limits = planLimits[effectivePlanId];
    return {
      planId,
      effectivePlanId,
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
      upgradePlan: getNextPlan(effectivePlanId),
      hasOverride: !!overridePlanId,
      overrideEndsAt,
    };
  }, [planId, overridePlanId, overrideEndsAt]);

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
