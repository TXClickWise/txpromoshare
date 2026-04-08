import { CheckCircle2, AlertCircle, XCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

interface QualityCheckProps {
  event: Tables<"events">;
  texts: {
    whatsapp: string;
    social: string;
    newsletter: string;
    website: string;
  };
}

interface CheckItem {
  label: string;
  status: "pass" | "warn" | "fail";
  tip?: string;
}

export function QualityCheck({ event, texts }: QualityCheckProps) {
  const checks: CheckItem[] = [
    // Completeness
    {
      label: "Titel ingevuld",
      status: event.title ? "pass" : "fail",
      tip: "Voeg een titel toe aan je event",
    },
    {
      label: "Korte beschrijving",
      status: event.short_description && event.short_description.length > 20 ? "pass" : event.short_description ? "warn" : "fail",
      tip: "Een goede korte beschrijving (>20 tekens) helpt bij delen",
    },
    {
      label: "Uitgelichte afbeelding",
      status: event.featured_image_id ? "pass" : "fail",
      tip: "Voeg een afbeelding toe voor een betere social media post",
    },
    {
      label: "Locatie/venue",
      status: event.venue_id ? "pass" : "warn",
      tip: "Een locatie maakt je event completer",
    },
    // Promotion
    {
      label: "WhatsApp tekst",
      status: texts.whatsapp.length > 30 ? "pass" : "warn",
      tip: "Schrijf een aantrekkelijk WhatsApp bericht",
    },
    {
      label: "Social media tekst",
      status: texts.social.length > 30 ? "pass" : "warn",
      tip: "Maak een social media post klaar",
    },
    // SEO
    {
      label: "SEO titel",
      status: event.seo_title ? "pass" : "warn",
      tip: "Een SEO titel verbetert vindbaarheid",
    },
    {
      label: "CTA link",
      status: event.cta_link ? "pass" : "warn",
      tip: "Een CTA link verhoogt conversie",
    },
  ];

  const passCount = checks.filter((c) => c.status === "pass").length;
  const score = Math.round((passCount / checks.length) * 100);

  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-destructive";
  const scoreLabel = score >= 80 ? "Uitstekend" : score >= 50 ? "Redelijk" : "Onvolledig";

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "pass") return <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />;
    if (status === "warn") return <AlertCircle className="w-3.5 h-3.5 text-yellow-600 shrink-0" />;
    return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">Kwaliteitscheck</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-display font-bold ${scoreColor}`}>{score}%</span>
          <Badge variant={score >= 80 ? "default" : "outline"} className="text-[10px]">
            {scoreLabel}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${score >= 80 ? "bg-green-600" : score >= 50 ? "bg-yellow-600" : "bg-destructive"}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="space-y-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-2 py-1">
            <StatusIcon status={check.status} />
            <span className={`text-xs ${check.status === "pass" ? "text-foreground" : "text-muted-foreground"}`}>
              {check.label}
            </span>
            {check.status !== "pass" && check.tip && (
              <span className="text-[10px] text-muted-foreground ml-auto hidden sm:block">
                {check.tip}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
