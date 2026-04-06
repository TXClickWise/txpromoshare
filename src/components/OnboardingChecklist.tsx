import { Check, Circle, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  to: string;
}

const defaultItems: ChecklistItem[] = [
  { id: "profile", label: "Organisatie instellen", description: "Naam, locatie en contactgegevens", done: true, to: "/app/settings" },
  { id: "branding", label: "Logo & huisstijl toevoegen", description: "Upload je logo en kies je kleuren", done: false, to: "/app/settings" },
  { id: "event", label: "Eerste evenement aanmaken", description: "Gebruik een sjabloon of begin blanco", done: false, to: "/app/events/new" },
  { id: "distribution", label: "Evenement delen", description: "Verspreid via WhatsApp, link of embed", done: false, to: "/app/distribution" },
  { id: "widget", label: "Widget op je website plaatsen", description: "Toon je agenda automatisch op je site", done: false, to: "/app/widgets" },
];

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [items] = useState(defaultItems);

  if (dismissed) return null;

  const completed = items.filter((i) => i.done).length;
  const progress = (completed / items.length) * 100;
  const nextItem = items.find((i) => !i.done);

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
            <h3 className="font-display font-bold text-foreground text-sm">Welkom bij TX PromoShare! 🎉</h3>
            <p className="text-xs text-muted-foreground mt-1">Voltooi deze stappen om alles klaar te zetten</p>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
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

        {/* Items */}
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
