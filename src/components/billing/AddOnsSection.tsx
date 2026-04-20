import { Puzzle } from "lucide-react";
import { AddOnCard } from "./AddOnCard";
import { getStripeAddons, type AddonDefinition } from "@/lib/stripePrices";
import { relevantAddOns } from "@/lib/planPricing";
import { useTranslation } from "@/hooks/useUILanguage";
import type { PlanId } from "@/lib/plans";

interface AddOnsSectionProps {
  planId: PlanId;
  loadingAddon: string | null;
  onAdd: (addon: AddonDefinition) => void;
}

export function AddOnsSection({ planId, loadingAddon, onAdd }: AddOnsSectionProps) {
  const { t } = useTranslation();
  const addons = getStripeAddons(t);
  const addonIds = relevantAddOns[planId];
  if (!addonIds.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Puzzle className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">
          {t("addons.sectionTitle")}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t("addons.sectionDesc")}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {addonIds.map((id) => (
          <AddOnCard
            key={id}
            addon={addons[id]}
            loading={loadingAddon === id}
            onAdd={onAdd}
          />
        ))}
      </div>
    </div>
  );
}
