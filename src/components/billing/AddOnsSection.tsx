import { Puzzle } from "lucide-react";
import { AddOnCard } from "./AddOnCard";
import { STRIPE_ADDONS, type AddonDefinition } from "@/lib/stripePrices";
import { relevantAddOns } from "@/lib/planPricing";
import type { PlanId } from "@/lib/plans";

interface AddOnsSectionProps {
  planId: PlanId;
  loadingAddon: string | null;
  onAdd: (addon: AddonDefinition) => void;
}

export function AddOnsSection({ planId, loadingAddon, onAdd }: AddOnsSectionProps) {
  const addonIds = relevantAddOns[planId];
  if (!addonIds.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Puzzle className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">
          Add-ons voor jouw plan
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Breid je plan uit met losse modules. Je kunt deze elk moment opzeggen via je abonnement.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {addonIds.map((id) => (
          <AddOnCard
            key={id}
            addon={STRIPE_ADDONS[id]}
            loading={loadingAddon === id}
            onAdd={onAdd}
          />
        ))}
      </div>
    </div>
  );
}
