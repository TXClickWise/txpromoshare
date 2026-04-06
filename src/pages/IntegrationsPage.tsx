import { Plug, Zap, ExternalLink } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.integrations.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Verbind externe tools en automatiseer je workflow</p>
      </div>

      {/* ClickWise / HighLevel */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground">{t.integrations.clickwise.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.integrations.clickwise.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                {t.integrations.clickwise.disconnected}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
                <Plug className="w-4 h-4" />Verbinden
              </Button>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
              <p><strong>Mogelijkheden:</strong></p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Event info naar je CRM sturen</li>
                <li>Automatisering bij publicatie</li>
                <li>Follow-up campagnes voor bezoekers</li>
                <li>Promotiecontent synchroniseren</li>
                <li>WhatsApp/social distributie in je CRM flow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Google Calendar */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <span className="text-xl">📅</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground">Kalender integratie</h3>
            <p className="text-sm text-muted-foreground mt-1">Google Calendar & ICS download op publieke eventpagina's</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mt-2 bg-primary/10 px-2 py-1 rounded-full">
              {t.common.comingSoon}
            </span>
          </div>
        </div>
      </div>

      {/* Ticketing */}
      <div className="p-6 rounded-xl border border-dashed border-border opacity-60">
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
