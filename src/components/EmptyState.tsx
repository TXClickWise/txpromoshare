import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction, secondaryLabel, secondaryTo }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display font-bold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      <div className="flex items-center gap-3">
        {actionLabel && actionTo && (
          <Link to={actionTo}>
            <Button className="gradient-hero text-primary-foreground border-0 hover:opacity-90 gap-2">
              {actionLabel}
            </Button>
          </Link>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gradient-hero text-primary-foreground border-0 hover:opacity-90 gap-2">
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && secondaryTo && (
          <Link to={secondaryTo}>
            <Button variant="outline">{secondaryLabel}</Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
