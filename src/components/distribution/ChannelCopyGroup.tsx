import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { ShareTextCard } from "./ShareTextCard";

export interface CopyVariant {
  /** Stable id, also used as DB column name when persisting */
  id: string;
  label: string;
  description: string;
  text: string;
  charLimit?: number;
  /** Recommended/featured variant — shown by default */
  recommended?: boolean;
}

interface ChannelCopyGroupProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  variants: CopyVariant[];
  /** Fired when a variant text changes (debounced upstream if desired) */
  onVariantChange: (variantId: string, text: string) => void;
  onAiRewrite?: (text: string, instruction: string) => Promise<string>;
  aiLoading?: boolean;
  /** Saving indicator from upstream debounced save */
  saving?: boolean;
  saved?: boolean;
  /** Optional extra actions to render in the active card footer */
  actions?: React.ReactNode;
}

/**
 * Groups multiple copy variants (e.g. short/medium/long) for a single channel,
 * with a tab-style switcher and a single visible card to keep the UI calm.
 */
export function ChannelCopyGroup({
  icon,
  title,
  subtitle,
  variants,
  onVariantChange,
  onAiRewrite,
  aiLoading,
  saving,
  saved,
  actions,
}: ChannelCopyGroupProps) {
  const initial = variants.find((v) => v.recommended)?.id ?? variants[0]?.id;
  const [activeId, setActiveId] = useState(initial);

  // If variant set changes (e.g. event swap), reset to recommended.
  useEffect(() => {
    setActiveId(initial);
  }, [initial]);

  const active = variants.find((v) => v.id === activeId) ?? variants[0];
  if (!active) return null;

  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="text-sm font-display font-semibold text-foreground truncate">{title}</h2>
          {subtitle && (
            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">— {subtitle}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Save indicator */}
          <AnimatePresence>
            {saving && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground"
              >
                <Loader2 className="w-3 h-3 animate-spin" /> Opslaan…
              </motion.span>
            )}
            {!saving && saved && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-[10px] text-accent"
              >
                <Check className="w-3 h-3" /> Opgeslagen
              </motion.span>
            )}
          </AnimatePresence>

          {/* Variant switcher */}
          {variants.length > 1 && (
            <div className="inline-flex rounded-lg bg-secondary p-0.5 gap-0.5">
              {variants.map((v) => {
                const isActive = v.id === activeId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveId(v.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <ShareTextCard
        icon={icon}
        title={active.label}
        description={active.description}
        text={active.text}
        charLimit={active.charLimit}
        onTextChange={(t) => onVariantChange(active.id, t)}
        onAiRewrite={onAiRewrite}
        aiLoading={aiLoading}
        actions={actions}
      />
    </section>
  );
}
