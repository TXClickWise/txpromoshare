import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AiAssistButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  tooltip?: string;
  size?: "sm" | "default" | "icon";
  variant?: "outline" | "ghost" | "secondary";
  className?: string;
}

export function AiAssistButton({
  onClick,
  loading = false,
  label,
  tooltip = "Genereer met AI",
  size = "sm",
  variant = "ghost",
  className = "",
}: AiAssistButtonProps) {
  const btn = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={loading}
      className={`gap-1.5 text-primary hover:text-primary hover:bg-primary/10 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {label && <span className="text-xs font-medium">{label}</span>}
    </Button>
  );

  if (!label) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return btn;
}
