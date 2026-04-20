import { useState, useRef, useEffect } from "react";
import { Upload, X, Building2, Save, Wand2, Loader2, CheckCircle2, AlertCircle, Palette, Type, MousePointer, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { useTenant } from "@/hooks/useTenant";
import { useTranslation } from "@/hooks/useUILanguage";
import BrandReviewDialog, { type ScrapedBranding as ScrapedBrandingType } from "./BrandReviewDialog";
import BrandPreviewGrid from "./BrandPreviewGrid";
import LogoUploader from "./LogoUploader";

const FONT_OPTIONS: Array<{ value: string; label: string; labelKey?: string }> = [
  { value: "system", label: "System", labelKey: "branding.font.system" },
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "roboto", label: "Roboto" },
  { value: "open-sans", label: "Open Sans" },
  { value: "lato", label: "Lato" },
  { value: "montserrat", label: "Montserrat" },
  { value: "playfair", label: "Playfair Display" },
  { value: "dm-sans", label: "DM Sans" },
];

const BUTTON_STYLES: Array<{ value: string; label: string; labelKey: string }> = [
  { value: "rounded", label: "Rounded", labelKey: "branding.btn.rounded" },
  { value: "pill", label: "Pill", labelKey: "branding.btn.pill" },
  { value: "square", label: "Square", labelKey: "branding.btn.square" },
];

interface BrandingState {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  buttonStyle: string;
  defaultCtaText: string;
  toneOfVoice: string;
  imageStyle: string;
  brandSummary: string;
  tagline: string;
}

interface ScrapedBranding {
  companyName?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: string[];
  toneOfVoice?: string;
  confidence: Record<string, "high" | "medium" | "low">;
}

function Section({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="pl-[42px] space-y-4">{children}</div>
    </div>
  );
}

