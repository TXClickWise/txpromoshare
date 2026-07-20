import { usePlan } from "@/hooks/usePlan";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useUILanguage";

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
  const { t } = useTranslation();
  const percent = usagePercent(metric, current);
  const max =
    metric === "events" ? limits.maxActiveEvents : metric === "widgets" ? limits.maxWidgets : limits.maxTeamMembers;
  const atLimit = isAtLimit(metric, current);
  const nearLimit = percent >= 80;
  const isUnlimited = max === Infinity;
  const barValue = isUnlimited ? 0 : percent;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span
          className={cn(
            "tabular-nums",
            atLimit && !isUnlimited ? "text-foreground font-semibold" : "text-muted-foreground",
          )}
        >
          {isUnlimited
            ? t("usage.usedOfUnlimited", { current: String(current) })
            : t("usage.usedOf", { current: String(current), max: String(max) })}
        </span>
      </div>
      <Progress
        value={barValue}
        className={cn(
          "h-1.5",
          // Default: navy fill.
          "[&>div]:bg-primary/70",
          atLimit && !isUnlimited && "[&>div]:bg-destructive",
          !atLimit && nearLimit && "[&>div]:bg-warning",
        )}
      />
      {atLimit && !isUnlimited && (
        <Link
          to="/app/billing"
          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          {t("usage.limitReached", { metric: metricLabels[metric] })}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
      {nearLimit && !atLimit && (
        <p className="text-xs text-muted-foreground">{t("usage.nearLimit", { percent: String(percent) })}</p>
      )}
    </div>
  );
}
