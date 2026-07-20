import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useUILanguage";
import type { AddonDefinition } from "@/lib/stripePrices";

interface AddOnCardProps {
  addon: AddonDefinition;
  loading?: boolean;
  onAdd: (addon: AddonDefinition) => void;
}

export function AddOnCard({ addon, loading, onAdd }: AddOnCardProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col h-full hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display font-semibold text-foreground text-sm">{addon.name}</h4>
        {addon.badge && (
          <span className="text-xs font-semibold uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
            {addon.badge}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 flex-1">{addon.pitch}</p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-lg font-display font-bold text-foreground">{addon.priceLabel}</span>
        <span className="text-xs text-muted-foreground">{addon.priceSuffix}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => onAdd(addon)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Plus className="w-3 h-3 mr-1" />
        )}
        {t("addons.add")}
      </Button>
    </div>
  );
}
