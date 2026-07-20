import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAiAssist } from "@/hooks/useAiAssist";
import { useTenant } from "@/hooks/useTenant";
import type { EventFormState } from "./useEventForm";

interface AiPublishCheckProps {
  form: EventFormState;
}

interface CheckItem {
  category: string;
  item: string;
  status: "pass" | "warn" | "fail";
  tip?: string;
}

interface CheckResult {
  score: number;
  verdict: string;
  checks: CheckItem[];
  summary: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  completeness: "Volledigheid",
  clarity: "Duidelijkheid",
  promotion: "Promotie",
  seo: "SEO",
  brand: "Merkfit",
};

export function AiPublishCheck({ form }: AiPublishCheckProps) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const { run, loading } = useAiAssist();
  const { tenant } = useTenant();
  const isLoading = loading === "pre_publish_check";

  const handleCheck = async () => {
    const res = await run({
      task: "pre_publish_check",
      context: {
        title: form.title,
        subtitle: form.subtitle,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        category: form.category,
        startDate: form.startDate,
        venue: form.venue,
        ctaText: form.ctaButtonText,
        ctaLink: form.ctaLink,
        tags: form.tags,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        hasImage: form.featuredImageId ? "ja" : "nee",
        whatsappText: form.whatsappText,
        socialText: form.socialText,
        brandTone: tenant?.tone_of_voice || "",
      },
    });

    if (res && !res.raw) {
      setResult(res as unknown as CheckResult);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "pass") return <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />;
    if (status === "warn") return <AlertCircle className="w-3.5 h-3.5 text-yellow-600 shrink-0" />;
    return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
  };

  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">AI Publicatiecheck</p>
            <p className="text-xs text-muted-foreground">Laat AI je event controleren op volledigheid, kwaliteit en promotiekracht</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheck}
          disabled={isLoading || !form.title.trim()}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Controleer met AI
        </Button>
      </div>
    );
  }

  const scoreColor = result.score >= 80 ? "text-green-600" : result.score >= 50 ? "text-yellow-600" : "text-destructive";
  const verdictLabels: Record<string, string> = {
    excellent: "Uitstekend",
    good: "Goed",
    needs_work: "Kan beter",
    poor: "Onvolledig",
  };

  // Group checks by category
  const grouped = result.checks.reduce((acc, check) => {
    if (!acc[check.category]) acc[check.category] = [];
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, CheckItem[]>);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">AI Publicatiecheck</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-display font-bold ${scoreColor}`}>{result.score}%</span>
          <Badge variant={result.score >= 80 ? "default" : "outline"} className="text-xs">
            {verdictLabels[result.verdict] || result.verdict}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${result.score >= 80 ? "bg-green-600" : result.score >= 50 ? "bg-yellow-600" : "bg-destructive"}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Summary */}
      {result.summary && (
        <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">{result.summary}</p>
      )}

      {/* Checks by category */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([category, checks]) => (
          <div key={category} className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {CATEGORY_LABELS[category] || category}
            </p>
            {checks.map((check, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <StatusIcon status={check.status} />
                <span className={`text-xs ${check.status === "pass" ? "text-foreground" : "text-muted-foreground"}`}>
                  {check.item}
                </span>
                {check.status !== "pass" && check.tip && (
                  <span className="text-xs text-muted-foreground ml-auto text-right max-w-[50%] hidden sm:block">
                    {check.tip}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={handleCheck} disabled={isLoading} className="gap-2 text-xs">
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Opnieuw controleren
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="text-xs">
          Sluiten
        </Button>
      </div>
    </div>
  );
}
