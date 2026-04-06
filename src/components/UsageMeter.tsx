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
  const max = metric === "events" ? limits.maxActiveEvents : metric === "widgets" ? limits.maxWidgets : limits.maxTeamMembers;
  const atLimit = isAtLimit(metric, current);
  const nearLimit = percent >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("text-muted-foreground", atLimit && "text-destructive font-semibold")}>
          {current} / {max === Infinity ? "∞" : max}
        </span>
      </div>
      <Progress value={max === Infinity ? 0 : percent} className={cn("h-2", atLimit && "[&>div]:bg-destructive")} />
      {atLimit && (
        <Link to="/app/billing" className="flex items-center gap-1 text-[11px] text-primary font-medium hover:underline">
          Upgrade voor meer {metricLabels[metric]} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
      {nearLimit && !atLimit && (
        <p className="text-[11px] text-amber-500">Je nadert je limiet</p>
      )}
    </div>
  );
}