export default function BrandingTab() {
  const { tenant, tenantId, refetch } = useTenant();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<BrandingState>({
    logoUrl: null,
    primaryColor: "#E86C2C",
    secondaryColor: "#2A9D8F",
    fontFamily: "system",
    buttonStyle: "rounded",
    defaultCtaText: "Meer info",
    toneOfVoice: "",
    imageStyle: "",
    brandSummary: "",
    tagline: "",
  });
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [previewTab, setPreviewTab] = useState("card");
  const [activeTab, setActiveTab] = useState("identity");

  // Firecrawl state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState<ScrapedBranding | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [hasClickWise, setHasClickWise] = useState(false);

  // Detect ClickWise connection (read-only check, doesn't trigger sync)
  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from("integration_connections")
      .select("status")
      .eq("tenant_id", tenantId)
      .eq("provider", "clickwise")
      .eq("status", "connected")
      .maybeSingle()
      .then(({ data }) => setHasClickWise(!!data));
  }, [tenantId]);

  useEffect(() => {
    if (tenant) {
      setState({
        logoUrl: tenant.logo_url || null,
        primaryColor: tenant.primary_color || "#E86C2C",
        secondaryColor: tenant.secondary_color || "#2A9D8F",
        fontFamily: (tenant as any).font_family || "system",
        buttonStyle: (tenant as any).button_style || "rounded",
        defaultCtaText: (tenant as any).default_cta_text || "Meer info",
        toneOfVoice: (tenant as any).tone_of_voice || "",
        imageStyle: (tenant as any).image_style || "",
        brandSummary: (tenant as any).brand_summary || "",
        tagline: (tenant as any).tagline || "",
      });
      setScrapeUrl(tenant.website_url || "");
    }
  }, [tenant]);

  const update = (key: keyof BrandingState, value: string | null) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  async function handleLogoUpload(files: FileList | null) {
    if (!files || !tenantId || files.length === 0) return;
    setLogoUploading(true);
    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${tenantId}/logo_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("media").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      toast.error("Logo upload mislukt: " + uploadError.message);
      setLogoUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    const { error } = await supabase.from("tenants").update({ logo_url: newUrl }).eq("id", tenantId);
    setLogoUploading(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
    } else {
      update("logoUrl", newUrl);
      toast.success("Logo geüpload");
      refetch();
    }
  }

  async function removeLogo() {
    if (!tenant) return;
    await supabase.from("tenants").update({ logo_url: null }).eq("id", tenant.id);
    update("logoUrl", null);
    refetch();
    toast.success("Logo verwijderd");
  }

  async function saveBranding() {
    if (!tenant) return;
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        primary_color: state.primaryColor,
        secondary_color: state.secondaryColor,
        font_family: state.fontFamily,
        button_style: state.buttonStyle,
        default_cta_text: state.defaultCtaText,
        tone_of_voice: state.toneOfVoice || null,
        image_style: state.imageStyle || null,
        brand_summary: state.brandSummary || null,
        tagline: state.tagline || null,
      } as any)
      .eq("id", tenant.id);
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
    } else {
      toast.success("Branding opgeslagen");
      logAudit({ tenantId: tenant.id, entityType: "tenant", action: "branding_updated", entityId: tenant.id });
      refetch();
    }
  }

  async function handleScrape() {
    if (!scrapeUrl.trim()) {
      toast.error("Vul een website URL in");
      return;
    }
    setScraping(true);
    setScrapeError(null);
    setScraped(null);

    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: scrapeUrl, options: { formats: ["branding", "markdown"] } },
      });

      if (error) throw new Error(error.message);
      if (!data?.success && data?.error) throw new Error(data.error);

      const branding = data?.data?.branding || data?.branding;
      const metadata = data?.data?.metadata || data?.metadata;

      if (!branding && !metadata) {
        throw new Error("Geen branding data gevonden op deze website");
      }

      const result: ScrapedBranding = { confidence: {} };

      if (branding) {
        if (branding.logo) {
          result.logo = branding.logo;
          result.confidence.logo = "high";
        }
        if (branding.colors?.primary) {
          result.primaryColor = branding.colors.primary;
          result.confidence.primaryColor = "high";
        }
        if (branding.colors?.secondary) {
          result.secondaryColor = branding.colors.secondary;
          result.confidence.secondaryColor = "high";
        }
        if (branding.colors?.accent) {
          result.secondaryColor = result.secondaryColor || branding.colors.accent;
          result.confidence.secondaryColor = result.confidence.secondaryColor || "medium";
        }
        if (branding.fonts?.length) {
          const fontName = branding.fonts[0]?.family?.toLowerCase() || "";
          const match = FONT_OPTIONS.find((f) => fontName.includes(f.value) || f.label.toLowerCase().includes(fontName));
          if (match) {
            result.fontFamily = match.value;
            result.confidence.fontFamily = "high";
          } else {
            result.fontFamily = fontName;
            result.confidence.fontFamily = "medium";
          }
        }
        if (branding.images?.favicon) {
          result.favicon = branding.images.favicon;
        }
      }

      if (metadata) {
        if (metadata.title) {
          result.companyName = metadata.title.split("|")[0].split("-")[0].trim();
          result.confidence.companyName = "medium";
        }
        if (metadata.description) {
          result.tagline = metadata.description.substring(0, 120);
          result.confidence.tagline = "medium";
        }
      }

      setScraped(result);
      setReviewOpen(true);
    } catch (err: any) {
      console.error("Scrape error:", err);
      setScrapeError(err.message || "Er ging iets mis bij het analyseren");
      toast.error("Analyse mislukt");
    } finally {
      setScraping(false);
    }
  }

  async function handleReviewApply(selection: import("./BrandReviewDialog").BrandReviewSelection) {
    if (!tenant) return;

    // Build update payload from selected fields only
    const updates: Record<string, any> = {};
    if (selection.tagline !== undefined) updates.tagline = selection.tagline;
    if (selection.primaryColor !== undefined) updates.primary_color = selection.primaryColor;
    if (selection.secondaryColor !== undefined) updates.secondary_color = selection.secondaryColor;
    if (selection.fontFamily !== undefined) {
      const matched = FONT_OPTIONS.find((f) => f.value === selection.fontFamily);
      updates.font_family = matched ? matched.value : "system";
    }

    // Logo: re-upload to our own storage to avoid hotlinking external URLs
    if (selection.logoUrl) {
      try {
        const resp = await fetch(selection.logoUrl);
        if (resp.ok) {
          const blob = await resp.blob();
          const ext = (blob.type.split("/")[1] || "png").replace("svg+xml", "svg");
          const path = `${tenant.id}/logo_imported_${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("media").upload(path, blob, { upsert: true, contentType: blob.type });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
            updates.logo_url = `${urlData.publicUrl}?t=${Date.now()}`;
          }
        }
      } catch (e) {
        console.warn("Logo import failed, falling back to direct URL", e);
        updates.logo_url = selection.logoUrl;
      }
    }

    if (Object.keys(updates).length === 0) {
      setReviewOpen(false);
      return;
    }

    const { error } = await supabase.from("tenants").update(updates as any).eq("id", tenant.id);
    if (error) {
      toast.error("Toepassen mislukt: " + error.message);
      return;
    }

    // Update local state
    if (updates.tagline !== undefined) update("tagline", updates.tagline);
    if (updates.primary_color) update("primaryColor", updates.primary_color);
    if (updates.secondary_color) update("secondaryColor", updates.secondary_color);
    if (updates.font_family) update("fontFamily", updates.font_family);
    if (updates.logo_url) update("logoUrl", updates.logo_url);

    logAudit({ tenantId: tenant.id, entityType: "tenant", action: "branding_imported", entityId: tenant.id, metadata: { fields: Object.keys(updates) } });

    // Optional ClickWise logo sync — only if user explicitly opted in
    if (selection.syncLogoToClickWise && updates.logo_url && hasClickWise) {
      try {
        await supabase.functions.invoke("clickwise-tenant-sync", { body: { tenantId: tenant.id } });
        toast.success("Branding toegepast en gesynced naar ClickWise");
      } catch (e) {
        console.warn("ClickWise sync failed", e);
        toast.success("Branding toegepast (ClickWise sync mislukt)");
      }
    } else {
      toast.success("Branding toegepast");
    }

    setReviewOpen(false);
    setScraped(null);
    refetch();
  }

  const btnRadius = state.buttonStyle === "pill" ? "9999px" : state.buttonStyle === "square" ? "4px" : "8px";

  function ConfidenceBadge({ level }: { level?: "high" | "medium" | "low" }) {
    if (!level) return null;
    const colors = { high: "text-green-600 bg-green-50", medium: "text-amber-600 bg-amber-50", low: "text-red-600 bg-red-50" };
    const labels = { high: "Zeker", medium: "Waarschijnlijk", low: "Onzeker" };
    return <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[level]}`}>{labels[level]}</span>;
  }

  return (
    <div className="space-y-5">
      {/* Auto import — full width bovenaan */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 shadow-card p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Wand2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Snelstart: importeer van je website</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vul je website URL in — wij halen logo, kleuren en lettertype op.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder="https://jouwwebsite.nl"
            className="flex-1"
          />
          <Button onClick={handleScrape} disabled={scraping} size="default" className="gap-2 shrink-0">
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {scraping ? "Analyseren..." : "Analyseer website"}
          </Button>
        </div>

        {scrapeError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{scrapeError}</p>
          </div>
        )}

        {scraped && !reviewOpen && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground">Voorstel klaar — open om te bekijken</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)} className="text-xs">
              Bekijk voorstel
            </Button>
          </div>
        )}
      </motion.div>

      {/* Mobile-only: compacte live preview-strip bovenaan */}
      <div className="lg:hidden rounded-xl bg-card border border-border shadow-card p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground">Live preview</p>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Realtime</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
          {/* Mini card preview */}
          <div className="snap-start shrink-0 w-[180px] rounded-lg bg-secondary/30 border border-border p-2">
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
              <div className="h-16 bg-gradient-to-br from-gray-200 to-gray-300" />
              <div className="p-2 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-900 truncate">Live muziek avond</p>
                <button className="w-full text-[9px] font-semibold text-white py-1.5" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                  {state.defaultCtaText}
                </button>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground text-center mt-1">Card</p>
          </div>
          {/* Mini widget preview */}
          <div className="snap-start shrink-0 w-[180px] rounded-lg bg-secondary/30 border border-border p-2">
            <div className="bg-white rounded-md border border-gray-200 p-2" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                {state.logoUrl ? (
                  <img src={state.logoUrl} alt="" className="h-3 w-auto object-contain" />
                ) : (
                  <div className="w-1 h-3 rounded-sm" style={{ backgroundColor: state.primaryColor }} />
                )}
                <p className="text-[9px] font-bold text-gray-900 truncate">{tenant?.name || "Agenda"}</p>
              </div>
              <div className="rounded border border-gray-200 p-1.5">
                <p className="text-[9px] font-semibold text-gray-900 truncate">Live muziek</p>
                <div className="mt-0.5 inline-block text-[8px] text-white px-1.5 py-0.5" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                  {state.defaultCtaText}
                </div>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground text-center mt-1">Widget</p>
          </div>
          {/* Mini knop preview */}
          <div className="snap-start shrink-0 w-[180px] rounded-lg bg-secondary/30 border border-border p-2 flex flex-col justify-center">
            <button className="w-full text-[10px] font-semibold text-white py-2.5" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
              {state.defaultCtaText}
            </button>
            <button className="w-full text-[10px] font-semibold py-2.5 mt-1.5 border" style={{ color: state.secondaryColor, borderColor: state.secondaryColor, borderRadius: btnRadius }}>
              Secundair
            </button>
            <p className="text-[9px] text-muted-foreground text-center mt-1">Knoppen</p>
          </div>
        </div>
      </div>

      {/* 2-koloms layout: links form, rechts sticky preview (vanaf lg) */}
      <div className="grid lg:grid-cols-[1fr_minmax(320px,400px)] gap-5 items-start">
        {/* LINKS — Form in tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card border border-border shadow-card overflow-hidden"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border bg-muted/30 px-2 pt-2 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-1 w-full justify-start flex-nowrap sm:flex-wrap">
                <TabsTrigger value="identity" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm shrink-0">
                  <Building2 className="w-3.5 h-3.5" /><span className="hidden xs:inline">Identiteit</span><span className="xs:hidden">Identi.</span>
                </TabsTrigger>
                <TabsTrigger value="style" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm shrink-0">
                  <Palette className="w-3.5 h-3.5" /><span className="hidden xs:inline">Kleuren & stijl</span><span className="xs:hidden">Stijl</span>
                </TabsTrigger>
                <TabsTrigger value="dna" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />Merk-DNA
                </TabsTrigger>
                <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" />Overzicht
                </TabsTrigger>
              </TabsList>
            </div>

            {/* IDENTITEIT */}
            <TabsContent value="identity" className="p-4 sm:p-5 space-y-6 mt-0">
              <Section icon={ImageIcon} title="Logo" description="Wordt getoond op eventpagina's, widgets en e-mails.">
                <LogoUploader
                  logoUrl={state.logoUrl}
                  primaryColor={state.primaryColor}
                  uploading={logoUploading}
                  onUpload={(file) => {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    return handleLogoUpload(dt.files);
                  }}
                  onRemove={removeLogo}
                />
              </Section>

              <Section icon={Type} title="Tagline" description="Korte slogan onder je naam op de eventpagina.">
                <Input
                  value={state.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="Bijv. De beste events op Texel"
                />
              </Section>
            </TabsContent>

            {/* KLEUREN & STIJL */}
            <TabsContent value="style" className="p-4 sm:p-5 space-y-6 mt-0">
              <Section icon={Palette} title="Kleuren" description="Worden gebruikt op eventpagina's, widgets en deelkaarten.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primaire kleur</Label>
                    <div className="flex gap-2 items-center">
                      <Input type="color" value={state.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={state.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="flex-1 font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secundaire kleur</Label>
                    <div className="flex gap-2 items-center">
                      <Input type="color" value={state.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={state.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} className="flex-1 font-mono text-sm" />
                    </div>
                  </div>
                </div>
              </Section>

              <Section icon={Type} title="Typografie" description="Lettertype voor je events en widgets.">
                <Select value={state.fontFamily} onValueChange={(v) => update("fontFamily", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Section>

              <Section icon={MousePointer} title="Knoppen & CTA" description="Stijl en standaardtekst voor actieknoppen.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Knopstijl</Label>
                    <Select value={state.buttonStyle} onValueChange={(v) => update("buttonStyle", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUTTON_STYLES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Standaard CTA-tekst</Label>
                    <Input value={state.defaultCtaText} onChange={(e) => update("defaultCtaText", e.target.value)} placeholder="Bijv. Reserveer nu" />
                  </div>
                </div>
              </Section>
            </TabsContent>

            {/* MERK-DNA */}
            <TabsContent value="dna" className="p-4 sm:p-5 space-y-6 mt-0">
              <Section icon={Sparkles} title="Tone of voice & beeldstijl" description="AI-functies gebruiken dit om in jouw stijl te schrijven.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tone of voice</Label>
                    <Select value={state.toneOfVoice || "none"} onValueChange={(v) => update("toneOfVoice", v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Kies een stijl" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Geen voorkeur</SelectItem>
                        <SelectItem value="casual">Casual & vriendelijk</SelectItem>
                        <SelectItem value="professional">Professioneel</SelectItem>
                        <SelectItem value="energetic">Energiek & enthousiast</SelectItem>
                        <SelectItem value="elegant">Elegant & stijlvol</SelectItem>
                        <SelectItem value="playful">Speels & creatief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Beeldstijl</Label>
                    <Select value={state.imageStyle || "none"} onValueChange={(v) => update("imageStyle", v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Kies een stijl" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Geen voorkeur</SelectItem>
                        <SelectItem value="vibrant">Levendig & kleurrijk</SelectItem>
                        <SelectItem value="minimal">Minimalistisch</SelectItem>
                        <SelectItem value="warm">Warm & gezellig</SelectItem>
                        <SelectItem value="dark">Donker & stijlvol</SelectItem>
                        <SelectItem value="natural">Natuurlijk & authentiek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Section>

              <Section icon={Sparkles} title="Merk samenvatting" description="Wat moet AI weten over jouw merk?">
                <Textarea
                  value={state.brandSummary}
                  onChange={(e) => update("brandSummary", e.target.value)}
                  placeholder="Beschrijf kort je merk: wie je bent, wat je uitstraalt, en wat je doelgroep verwacht..."
                  rows={4}
                  className="text-sm resize-none"
                />
              </Section>
            </TabsContent>
            {/* OVERZICHT — alle previews tegelijk */}
            <TabsContent value="overview" className="p-4 sm:p-5 mt-0">
              <BrandPreviewGrid
                state={{
                  logoUrl: state.logoUrl,
                  primaryColor: state.primaryColor,
                  secondaryColor: state.secondaryColor,
                  fontFamily: state.fontFamily,
                  buttonStyle: state.buttonStyle,
                  defaultCtaText: state.defaultCtaText,
                  tagline: state.tagline,
                  organizationName: tenant?.name,
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Save bar — sticky bottom op mobile */}
          <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur-sm px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">Wijzigingen worden direct in de preview getoond.</p>
            <Button size="sm" onClick={saveBranding} disabled={saving} className="gap-2 ml-auto w-full sm:w-auto">
              <Save className="w-4 h-4" />{saving ? "Opslaan..." : "Branding opslaan"}
            </Button>
          </div>
        </motion.div>

        {/* RECHTS — Sticky preview (alleen vanaf lg) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:block lg:sticky lg:top-4 rounded-xl bg-card border border-border shadow-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Live preview</p>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Realtime</span>
          </div>

          <Tabs value={previewTab} onValueChange={setPreviewTab}>
            <TabsList className="grid grid-cols-4 h-auto bg-muted/50 p-0.5">
              <TabsTrigger value="card" className="text-[10px] py-1.5 px-1">Card</TabsTrigger>
              <TabsTrigger value="widget" className="text-[10px] py-1.5 px-1">Widget</TabsTrigger>
              <TabsTrigger value="single" className="text-[10px] py-1.5 px-1">Single</TabsTrigger>
              <TabsTrigger value="page" className="text-[10px] py-1.5 px-1">Pagina</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="mt-3">
              <div className="rounded-xl bg-secondary/30 border border-border p-3">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
                  <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Afbeelding</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-center rounded-md px-2 py-1" style={{ backgroundColor: state.primaryColor + "15" }}>
                        <p className="text-[10px] font-bold" style={{ color: state.primaryColor }}>25 apr</p>
                        <p className="text-[9px] text-gray-500">20:00</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Live muziek avond</p>
                        <p className="text-xs text-gray-500">Café de Haven</p>
                      </div>
                    </div>
                    <button className="w-full text-center text-xs font-semibold text-white py-2" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                      {state.defaultCtaText}
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="widget" className="mt-3">
              <div className="rounded-xl bg-secondary/30 border border-border p-3">
                <div className="bg-white rounded-lg border border-gray-200 p-3" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
                  <div className="flex items-center gap-2 mb-3">
                    {state.logoUrl ? (
                      <img src={state.logoUrl} alt="" className="h-5 w-auto object-contain" />
                    ) : (
                      <div className="w-1 h-5 rounded-sm" style={{ backgroundColor: state.primaryColor }} />
                    )}
                    <p className="text-xs font-bold text-gray-900 truncate">Agenda · {tenant?.name || "Organisatie"}</p>
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg border border-gray-200 p-2 flex gap-2 items-start mb-2">
                      <div className="text-center rounded-md px-1.5 py-1" style={{ backgroundColor: state.primaryColor + "15" }}>
                        <p className="text-[9px] font-semibold" style={{ color: state.primaryColor }}>{i === 1 ? "vr 25" : "za 26"}</p>
                        <p className="text-[9px] text-gray-500">{i === 1 ? "20:00" : "14:00"}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-900 truncate">{i === 1 ? "Live muziek" : "Wijnproeverij"}</p>
                        <div className="mt-1 inline-block text-[9px] font-medium text-white px-2 py-0.5" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                          {state.defaultCtaText}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="single" className="mt-3">
              <div className="rounded-xl bg-secondary/30 border border-border p-3">
                <div className="bg-white rounded-lg border border-gray-200 p-3" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
                  <div className="h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Afbeelding</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">Live muziek avond</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Vrijdag 25 april · 20:00</p>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 text-center text-xs font-semibold text-white py-1.5" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                      {state.defaultCtaText}
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="page" className="mt-3">
              <div className="rounded-xl bg-secondary/30 border border-border p-3">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
                  <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
                    <span className="text-gray-400 text-xs">Hero</span>
                    {state.logoUrl && (
                      <div className="absolute bottom-2 left-2">
                        <img src={state.logoUrl} alt="" className="h-5 w-auto object-contain bg-white/80 rounded px-1 py-0.5" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-bold text-gray-900">Live muziek avond</p>
                    {state.tagline && <p className="text-[10px] italic text-gray-500">{state.tagline}</p>}
                    <button className="w-full text-center text-xs font-semibold text-white py-2" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                      {state.defaultCtaText}
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <BrandReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        scraped={scraped as ScrapedBrandingType | null}
        current={{
          tagline: state.tagline,
          logoUrl: state.logoUrl,
          primaryColor: state.primaryColor,
          secondaryColor: state.secondaryColor,
          fontFamily: state.fontFamily,
        }}
        hasClickWise={hasClickWise}
        onApply={handleReviewApply}
      />
    </div>
  );
}
