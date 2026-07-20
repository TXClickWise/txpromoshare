import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  widget: Tables<"widgets">;
}

type CheckStatus = "ok" | "warn" | "fail";

interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  fix?: { to: string; label: string };
}

export function WidgetQualityCheck({ widget }: Props) {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<CheckResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const results: CheckResult[] = [];

      // 1. Active widget?
      results.push({
        id: "active",
        label: "Widget is actief",
        status: widget.is_active ? "ok" : "fail",
        detail: widget.is_active
          ? "De widget toont content op je website."
          : "Inactieve widgets tonen geen content. Activeer hem in de lijst.",
      });

      if (widget.type === "agenda") {
        // 2. Has published events?
        const { data: events } = await supabase
          .from("events")
          .select("id, title, featured_image_id, short_description, start_date")
          .eq("tenant_id", widget.tenant_id)
          .eq("status", "published")
          .gte("start_date", new Date().toISOString().slice(0, 10))
          .order("start_date", { ascending: true })
          .limit(20);

        const list = events || [];
        results.push({
          id: "events",
          label: "Aankomende evenementen",
          status: list.length === 0 ? "fail" : list.length < 3 ? "warn" : "ok",
          detail:
            list.length === 0
              ? "Geen gepubliceerde evenementen — de widget toont een lege staat."
              : list.length < 3
              ? `Slechts ${list.length} evenement${list.length === 1 ? "" : "en"}. Voeg er meer toe voor een vollere agenda.`
              : `${list.length} evenementen klaar om te tonen.`,
          fix: list.length === 0 ? { to: "/events/new", label: "Maak evenement" } : undefined,
        });

        // 3. Image coverage
        const withImage = list.filter((e) => !!e.featured_image_id).length;
        if (list.length > 0) {
          const ratio = withImage / list.length;
          results.push({
            id: "images",
            label: "Afbeeldingen",
            status: ratio >= 0.8 ? "ok" : ratio >= 0.4 ? "warn" : "fail",
            detail:
              ratio === 1
                ? "Alle evenementen hebben een afbeelding."
                : `${withImage} van ${list.length} hebben een afbeelding. Visuele agenda's converteren beter.`,
            fix: ratio < 1 ? { to: "/events", label: "Voeg toe" } : undefined,
          });
        }

        // 4. Description coverage
        const withDesc = list.filter((e) => !!e.short_description?.trim()).length;
        if (list.length > 0) {
          const ratio = withDesc / list.length;
          results.push({
            id: "descriptions",
            label: "Korte beschrijvingen",
            status: ratio >= 0.8 ? "ok" : "warn",
            detail:
              ratio === 1
                ? "Elk evenement heeft een korte beschrijving."
                : `${list.length - withDesc} evenement${list.length - withDesc === 1 ? "" : "en"} mist een korte beschrijving.`,
          });
        }
      } else if (widget.type === "single_event") {
        const eventId = (widget.config as any)?.event_id;
        if (!eventId) {
          results.push({
            id: "event",
            label: "Evenement gekoppeld",
            status: "fail",
            detail: "Geen evenement geselecteerd — kies er één in stap 1.",
          });
        } else {
          const { data: ev } = await supabase
            .from("events")
            .select("id, title, status, featured_image_id, short_description, start_date")
            .eq("id", eventId)
            .maybeSingle();

          if (!ev) {
            results.push({
              id: "event",
              label: "Evenement gekoppeld",
              status: "fail",
              detail: "Het gekoppelde evenement bestaat niet meer.",
            });
          } else {
            results.push({
              id: "published",
              label: "Evenement is gepubliceerd",
              status: ev.status === "published" ? "ok" : "fail",
              detail:
                ev.status === "published"
                  ? `"${ev.title}" is live.`
                  : `"${ev.title}" heeft status ${ev.status} — bezoekers zien geen content.`,
              fix: ev.status !== "published" ? { to: `/events/${ev.id}/edit`, label: "Publiceer" } : undefined,
            });
            results.push({
              id: "image",
              label: "Afbeelding aanwezig",
              status: ev.featured_image_id ? "ok" : "warn",
              detail: ev.featured_image_id
                ? "Hoofdafbeelding is ingesteld."
                : "Geen hoofdafbeelding — widget oogt minder aantrekkelijk.",
              fix: !ev.featured_image_id ? { to: `/events/${ev.id}/edit`, label: "Voeg toe" } : undefined,
            });
            results.push({
              id: "desc",
              label: "Korte beschrijving",
              status: ev.short_description?.trim() ? "ok" : "warn",
              detail: ev.short_description?.trim()
                ? "Beschrijving is ingevuld."
                : "Geen korte beschrijving — bezoekers krijgen weinig context.",
            });
          }
        }
      }

      if (!cancelled) {
        setChecks(results);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [widget.id, widget.is_active, widget.tenant_id, widget.type, JSON.stringify(widget.config)]);

  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const allOk = !loading && failCount === 0 && warnCount === 0;

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Kwaliteitscheck</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {loading
            ? "Controleren..."
            : allOk
            ? "Alles in orde"
            : `${failCount} probl., ${warnCount} tip${warnCount === 1 ? "" : "s"}`}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {loading ? (
          <li className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />Bezig met controleren...
          </li>
        ) : (
          checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5 px-4 py-2.5">
              <StatusIcon status={c.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{c.label}</p>
                  {c.fix && (
                    <Link
                      to={c.fix.to}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      {c.fix.label}
                    </Link>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "ok") return <CheckCircle2 className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />;
  if (status === "warn") return <AlertTriangle className="w-3.5 h-3.5 text-[hsl(38_92%_50%)] mt-0.5 shrink-0" />;
  return <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />;
}
