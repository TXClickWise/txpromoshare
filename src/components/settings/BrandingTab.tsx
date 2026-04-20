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

        <AnimatePresence>
          {scraped && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-primary/30 bg-card p-4 space-y-3">
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
                        <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: scraped.primaryColor }} />
                        <span className="font-mono">{scraped.primaryColor}</span>
                        <ConfidenceBadge level={scraped.confidence.primaryColor} />
                      </div>
                    </div>
                  )}
                  {scraped.secondaryColor && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Secundaire kleur</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: scraped.secondaryColor }} />
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
      </motion.div>

      {/* 2-koloms layout: links form, rechts sticky preview */}
      <div className="grid lg:grid-cols-[1fr_minmax(320px,400px)] gap-5 items-start">
        {/* LINKS — Form in tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card border border-border shadow-card overflow-hidden"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border bg-muted/30 px-2 pt-2">
              <TabsList className="bg-transparent h-auto p-0 gap-1 w-full justify-start">
                <TabsTrigger value="identity" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Building2 className="w-3.5 h-3.5" />Identiteit
                </TabsTrigger>
                <TabsTrigger value="style" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Palette className="w-3.5 h-3.5" />Kleuren & stijl
                </TabsTrigger>
                <TabsTrigger value="dna" className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />Merk-DNA
                </TabsTrigger>
              </TabsList>
            </div>

            {/* IDENTITEIT */}
            <TabsContent value="identity" className="p-5 space-y-6 mt-0">
              <Section icon={ImageIcon} title="Logo" description="Wordt getoond op eventpagina's, widgets en e-mails.">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e.target.files)}
                />
                {state.logoUrl ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Preview op licht */}
                    <div className="rounded-lg border border-border bg-white p-4 flex items-center justify-center min-h-[100px]">
                      <img
                        src={state.logoUrl}
                        alt="Logo"
                        className="max-h-[80px] max-w-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                    {/* Preview op donker */}
                    <div className="rounded-lg border border-border bg-foreground p-4 flex items-center justify-center min-h-[100px]">
                      <img
                        src={state.logoUrl}
                        alt="Logo donker"
                        className="max-h-[80px] max-w-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="gap-2 text-xs">
                        <Upload className="w-3.5 h-3.5" />{logoUploading ? "Uploaden..." : "Wijzig logo"}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive gap-2 text-xs" onClick={removeLogo}>
                        <X className="w-3.5 h-3.5" />Verwijder
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 cursor-pointer transition-colors bg-muted/30"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{logoUploading ? "Uploaden..." : "Upload je logo"}</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, SVG of JPG — minimaal 200×200px, transparant aanbevolen</p>
                  </div>
                )}
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
            <TabsContent value="style" className="p-5 space-y-6 mt-0">
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
            <TabsContent value="dna" className="p-5 space-y-6 mt-0">
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
          </Tabs>

          {/* Sticky save bar */}
          <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">Wijzigingen worden direct in de preview getoond.</p>
            <Button size="sm" onClick={saveBranding} disabled={saving} className="gap-2 ml-auto">
              <Save className="w-4 h-4" />{saving ? "Opslaan..." : "Branding opslaan"}
            </Button>
          </div>
        </motion.div>

        {/* RECHTS — Sticky preview */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:sticky lg:top-4 rounded-xl bg-card border border-border shadow-card p-4 space-y-3"
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
    </div>
  );
}
