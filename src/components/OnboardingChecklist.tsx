import { Check, Circle, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useTranslation } from "@/hooks/useUILanguage";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  to: string;
}

export function OnboardingChecklist() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("onboarding_dismissed") === "true";
  });
  const { tenant, tenantId } = useTenant();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || dismissed) return;
    async function check() {
      // Check branding: logo or primary_color changed from default
      const hasBranding = !!(tenant?.logo_url || (tenant?.primary_color && tenant.primary_color !== "#E86C2C"));

      // Check if at least one event exists
      const { count: eventCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!);

      // Check if at least one distribution action exists
      const { count: distCount } = await supabase
        .from("distribution_actions")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!);

      // Check if at least one widget exists
      const { count: widgetCount } = await supabase
        .from("widgets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!);

      setItems([
        { id: "profile", label: t("onboarding.item.profile"), description: t("onboarding.item.profile.desc"), done: true, to: "/app/settings/bedrijfsgegevens" },
        { id: "branding", label: t("onboarding.item.branding"), description: t("onboarding.item.branding.desc"), done: hasBranding, to: "/app/settings/huisstijl" },
        { id: "event", label: t("onboarding.item.event"), description: t("onboarding.item.event.desc"), done: (eventCount || 0) > 0, to: "/app/events/new" },
        { id: "distribution", label: t("onboarding.item.distribution"), description: t("onboarding.item.distribution.desc"), done: (distCount || 0) > 0, to: "/app/distribution" },
        { id: "widget", label: t("onboarding.item.widget"), description: t("onboarding.item.widget.desc"), done: (widgetCount || 0) > 0, to: "/app/settings/widgets" },
      ]);
      setLoading(false);
    }
    check();
  }, [tenantId, tenant, dismissed, t]);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("onboarding_dismissed", "true");
  }

  if (dismissed || loading) return null;

  const completed = items.filter((i) => i.done).length;
  if (completed === items.length) return null; // All done — hide
  const progress = (completed / items.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-card"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-foreground text-sm">{t("onboarding.welcome")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("onboarding.subtitle")}</p>
          </div>
          <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full gradient-hero"
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{completed}/{items.length}</span>
        </div>

        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group",
                item.done ? "opacity-60" : "hover:bg-secondary"
              )}
            >
              {item.done ? (
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-accent-foreground" />
                </div>
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
              {!item.done && (
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
