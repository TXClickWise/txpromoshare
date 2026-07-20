import { Code2, Copy, Check, Trash2, Power, PowerOff, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useUILanguage";
import type { Tables } from "@/integrations/supabase/types";

interface WidgetCardProps {
  widget: Tables<"widgets">;
  isSelected: boolean;
  copied: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export function WidgetCard({ widget, isSelected, copied, onSelect, onCopy, onToggleActive, onDelete }: WidgetCardProps) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl bg-card border shadow-card p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-primary ring-1 ring-primary/20" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{widget.type === "agenda" ? "📅" : "🎯"}</span>
            <h3 className="font-display font-bold text-foreground text-sm truncate">{widget.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {widget.type === "agenda" ? t("widgets.typeAgenda") : t("widgets.typeSingle")}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          widget.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
        }`}>
          {widget.is_active ? t("common.active") : t("common.inactive")}
        </span>
      </div>

      <div className="flex gap-1.5 mt-3" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" onClick={onCopy} className="gap-1.5 flex-1 h-8 text-xs">
          {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t("widgets.copied") : t("widgets.code")}
        </Button>
        <Button variant="outline" size="sm" onClick={onSelect} className="gap-1.5 h-8 text-xs">
          <Settings2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleActive} className="h-8 w-8 p-0" title={widget.is_active ? t("widgets.deactivate") : t("widgets.activate")}>
          {widget.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
