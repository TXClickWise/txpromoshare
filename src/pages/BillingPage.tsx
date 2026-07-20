import { Shield, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useUILanguage";
import { UsageMeter } from "@/components/UsageMeter";
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { PlanComparisonTable } from "@/components/billing/PlanComparisonTable";
import { AddOnsSection } from "@/components/billing/AddOnsSection";
import { usePlan } from "@/hooks/usePlan";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { STRIPE_PLAN_PRICES, type AddonDefinition } from "@/lib/stripePrices";
import { upgradeReason } from "@/lib/planPricing";
import type { PlanId } from "@/lib/plans";

const STRIPE_PRICES: Record<string, string> = {
  basic: STRIPE_PLAN_PRICES.basic,
  pro: STRIPE_PLAN_PRICES.pro,
};

export default function BillingPage() {
  const { t } = useTranslation();
  const { planId, effectivePlanId, hasOverride, overrideEndsAt } = usePlan();
  const { tenantId } = useTenant();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingAddon, setLoadingAddon] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [usage, setUsage] = useState({ events: 0, widgets: 0, team: 0 });
  const displayPlanId = effectivePlanId;

  useEffect(() => {
    if (!tenantId) return;
    supabase.rpc("refresh_tenant_usage", { _tenant_id: tenantId }).then(() => {
      supabase.from("usage_tracking").select("metric, current_value").eq("tenant_id", tenantId).then(({ data }) => {
        const u = { events: 0, widgets: 0, team: 0 };
        (data || []).forEach((row: any) => {
          if (row.metric in u) u[row.metric as keyof typeof u] = row.current_value;
        });
        setUsage(u);
      });
    });
  }, [tenantId]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Gelukt — je plan wordt bijgewerkt.");
      supabase.functions.invoke("check-subscription").then(({ data }) => {
        if (data?.plan_id) window.location.reload();
      });
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout geannuleerd.");
    }
  }, [searchParams]);

  async function handleCheckout(targetPlanId: PlanId) {
    const priceId = STRIPE_PRICES[targetPlanId];
    if (!priceId) return;
    setLoadingPlan(targetPlanId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { priceId } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Checkout kon niet worden gestart: " + (err.message || "Onbekende fout"));
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleAddon(addon: AddonDefinition) {
    setLoadingAddon(addon.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { priceId: addon.priceId } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Add-on kon niet worden gestart: " + (err.message || "Onbekende fout"));
    } finally {
      setLoadingAddon(null);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Portal kon niet worden geopend: " + (err.message || "Onbekende fout"));
    } finally {
      setPortalLoading(false);
    }
  }

  const upgradeKey =
    displayPlanId === "free" ? "free-to-basic" : displayPlanId === "basic" ? "basic-to-pro" : null;

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t("nav.billing")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("billing.subtitle")}
        </p>
      </div>

      {/* 1. Huidig plan */}
      <CurrentPlanCard
        planId={planId}
        effectivePlanId={effectivePlanId}
        hasOverride={hasOverride}
        overrideEndsAt={overrideEndsAt}
        onManage={handleManageSubscription}
        manageLoading={portalLoading}
      />

      {/* 2. Gebruik */}
      <div className="rounded-2xl bg-card border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground text-sm">{t("billing.usageThisPeriod")}</h3>
          {upgradeKey && (
            <p className="hidden sm:block text-xs text-muted-foreground italic">
              {upgradeReason[upgradeKey]}
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <UsageMeter metric="events" current={usage.events} label={t("billing.activeEvents")} />
          <UsageMeter metric="widgets" current={usage.widgets} label={t("billing.widgets")} />
          <UsageMeter metric="team" current={usage.team} label={t("billing.teamMembers")} />
        </div>
      </div>

      {/* 3. Plan-vergelijking */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {t("billing.comparePlans")}
        </h2>
        <PlanComparisonTable
          currentPlanId={displayPlanId}
          loadingPlan={loadingPlan}
          onUpgrade={handleCheckout}
          onManage={handleManageSubscription}
        />
      </div>

      {/* 4. Add-ons */}
      <AddOnsSection planId={displayPlanId} loadingAddon={loadingAddon} onAdd={handleAddon} />

      {/* 5. Ticketing teaser — ondergeschikt */}
      <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-foreground">Ticketing module · binnenkort</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verkoop tickets vanaf je eigen pagina, met QR-scanning en bezoekersbeheer. Pro gebruikers krijgen als eerste toegang.
          </p>
        </div>
      </div>

      {/* 6. Trust */}
      <div className="rounded-xl border border-dashed border-border p-3 flex items-start gap-2">
        <Shield className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Betalingen verlopen veilig via Stripe. Je betaalgegevens worden nooit op TX EventShare opgeslagen.
        </p>
      </div>

      {portalLoading && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg px-3 py-2 shadow-elevated flex items-center gap-2 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" /> Portal openen…
        </div>
      )}
    </div>
  );
}
