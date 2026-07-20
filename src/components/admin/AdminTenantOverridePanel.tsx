import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Override {
  id: string;
  original_plan_slug: string;
  override_plan_slug: string;
  started_at: string;
  ends_at: string | null;
  is_active: boolean;
  reverted_at: string | null;
  reason: string | null;
}

interface Props {
  tenantId: string;
  basePlan: string;
  overrides: Override[];
}

export function AdminTenantOverridePanel({ basePlan, overrides }: Props) {
  const active = overrides.find((o) => o.is_active);
  const history = overrides.filter((o) => !o.is_active).slice(0, 5);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-sm text-foreground">Plan & Override</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground capitalize">{basePlan}</span> is het betaalde plan (subscription).
              {active && <> Tijdelijk verhoogd naar <span className="font-medium text-foreground capitalize">{active.override_plan_slug}</span> via override.</>}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link to="/admin/overrides">
              Beheer overrides <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>

        {active ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15 border-0">Actieve override</Badge>
              <Badge variant="outline" className="capitalize">{active.original_plan_slug}</Badge>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <Badge className="capitalize">{active.override_plan_slug}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Gestart</p>
                <p className="font-medium text-foreground">{format(new Date(active.started_at), "d MMM yyyy", { locale: nl })}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Eindigt</p>
                <p className="font-medium text-foreground">{active.ends_at ? format(new Date(active.ends_at), "d MMM yyyy", { locale: nl }) : "Geen einddatum"}</p>
              </div>
            </div>
            {active.reason && (
              <div className="text-xs">
                <p className="text-muted-foreground">Reden</p>
                <p className="text-foreground">{active.reason}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-3 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Geen actieve override. De organisatie gebruikt de limieten van het <span className="capitalize font-medium text-foreground">{basePlan}</span> plan.
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Geschiedenis</p>
            <div className="space-y-1">
              {history.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs px-1.5 py-0">{o.original_plan_slug}</Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="secondary" className="capitalize text-xs px-1.5 py-0">{o.override_plan_slug}</Badge>
                    <span className="text-muted-foreground">
                      {o.reverted_at ? "teruggedraaid" : "verlopen"}
                    </span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {format(new Date(o.started_at), "d MMM yy", { locale: nl })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
