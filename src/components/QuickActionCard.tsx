import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  gradient?: string;
}

export function QuickActionCard({ icon: Icon, title, description, to }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/20 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </Link>
  );
}
