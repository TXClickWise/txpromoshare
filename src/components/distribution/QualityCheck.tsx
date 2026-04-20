import { useMemo } from "react";
import { CheckCircle2, AlertCircle, XCircle, Shield, Sparkles, Megaphone, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useUILanguage";
import type { Tables } from "@/integrations/supabase/types";

interface QualityCheckProps {
  event: Tables<"events">;
  texts: {
    whatsapp: string;
    whatsapp_short?: string;
    instagram?: string;
    social?: string;
    teaser?: string;
    promo?: string;
    newsletter: string;
    website: string;
  };
}

type Status = "pass" | "warn" | "fail";

interface CheckItem {
  label: string;
  status: Status;
  hint?: string;
}

interface CheckGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: CheckItem[];
}

function hasCta(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const ctaWords = ["meer info", "boek", "reserveer", "kom", "schrijf je in", "tickets", "kijk op", "bekijk", "doe mee", "rsvp", "klik", "link in bio", "more info", "book", "view", "join", "click"];
  return ctaWords.some((w) => lower.includes(w)) || /https?:\/\//.test(text);
}

function emojiCount(text: string): number {
  if (!text) return 0;
  const matches = text.match(/\p{Extended_Pictographic}/gu);
  return matches?.length ?? 0;
}

function lengthStatus(len: number, ideal: [number, number], min: number): Status {
  if (len < min) return "fail";
  if (len >= ideal[0] && len <= ideal[1]) return "pass";
  return "warn";
}

export function QualityCheck({ event, texts }: QualityCheckProps) {
  const { t } = useTranslation();

  const groups = useMemo<CheckGroup[]>(() => {
    const whatsappShort = texts.whatsapp_short || "";
    const whatsapp = texts.whatsapp || "";
    const teaser = texts.teaser || "";
    const social = texts.instagram || texts.social || "";
    const promo = texts.promo || "";
    const newsletter = texts.newsletter || "";
    const website = texts.website || "";

    return [
      {
        id: "completeness",
        title: t("qc.group.completeness"),
        icon: FileText,
        items: [
          { label: t("qc.item.title"), status: event.title ? "pass" : "fail", hint: t("qc.item.titleHint") },
          {
            label: t("qc.item.shortDesc"),
            status: event.short_description && event.short_description.length > 20 ? "pass" : event.short_description ? "warn" : "fail",
            hint: t("qc.item.shortDescHint"),
          },
          { label: t("qc.item.featured"), status: event.featured_image_id ? "pass" : "fail", hint: t("qc.item.featuredHint") },
          { label: t("qc.item.location"), status: event.venue_id ? "pass" : "warn", hint: t("qc.item.locationHint") },
        ],
      },
      {
        id: "channels",
        title: t("qc.group.channels"),
        icon: Megaphone,
        items: [
          { label: t("qc.item.waShort"), status: lengthStatus(whatsappShort.length, [60, 200], 30), hint: t("qc.item.waShortHint") },
          { label: t("qc.item.waMed"), status: lengthStatus(whatsapp.length, [150, 400], 50), hint: t("qc.item.waMedHint") },
          { label: t("qc.item.teaser"), status: lengthStatus(teaser.length, [80, 220], 30), hint: t("qc.item.teaserHint") },
          { label: t("qc.item.igPost"), status: lengthStatus(social.length, [200, 1500], 80), hint: t("qc.item.igPostHint") },
          { label: t("qc.item.longPromo"), status: lengthStatus(promo.length, [400, 2000], 150), hint: t("qc.item.longPromoHint") },
          { label: t("qc.item.newsletter"), status: lengthStatus(newsletter.length, [80, 400], 40), hint: t("qc.item.newsletterHint") },
          { label: t("qc.item.website"), status: lengthStatus(website.length, [100, 500], 40), hint: t("qc.item.websiteHint") },
        ],
      },
      {
        id: "promo",
        title: t("qc.group.promo"),
        icon: Sparkles,
        items: [
          {
            label: t("qc.item.cta"),
            status: [whatsapp, social, newsletter].some((s) => hasCta(s)) ? "pass" : "warn",
            hint: t("qc.item.ctaHint"),
          },
          { label: t("qc.item.ctaLink"), status: event.cta_link ? "pass" : "warn", hint: t("qc.item.ctaLinkHint") },
          {
            label: t("qc.item.emoji"),
            status: (() => {
              const c = emojiCount(whatsapp);
              if (whatsapp.length === 0) return "warn";
              if (c >= 1 && c <= 4) return "pass";
              return "warn";
            })(),
            hint: t("qc.item.emojiHint"),
          },
          { label: t("qc.item.seoTitle"), status: event.seo_title ? "pass" : "warn", hint: t("qc.item.seoTitleHint") },
          { label: t("qc.item.tags"), status: event.tags && event.tags.length > 0 ? "pass" : "warn", hint: t("qc.item.tagsHint") },
        ],
      },
    ];
  }, [event, texts, t]);

  const allItems = groups.flatMap((g) => g.items);
  const passCount = allItems.filter((c) => c.status === "pass").length;
  const warnCount = allItems.filter((c) => c.status === "warn").length;
  const failCount = allItems.filter((c) => c.status === "fail").length;
  const score = Math.round((passCount / allItems.length) * 100);

  const scoreColor = score >= 80 ? "text-accent" : score >= 50 ? "text-[hsl(38_92%_50%)]" : "text-destructive";
  const scoreBar = score >= 80 ? "bg-accent" : score >= 50 ? "bg-[hsl(38_92%_50%)]" : "bg-destructive";
  const scoreLabel = score >= 80 ? t("qc.scoreExcellent") : score >= 50 ? t("qc.scoreOk") : t("qc.scoreWeak");

  const StatusIcon = ({ status }: { status: Status }) => {
    if (status === "pass") return <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />;
    if (status === "warn") return <AlertCircle className="w-3.5 h-3.5 text-[hsl(38_92%_50%)] shrink-0" />;
    return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <h3 className="font-display font-semibold text-foreground text-sm truncate">{t("qc.title")}</h3>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {t("qc.summary", { pass: String(passCount), warn: String(warnCount), fail: String(failCount) })}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-lg font-display font-bold ${scoreColor}`}>{score}%</span>
          <Badge variant={score >= 80 ? "default" : "outline"} className="text-[10px]">
            {scoreLabel}
          </Badge>
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${scoreBar}`} style={{ width: `${score}%` }} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {groups.map((group) => {
          const GIcon = group.icon;
          const groupPass = group.items.filter((i) => i.status === "pass").length;
          return (
            <div key={group.id} className="rounded-lg bg-secondary/40 border border-border/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <GIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{group.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {groupPass}/{group.items.length}
                </span>
              </div>
              <ul className="space-y-1">
                {group.items.map((c) => (
                  <li key={c.label} className="flex items-start gap-1.5">
                    <StatusIcon status={c.status} />
                    <div className="min-w-0 flex-1">
                      <span className={`text-[11px] leading-tight block ${c.status === "pass" ? "text-foreground" : "text-muted-foreground"}`}>
                        {c.label}
                      </span>
                      {c.status !== "pass" && c.hint && (
                        <span className="text-[10px] text-muted-foreground/80 leading-tight block">{c.hint}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
