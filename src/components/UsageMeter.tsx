import { usePlan } from "@/hooks/usePlan";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageMeterProps {
  metric: "events" | "widgets" | "team";
  current: number;
  label: string;
}

const metricLabels: Record<string, string> = {
  events: "evenementen",
  widgets: "widgets",
  team: "teamleden",
};

export function UsageMeter({ metric, current, label }: UsageMeterProps) {
  const { limits, usagePercent, isAtLimit } = usePlan();
  const percent = usagePercent(metric, current);
  const max =
    metric === "events" ? limits.maxActiveEvents : metric === "widgets" ? limits.maxWidgets : limits.maxTeamMembers;
  const atLimit = isAtLimit(metric, current);
  const nearLimit = percent >= 80;
  const isUnlimited = max === Infinity;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span
          className={cn(
            "tabular-nums",
            atLimit ? "text-foreground font-semibold" : "text-muted-foreground",
          )}
        >
          {current} <span className="text-muted-foreground/70">/ {isUnlimited ? "onbeperkt" : max}</span>
        </span>
      </div>
      <Progress
        value={isUnlimited ? 100 : percent}
        className={cn(
          "h-1.5",
          isUnlimited && "[&>div]:bg-accent/60",
          atLimit && "[&>div]:bg-primary",
          !atLimit && nearLimit && "[&>div]:bg-accent",
        )}
      />
      {atLimit && !isUnlimited && (
        <Link
          to="/app/billing"
          className="inline-flex items-center gap-1 text-[11px] text-primary font-medium hover:underline"
        >
          Limiet bereikt — bekijk opties voor meer {metricLabels[metric]}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
      {nearLimit && !atLimit && (
        <p className="text-[11px] text-muted-foreground">Je nadert je limiet ({percent}%)</p>
      )}
    </div>
  );
}
