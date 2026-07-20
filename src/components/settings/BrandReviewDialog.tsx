import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, ArrowRight, Sparkles, Info } from "lucide-react";

export type ScrapedBranding = {
  companyName?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  confidence: Record<string, "high" | "medium" | "low">;
};

export type CurrentBrand = {
  tagline?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
};

export type BrandReviewSelection = {
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  syncLogoToClickWise: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
  scraped: ScrapedBranding | null;
  current: CurrentBrand;
  hasClickWise: boolean;
  onApply: (selection: BrandReviewSelection) => void;
}

type FieldKey = "tagline" | "logoUrl" | "primaryColor" | "secondaryColor" | "fontFamily";

const FIELD_LABELS: Record<FieldKey, string> = {
  tagline: "Tagline",
  logoUrl: "Logo",
  primaryColor: "Primaire kleur",
  secondaryColor: "Secundaire kleur",
  fontFamily: "Lettertype",
};

function ConfidencePill({ level }: { level?: "high" | "medium" | "low" }) {
  if (!level) return null;
  const styles: Record<string, string> = {
    high: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    low: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  };
  const labels = { high: "Zeker", medium: "Waarschijnlijk", low: "Onzeker" };
  return <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${styles[level]}`}>{labels[level]}</span>;
}

function ColorSwatch({ value }: { value?: string }) {
  if (!value) return <span className="text-xs text-muted-foreground italic">leeg</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded border border-border shrink-0" style={{ backgroundColor: value }} />
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}

function LogoThumb({ url }: { url?: string | null }) {
  if (!url) return <span className="text-xs text-muted-foreground italic">geen logo</span>;
  return (
    <div className="h-8 w-16 rounded border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
      <img src={url} alt="" className="h-full w-auto object-contain" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
    </div>
  );
}

function ValueDisplay({ field, value }: { field: FieldKey; value?: string | null }) {
  if (field === "primaryColor" || field === "secondaryColor") return <ColorSwatch value={value || undefined} />;
  if (field === "logoUrl") return <LogoThumb url={value} />;
  if (!value) return <span className="text-xs text-muted-foreground italic">leeg</span>;
  return <span className="text-xs font-medium truncate max-w-[180px]">{value}</span>;
}

export default function BrandReviewDialog({ open, onClose, scraped, current, hasClickWise, onApply }: Props) {
  const proposals = useMemo(() => {
    if (!scraped) return {} as Record<FieldKey, string | undefined>;
    return {
      tagline: scraped.tagline,
      logoUrl: scraped.logo,
      primaryColor: scraped.primaryColor,
      secondaryColor: scraped.secondaryColor,
      fontFamily: scraped.fontFamily,
    };
  }, [scraped]);

  const currentValues = useMemo<Record<FieldKey, string | null | undefined>>(
    () => ({
      tagline: current.tagline,
      logoUrl: current.logoUrl,
      primaryColor: current.primaryColor,
      secondaryColor: current.secondaryColor,
      fontFamily: current.fontFamily,
    }),
    [current],
  );

  const availableFields = useMemo(
    () => (Object.keys(proposals) as FieldKey[]).filter((k) => proposals[k] && proposals[k] !== currentValues[k]),
    [proposals, currentValues],
  );

  const [selected, setSelected] = useState<Record<FieldKey, boolean>>({
    tagline: false,
    logoUrl: false,
    primaryColor: false,
    secondaryColor: false,
    fontFamily: false,
  });
  const [syncLogoCW, setSyncLogoCW] = useState(false);

  // Pre-select high-confidence fields on open
  useEffect(() => {
    if (open && scraped) {
      const next: Record<FieldKey, boolean> = {
        tagline: false, logoUrl: false, primaryColor: false, secondaryColor: false, fontFamily: false,
      };
      availableFields.forEach((f) => {
        next[f] = scraped.confidence[f] === "high";
      });
      setSelected(next);
      setSyncLogoCW(false); // ClickWise sync is opt-in, default uit
    }
  }, [open, scraped, availableFields]);

  function toggleAll(value: boolean) {
    const next: Record<FieldKey, boolean> = { ...selected };
    availableFields.forEach((f) => (next[f] = value));
    setSelected(next);
  }

  function handleApply() {
    const out: BrandReviewSelection = { syncLogoToClickWise: syncLogoCW && selected.logoUrl };
    availableFields.forEach((f) => {
      if (selected[f]) (out as any)[f] = proposals[f];
    });
    onApply(out);
  }

  const selectedCount = availableFields.filter((f) => selected[f]).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Branding voorstel</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Vink aan welke onderdelen je wilt overnemen. Niets wordt opgeslagen zonder jouw goedkeuring.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-3">
            {availableFields.length === 0 ? (
              <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/40 border border-border">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Geen nieuwe waardes gevonden — je huidige branding komt overeen met wat we op de website vonden.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{selectedCount} van {availableFields.length} geselecteerd</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleAll(true)}>Alles aan</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleAll(false)}>Alles uit</Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-3 px-3 py-2 bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span></span>
                    <span>Huidig</span>
                    <span></span>
                    <span>Voorstel</span>
                    <span>Zekerheid</span>
                  </div>
                  {availableFields.map((field) => (
                    <label
                      key={field}
                      className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-3 px-3 py-3 border-t border-border cursor-pointer hover:bg-muted/20 transition-colors"
                    >
                      <Checkbox
                        checked={selected[field]}
                        onCheckedChange={(v) => setSelected((s) => ({ ...s, [field]: !!v }))}
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">{FIELD_LABELS[field]}</p>
                        <ValueDisplay field={field} value={currentValues[field]} />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Nieuw</p>
                        <ValueDisplay field={field} value={proposals[field]} />
                      </div>
                      <ConfidencePill level={scraped?.confidence[field]} />
                    </label>
                  ))}
                </div>

                {selected.logoUrl && hasClickWise && (
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                    <Checkbox
                      checked={syncLogoCW}
                      onCheckedChange={(v) => setSyncLogoCW(!!v)}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">Logo ook syncen naar ClickWise subaccount</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Standaard uit — geïmporteerde logo's kunnen banners of favicons zijn. Vink aan als je zeker weet dat dit het juiste logo is.
                      </p>
                    </div>
                  </label>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="ghost" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleApply} disabled={selectedCount === 0} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Toepassen ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
