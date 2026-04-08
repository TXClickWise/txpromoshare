import { useState, useRef, useEffect } from "react";
import { Upload, X, Building2, Save, Globe, Wand2, Loader2, CheckCircle2, AlertCircle, Eye, Palette, Type, MousePointer } from "lucide-react";
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

function SettingsCard({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl bg-card border border-border shadow-card p-5 space-y-4 ${className || ""}`}>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </motion.div>
  );
}

const FONT_OPTIONS = [
  { value: "system", label: "Systeem (standaard)" },
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "roboto", label: "Roboto" },
  { value: "open-sans", label: "Open Sans" },
  { value: "lato", label: "Lato" },
  { value: "montserrat", label: "Montserrat" },
  { value: "playfair", label: "Playfair Display" },
  { value: "dm-sans", label: "DM Sans" },
];

const BUTTON_STYLES = [
  { value: "rounded", label: "Afgerond" },
  { value: "pill", label: "Pill" },
  { value: "square", label: "Vierkant" },
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

  // Firecrawl state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState<ScrapedBranding | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

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

      const result: ScrapedBranding = {
        confidence: {},
      };

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
      toast.success("Website geanalyseerd! Controleer het voorstel hieronder.");
    } catch (err: any) {
      console.error("Scrape error:", err);
      setScrapeError(err.message || "Er ging iets mis bij het analyseren");
      toast.error("Analyse mislukt");
    } finally {
      setScraping(false);
    }
  }

  function applyScraped() {
    if (!scraped) return;
    if (scraped.primaryColor) update("primaryColor", scraped.primaryColor);
    if (scraped.secondaryColor) update("secondaryColor", scraped.secondaryColor);
    if (scraped.tagline) update("tagline", scraped.tagline);
    const matchedFont = FONT_OPTIONS.find((f) => f.value === scraped.fontFamily);
    if (matchedFont) update("fontFamily", matchedFont.value);
    toast.success("Voorstel toegepast — controleer en sla op");
    setScraped(null);
  }

  const btnRadius = state.buttonStyle === "pill" ? "9999px" : state.buttonStyle === "square" ? "4px" : "8px";
  const fontClass = state.fontFamily === "system" ? "font-sans" : "";

  function ConfidenceBadge({ level }: { level?: "high" | "medium" | "low" }) {
    if (!level) return null;
    const colors = { high: "text-green-600 bg-green-50", medium: "text-amber-600 bg-amber-50", low: "text-red-600 bg-red-50" };
    const labels = { high: "Zeker", medium: "Waarschijnlijk", low: "Onzeker" };
    return <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[level]}`}>{labels[level]}</span>;
  }

  return (
    <div className="space-y-5">
      {/* Auto import */}
      <SettingsCard title="Website analyseren" description="Haal automatisch je branding op van je website.">
        <div className="flex gap-2">
          <Input
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder="https://jouwwebsite.nl"
            className="flex-1"
          />
          <Button onClick={handleScrape} disabled={scraping} size="sm" className="gap-2 shrink-0">
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {scraping ? "Analyseren..." : "Analyseer"}
          </Button>
        </div>

        {scrapeError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{scrapeError}</p>
          </div>
        )}

        <AnimatePresence>
          {scraped && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Gevonden branding</p>
                </div>

                <div className="grid gap-2 text-xs">
                  {scraped.companyName && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Bedrijfsnaam</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{scraped.companyName}</span>
                        <ConfidenceBadge level={scraped.confidence.companyName} />
                      </div>
                    </div>
                  )}
                  {scraped.tagline && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tagline</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[200px]">{scraped.tagline}</span>
                        <ConfidenceBadge level={scraped.confidence.tagline} />
                      </div>
                    </div>
                  )}
                  {scraped.primaryColor && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Primaire kleur</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border" style={{ backgroundColor: scraped.primaryColor }} />
                        <span className="font-mono">{scraped.primaryColor}</span>
                        <ConfidenceBadge level={scraped.confidence.primaryColor} />
                      </div>
                    </div>
                  )}
                  {scraped.secondaryColor && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Secundaire kleur</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border" style={{ backgroundColor: scraped.secondaryColor }} />
                        <span className="font-mono">{scraped.secondaryColor}</span>
                        <ConfidenceBadge level={scraped.confidence.secondaryColor} />
                      </div>
                    </div>
                  )}
                  {scraped.logo && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Logo</span>
                      <div className="flex items-center gap-2">
                        <img src={scraped.logo} alt="" className="h-6 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                        <ConfidenceBadge level={scraped.confidence.logo} />
                      </div>
                    </div>
                  )}
                  {scraped.fontFamily && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lettertype</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{scraped.fontFamily}</span>
                        <ConfidenceBadge level={scraped.confidence.fontFamily} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={applyScraped} className="gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />Toepassen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setScraped(null)} className="text-xs">
                    Negeren
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsCard>

      {/* Logo */}
      <SettingsCard title="Logo" description="Wordt getoond op eventpagina's, widgets en e-mails.">
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleLogoUpload(e.target.files)}
        />
        {state.logoUrl ? (
          <div className="relative border-2 border-dashed border-border rounded-xl p-4 bg-secondary/20">
            <div className="flex items-center justify-center min-h-[100px]">
              <img
                src={state.logoUrl}
                alt="Logo"
                className="max-h-[120px] max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "";
                  e.currentTarget.alt = "Kan logo niet laden";
                }}
              />
            </div>
            <div className="flex justify-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="gap-2 text-xs">
                <Upload className="w-3.5 h-3.5" />{logoUploading ? "Uploaden..." : "Wijzigen"}
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={removeLogo}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 cursor-pointer transition-colors bg-secondary/20"
            onClick={() => logoInputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-foreground">{logoUploading ? "Uploaden..." : "Upload je logo"}</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, SVG of JPG, minimaal 200×200px</p>
          </div>
        )}
      </SettingsCard>

      {/* Colors */}
      <SettingsCard title="Kleuren" description="Worden gebruikt op eventpagina's, widgets en deelkaarten.">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Palette className="w-3 h-3" />Primaire kleur</Label>
            <div className="flex gap-2 items-center">
              <Input type="color" value={state.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
              <Input value={state.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="flex-1 font-mono text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Palette className="w-3 h-3" />Secundaire kleur</Label>
            <div className="flex gap-2 items-center">
              <Input type="color" value={state.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
              <Input value={state.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} className="flex-1 font-mono text-sm" />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Typography & Buttons */}
      <SettingsCard title="Typografie & Knoppen" description="Lettertype en knopstijl voor je events en widgets.">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Type className="w-3 h-3" />Lettertype</Label>
            <Select value={state.fontFamily} onValueChange={(v) => update("fontFamily", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><MousePointer className="w-3 h-3" />Knopstijl</Label>
            <Select value={state.buttonStyle} onValueChange={(v) => update("buttonStyle", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUTTON_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Standaard CTA tekst</Label>
          <Input value={state.defaultCtaText} onChange={(e) => update("defaultCtaText", e.target.value)} placeholder="Bijv. Reserveer nu, Meer info, Tickets" />
        </div>
      </SettingsCard>

      {/* Brand identity */}
      <SettingsCard title="Merkidentiteit" description="Wordt gebruikt door AI-functies en als referentie.">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tagline / Slogan</Label>
          <Input value={state.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Bijv. De beste events op Texel" />
        </div>
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
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Merk samenvatting (AI-ready)</Label>
          <Textarea
            value={state.brandSummary}
            onChange={(e) => update("brandSummary", e.target.value)}
            placeholder="Beschrijf kort je merk: wie je bent, wat je uitstraalt, en wat je doelgroep verwacht..."
            rows={3}
            className="text-sm"
          />
        </div>
      </SettingsCard>

      {/* Design Studio Previews */}
      <SettingsCard title="Design Studio" description="Bekijk hoe jouw branding eruitziet in de praktijk.">
        <Tabs value={previewTab} onValueChange={setPreviewTab}>
          <TabsList className="h-auto flex-wrap gap-1">
            <TabsTrigger value="card" className="text-xs gap-1"><Eye className="w-3 h-3" />Event card</TabsTrigger>
            <TabsTrigger value="widget" className="text-xs gap-1">Agenda widget</TabsTrigger>
            <TabsTrigger value="single" className="text-xs gap-1">Enkel event</TabsTrigger>
            <TabsTrigger value="page" className="text-xs gap-1">Eventpagina</TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-4">
            <div className="rounded-xl bg-secondary/30 border border-border p-4">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-sm mx-auto shadow-sm" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
                <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Afbeelding</span>
                </div>
                <div className="p-4 space-y-2">
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

          <TabsContent value="widget" className="mt-4">
            <div className="rounded-xl bg-secondary/30 border border-border p-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-sm mx-auto" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
                <div className="flex items-center gap-2 mb-3">
                  {state.logoUrl ? (
                    <img src={state.logoUrl} alt="" className="h-5 w-auto object-contain" />
                  ) : (
                    <div className="w-1 h-5 rounded-sm" style={{ backgroundColor: state.primaryColor }} />
                  )}
                  <p className="text-sm font-bold text-gray-900">Agenda · {tenant?.name || "Organisatie"}</p>
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3 flex gap-3 items-start mb-2">
                    <div className="text-center rounded-md px-2 py-1.5" style={{ backgroundColor: state.primaryColor + "15" }}>
                      <p className="text-[10px] font-semibold" style={{ color: state.primaryColor }}>{i === 1 ? "vr 25 apr" : "za 26 apr"}</p>
                      <p className="text-[10px] text-gray-500">{i === 1 ? "20:00" : "14:00"}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">{i === 1 ? "Live muziek avond" : "Wijnproeverij"}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Korte beschrijving van het event</p>
                      <div className="mt-2 inline-block text-[10px] font-medium text-white px-3 py-1" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                        {state.defaultCtaText}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-center text-[9px] text-gray-400 mt-3">Powered by TX EventShare</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="single" className="mt-4">
            <div className="rounded-xl bg-secondary/30 border border-border p-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-sm mx-auto" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
                <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Afbeelding</span>
                </div>
                <p className="text-base font-bold text-gray-900">Live muziek avond</p>
                <p className="text-xs text-gray-500 mt-0.5">Vrijdag 25 april · 20:00 – 23:00</p>
                <p className="text-xs text-gray-600 mt-2">Een avond vol live muziek met lokale artiesten in een gezellige sfeer.</p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 text-center text-xs font-semibold text-white py-2" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                    {state.defaultCtaText}
                  </button>
                  <button className="flex-1 text-center text-xs font-semibold py-2 border border-gray-300 text-gray-700" style={{ borderRadius: btnRadius }}>
                    Delen
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="page" className="mt-4">
            <div className="rounded-xl bg-secondary/30 border border-border p-4">
              <div className="bg-white rounded-lg border border-gray-200 max-w-sm mx-auto overflow-hidden" style={{ fontFamily: state.fontFamily === "system" ? undefined : state.fontFamily }}>
                <div className="h-36 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
                  <span className="text-gray-400 text-xs">Hero afbeelding</span>
                  <div className="absolute bottom-3 left-3">
                    {state.logoUrl && <img src={state.logoUrl} alt="" className="h-6 w-auto object-contain bg-white/80 rounded px-1.5 py-0.5" />}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-lg font-bold text-gray-900">Live muziek avond</p>
                    {state.tagline && <p className="text-xs italic text-gray-500">{state.tagline}</p>}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-600">
                    <span>📅 25 april 2026</span>
                    <span>🕐 20:00 – 23:00</span>
                  </div>
                  <p className="text-xs text-gray-600">Een avond vol live muziek met lokale artiesten in een gezellige sfeer. Reserveer snel je plek!</p>
                  <button className="w-full text-center text-xs font-semibold text-white py-2.5" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
                    {state.defaultCtaText}
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SettingsCard>

      {/* Save */}
      <Button size="sm" onClick={saveBranding} disabled={saving} className="gap-2">
        <Save className="w-4 h-4" />{saving ? "Opslaan..." : "Branding opslaan"}
      </Button>
    </div>
  );
}
