import { Plug, Zap, ExternalLink, Check, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { UpgradeBanner } from "@/components/UpgradeBanner";

const integrations = [
  {
    id: "clickwise",
    title: t.integrations.clickwise.title,
    description: t.integrations.clickwise.description,
    icon: Zap,
    gradient: "gradient-hero",
    status: "disconnected" as "disconnected" | "connected" | "coming_soon",
    features: [
      "Event info automatisch naar je CRM",
      "Automatisering bij publicatie",
      "Follow-up campagnes voor bezoekers",
      "Promotiecontent synchroniseren",
      "WhatsApp/social distributie in je CRM flow",
    ],
    planRequired: "Pro",
  },
  {
    id: "calendar",
    title: "Kalender integratie",
    description: "Google Calendar & ICS download op publieke eventpagina's",
    icon: () => <span className="text-xl">📅</span>,
    gradient: "",
    status: "coming_soon" as const,
    features: ["Toevoegen aan Google Calendar", "ICS download voor bezoekers", "Outlook sync"],
    planRequired: null,
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.integrations.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Verbind externe tools en automatiseer je workflow</p>
      </div>

      <div className="space-y-4">
        {integrations.map((int, i) => (
          <motion.div
            key={int.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl bg-card border border-border shadow-card overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${int.gradient || "bg-secondary"} flex items-center justify-center shrink-0`}>
                  {typeof int.icon === "function" ? <int.icon /> : <int.icon className="w-6 h-6 text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-foreground">{int.title}</h3>
                    {int.status === "coming_soon" && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t.common.comingSoon}</span>
                    )}
                    {int.planRequired && (
                      <span className="text-[10px] font-medium text-highlight-foreground bg-highlight/10 px-2 py-0.5 rounded-full">{int.planRequired}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{int.description}</p>

                  {/* Status */}
                  <div className="mt-3">
                    {int.status === "disconnected" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                        Niet verbonden
                      </span>
                    )}
                    {int.status === "connected" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                        <Check className="w-3 h-3" />
                        Verbonden
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mt-4 space-y-1.5">
                    {int.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-3 h-3 text-accent/50 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  {int.status !== "coming_soon" && (
                    <div className="mt-4">
                      <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
                        <Plug className="w-4 h-4" />Verbinden
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ticketing */}
      <div className="rounded-xl border border-dashed border-border p-6 opacity-60">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <span className="text-xl">🎟️</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              Ticketing Module
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.common.futureModule}</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Mollie & Stripe betalingen, QR-codes, scannen, mobile wallet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
