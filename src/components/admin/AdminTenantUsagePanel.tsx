import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, LayoutGrid, Users } from "lucide-react";
import { planLimits, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  tenantId: string;
  effectivePlanId: PlanId;
}

interface UsageRow {
  metric: string;
  current_value: number;
}

const metricMeta: Record<string, { label: string; icon: typeof Calendar; limitKey: keyof typeof planLimits.free }> = {
  events: { label: "Actieve evenementen", icon: Calendar, limitKey: "maxActiveEvents" },
  widgets: { label: "Widgets", icon: LayoutGrid, limitKey: "maxWidgets" },
  team: { label: "Teamleden", icon: Users, limitKey: "maxTeamMembers" },
};

export function AdminTenantUsagePanel({ tenantId, effectivePlanId }: Props) {
  const [usage, setUsage] = useState<Record<string, number>>({ events: 0, widgets: 0, team: 0 });
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("usage_tracking")
      .select("metric, current_value")
      .eq("tenant_id", tenantId);
    const map: Record<string, number> = { events: 0, widgets: 0, team: 0 };
    (data || []).forEach((r: UsageRow) => {
      if (r.metric in map) map[r.metric] = r.current_value;
    });
    setUsage(map);
  }

  async function refresh() {
    setRefreshing(true);
    const { error } = await supabase.rpc("refresh_tenant_usage", { _tenant_id: tenantId });
    if (error) toast.error("Kon gebruik niet vernieuwen");
    else {
      await load();
      toast.success("Gebruik bijgewerkt");
    }
    setRefreshing(false);
  }

  useEffect(() => {
    load();
  }, [tenantId]);

  const limits = planLimits[effectivePlanId];

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-sm text-foreground">Gebruik</h3>
            <p className="text-xs text-muted-foreground">Limieten op basis van actief plan: <span className="capitalize font-medium text-foreground">{effectivePlanId}</span></p>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing} className="gap-1.5 text-xs">
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Vernieuwen
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {(["events", "widgets", "team"] as const).map((metric) => {
            const meta = metricMeta[metric];
            const current = usage[metric];
            const max = limits[meta.limitKey] as number;
            const isUnlimited = max === Infinity;
            const percent = isUnlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
            const atLimit = !isUnlimited && current >= max;
            const Icon = meta.icon;
            return (
              <div key={metric} className="space-y-2 p-3 rounded-lg bg-secondary/40 border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {meta.label}
                  </span>
                  <span className={cn("tabular-nums", atLimit ? "text-destructive font-semibold" : "text-muted-foreground")}>
                    {current} / {isUnlimited ? "∞" : max}
                  </span>
                </div>
                <Progress
                  value={isUnlimited ? 100 : percent}
                  className={cn(
                    "h-1.5",
                    isUnlimited && "[&>div]:bg-accent/60",
                    atLimit && "[&>div]:bg-destructive",
                    !atLimit && percent >= 80 && "[&>div]:bg-accent",
                  )}
                />
                {atLimit && <p className="text-xs text-destructive font-medium">Limiet bereikt</p>}
                {!atLimit && percent >= 80 && <p className="text-xs text-muted-foreground">{percent}% gebruikt</p>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
