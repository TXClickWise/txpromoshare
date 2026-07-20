import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarDays, CalendarRange, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export type RecurringEditScope = "future" | "all" | "single";

interface RecurringEditScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scope: RecurringEditScope) => void;
  // Context to make the choice concrete
  futureCount?: number;
  totalCount?: number;
  /**
   * "single" is alleen relevant voor occurrence-bewerkingen.
   * In de wizard (master event) verbergen we deze optie standaard.
   */
  allowSingle?: boolean;
  /**
   * Lichte hint of er manuele wijzigingen zijn die overschreven kunnen worden.
   */
  hasManualEdits?: boolean;
}

const OPTIONS: Array<{
  value: RecurringEditScope;
  title: string;
  description: string;
  icon: typeof CalendarDays;
  recommended?: boolean;
}> = [
  {
    value: "future",
    title: "Deze en volgende",
    description:
      "Pas alleen toekomstige datums aan. Verleden afleveringen en handmatige wijzigingen blijven behouden.",
    icon: CalendarClock,
    recommended: true,
  },
  {
    value: "all",
    title: "Hele reeks",
    description:
      "Alle datums opnieuw genereren. Handmatige aanpassingen aan toekomstige datums kunnen verloren gaan.",
    icon: CalendarRange,
  },
  {
    value: "single",
    title: "Alleen deze datum",
    description:
      "Alleen één enkele datum aanpassen via het datums-tabblad.",
    icon: CalendarDays,
  },
];

export function RecurringEditScopeDialog({
  open,
  onOpenChange,
  onConfirm,
  futureCount,
  totalCount,
  allowSingle = false,
  hasManualEdits = false,
}: RecurringEditScopeDialogProps) {
  const [scope, setScope] = useState<RecurringEditScope>("future");

  const visible = OPTIONS.filter(o => allowSingle || o.value !== "single");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Wijzigingen toepassen op</AlertDialogTitle>
          <AlertDialogDescription>
            Dit is een terugkerend evenement
            {typeof totalCount === "number" && ` met ${totalCount} datum${totalCount === 1 ? "" : "s"}`}
            {typeof futureCount === "number" && futureCount > 0 && ` (waarvan ${futureCount} in de toekomst)`}.
            Kies hoe je de wijzigingen wilt toepassen.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(v) => setScope(v as RecurringEditScope)}
          className="space-y-2"
        >
          {visible.map((opt) => {
            const Icon = opt.icon;
            const selected = scope === opt.value;
            return (
              <Label
                key={opt.value}
                htmlFor={`scope-${opt.value}`}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <RadioGroupItem
                  id={`scope-${opt.value}`}
                  value={opt.value}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {opt.title}
                    </span>
                    {opt.recommended && (
                      <span className="text-xs uppercase tracking-wide text-primary font-semibold">
                        Aanbevolen
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </Label>
            );
          })}
        </RadioGroup>

        {hasManualEdits && scope === "all" && (
          <div className="rounded-md bg-highlight/10 border border-highlight/30 px-3 py-2">
            <p className="text-xs text-foreground">
              ⚠️ Er zijn handmatige aanpassingen op losse datums. Bij{" "}
              <strong>hele reeks</strong> kunnen deze worden overschreven.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(scope)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Toepassen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
