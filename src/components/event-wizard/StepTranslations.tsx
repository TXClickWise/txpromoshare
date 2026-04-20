import { motion } from "framer-motion";
import { EventTranslationPanel } from "@/components/i18n/EventTranslationPanel";
import { usePlan } from "@/hooks/usePlan";
import type { EventFormState } from "./useEventForm";

interface StepTranslationsProps {
  eventId: string;
  tenantId: string;
  form: EventFormState;
}

/**
 * Wizard step that hosts the multilingual translation panel.
 * Only shown for already-saved events (translations need an event_id).
 */
export function StepTranslations({ eventId, tenantId, form }: StepTranslationsProps) {
  const { effectivePlanId } = usePlan();
  const aiEnabled = effectivePlanId === "pro";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Vertalingen</h2>
        <p className="text-sm text-muted-foreground">
          Maak meertalige versies van dit evenement. Nederlands blijft de bron — andere talen
          vallen automatisch terug op NL als velden leeg zijn.
        </p>
      </div>

      <EventTranslationPanel
        eventId={eventId}
        tenantId={tenantId}
        aiTranslationEnabled={aiEnabled}
        source={{
          title: form.title,
          subtitle: form.subtitle,
          short_description: form.shortDescription,
          full_description: form.fullDescription,
          cta_button_text: form.ctaButtonText,
          whatsapp_share_text: form.whatsappText,
          social_share_text: form.socialText,
          seo_title: form.seoTitle,
          seo_description: form.seoDescription,
          slug: form.slug,
        }}
      />
    </motion.div>
  );
}
