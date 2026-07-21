import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Step {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface WizardProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
  isStepReachable?: (step: number) => boolean;
  lockedReason?: string;
}

export function WizardProgress({ steps, currentStep, onStepClick, completedSteps, isStepReachable, lockedReason }: WizardProgressProps) {
  return (
    <nav className="flex items-center gap-1 w-full overflow-x-auto pb-1" aria-label="Wizard stappen">
      {steps.map((step, i) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);
        const isClickable = isStepReachable
          ? isStepReachable(step.id)
          : isCompleted || step.id <= Math.max(...completedSteps, 0) + 1;

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              title={!isClickable ? lockedReason : undefined}
              aria-label={!isClickable && lockedReason ? `${step.label} — ${lockedReason}` : step.label}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all w-full min-w-0 min-h-[44px]",
                isActive && "bg-primary/10 border border-primary/30",
                !isActive && isCompleted && "bg-success/5 border border-success/20 hover:bg-success/10",
                !isActive && !isCompleted && isClickable && "hover:bg-secondary border border-transparent",
                !isActive && !isCompleted && !isClickable && "opacity-40 cursor-not-allowed border border-transparent",
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && !isActive && "bg-success text-success-foreground",
                !isActive && !isCompleted && "bg-secondary text-muted-foreground",
              )}>
                {isCompleted && !isActive ? <Check className="w-3.5 h-3.5" /> : step.id}
              </div>
              <div className="min-w-0 text-left hidden sm:block">
                <p className={cn(
                  "text-xs font-medium truncate",
                  isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground",
                )}>
                  {step.label}
                </p>
              </div>
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                "w-6 h-px shrink-0 mx-0.5",
                isCompleted ? "bg-success/40" : "bg-border",
              )} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
