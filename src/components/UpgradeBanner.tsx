import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface UpgradeBannerProps {
  feature: string;
  plan?: string;
  compact?: boolean;
}

export function UpgradeBanner({ feature, plan = "Pro", compact = false }: UpgradeBannerProps) {
  if (compact) {
    return (
      <Link to="/app/billing" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs hover:bg-primary/10 transition-colors">
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground"><span className="font-medium text-foreground">{feature}</span> · Upgrade naar {plan}</span>
        <ArrowRight className="w-3 h-3 text-primary ml-auto" />
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold text-foreground text-sm">{feature}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Beschikbaar in het {plan} plan</p>
        </div>
        <Link to="/app/billing" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-hero text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0">
          Upgraden <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}
