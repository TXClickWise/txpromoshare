import { Building2, Palette, MapPin, Phone, Mail, Save, Plus, Trash2, Upload, X, Globe, Bell, Shield, Key, ExternalLink } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { tenant, tenantId, refetch } = useTenant();
  const { effectivePlanId } = usePlan();

  const [orgName, setOrgName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E86C2C");
  const [secondaryColor, setSecondaryColor] = useState("#2A9D8F");
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showOnDiscovery, setShowOnDiscovery] = useState(true);

  // Venue state
  const [venues, setVenues] = useState<Tables<"venues">[]>([]);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venuePostal, setVenuePostal] = useState("");
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [venueLoading, setVenueLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setOrgName(tenant.name || "");
      setContactPerson(tenant.contact_person || "");
      setWebsite(tenant.website_url || "");
      setEmail(tenant.email || "");
      setPhone(tenant.phone || "");
      setAddress(tenant.address || "");
      setCity(tenant.city || "");
      setPostalCode(tenant.postal_code || "");
      setBusinessType(tenant.business_type || "");
      setPrimaryColor(tenant.primary_color || "#E86C2C");
      setSecondaryColor(tenant.secondary_color || "#2A9D8F");
      setLogoUrl(tenant.logo_url || null);
      setShowOnDiscovery((tenant as any).show_on_discovery !== false);
    }
  }, [tenant]);

  useEffect(() => { fetchVenues(); }, [tenantId]);

  async function fetchVenues() {
    if (!tenantId) return;
    const { data } = await supabase
      .from("venues")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("is_primary", { ascending: false });
    setVenues(data || []);
  }

  async function saveOrganization() {
    if (!tenant) return;
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        name: orgName,
        contact_person: contactPerson || null,
        website_url: website || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postal_code: postalCode || null,
        business_type: businessType || null,
      })
      .eq("id", tenant.id);
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
    } else {
      toast.success("Organisatie-instellingen opgeslagen");
      logAudit({ tenantId: tenant.id, entityType: "tenant", action: "settings_updated", entityId: tenant.id });
      refetch();
    }
  }

  async function handleLogoUpload(files: FileList | null) {
    if (!files || !tenantId || files.length === 0) return;
    setLogoUploading(true);
    const file = files[0];
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/logo.${ext}`;
    await supabase.storage.from("media").remove([path]);
    const { error: uploadError } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Logo upload mislukt: " + uploadError.message);
      setLogoUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    const newUrl = urlData.publicUrl;
    const { error } = await supabase.from("tenants").update({ logo_url: newUrl }).eq("id", tenantId);
    setLogoUploading(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
    } else {
      setLogoUrl(newUrl);
      toast.success("Logo geüpload");
      refetch();
    }
  }

  async function saveBranding() {
    if (!tenant) return;
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({ primary_color: primaryColor, secondary_color: secondaryColor })
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

  async function saveVenue() {
    if (!tenantId || !venueName.trim()) {
      toast.error("Vul minimaal een naam in");
      return;
    }
    setVenueLoading(true);
    if (editingVenueId) {
      const { error } = await supabase
        .from("venues")
        .update({ name: venueName.trim(), address: venueAddress, city: venueCity, postal_code: venuePostal })
        .eq("id", editingVenueId);
      setVenueLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Locatie bijgewerkt");
    } else {
      const isPrimary = venues.length === 0;
      const { error } = await supabase.from("venues").insert({
        tenant_id: tenantId,
        name: venueName.trim(),
        address: venueAddress || null,
        city: venueCity || null,
        postal_code: venuePostal || null,
        is_primary: isPrimary,
      });
      setVenueLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Locatie toegevoegd");
    }
    resetVenueForm();
    fetchVenues();
  }

  async function deleteVenue(id: string) {
    const { error } = await supabase.from("venues").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Locatie verwijderd");
    if (editingVenueId === id) resetVenueForm();
    fetchVenues();
  }

  function editVenue(v: Tables<"venues">) {
    setEditingVenueId(v.id);
    setVenueName(v.name);
    setVenueAddress(v.address || "");
    setVenueCity(v.city || "");
    setVenuePostal(v.postal_code || "");
  }

  function resetVenueForm() {
    setEditingVenueId(null);
    setVenueName("");
    setVenueAddress("");
    setVenueCity("");
    setVenuePostal("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.settings}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Beheer je organisatie, branding en voorkeuren</p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="organization" className="gap-1.5 text-xs"><Building2 className="w-3.5 h-3.5" />Organisatie</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs"><Palette className="w-3.5 h-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="venue" className="gap-1.5 text-xs"><MapPin className="w-3.5 h-3.5" />Locaties</TabsTrigger>
          <TabsTrigger value="visibility" className="gap-1.5 text-xs"><Globe className="w-3.5 h-3.5" />Zichtbaarheid</TabsTrigger>
          <TabsTrigger value="plan" className="gap-1.5 text-xs"><Key className="w-3.5 h-3.5" />Abonnement</TabsTrigger>
        </TabsList>

        {/* Organization */}
        <TabsContent value="organization" className="space-y-5">
          <SettingsCard title="Bedrijfsgegevens" description="Deze informatie wordt gebruikt voor facturen en communicatie.">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bedrijfsnaam</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contactpersoon</Label>
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Naam contactpersoon" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type bedrijf</Label>
                <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Bijv. Café, Restaurant, Evenementenlocatie" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title="Contactgegevens">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3 h-3" />E-mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3 h-3" />Telefoon</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31..." />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title="Adresgegevens">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adres</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straat en huisnummer" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stad</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Stad" />
              </div>
            </div>
            <div className="space-y-2 max-w-[200px]">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Postcode</Label>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="1234 AB" />
            </div>
          </SettingsCard>

          <Button size="sm" onClick={saveOrganization} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? "Opslaan..." : t.common.save}
          </Button>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-5">
          <SettingsCard title="Logo" description="Je logo wordt getoond op eventpagina's, widgets en e-mails.">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleLogoUpload(e.target.files)}
            />
            {logoUrl ? (
              <div className="relative border-2 border-dashed border-border rounded-xl p-4 bg-secondary/20">
                <div className="aspect-square max-w-[180px] mx-auto">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex justify-center gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="gap-2 text-xs">
                    <Upload className="w-3.5 h-3.5" />Wijzigen
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                    if (!tenant) return;
                    await supabase.from("tenants").update({ logo_url: null }).eq("id", tenant.id);
                    setLogoUrl(null);
                    refetch();
                    toast.success("Logo verwijderd");
                  }}>
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

          <SettingsCard title="Kleuren" description="Kleuren worden gebruikt op eventpagina's, widgets en deelkaarten.">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primaire kleur</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secundaire kleur</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Live preview */}
          <SettingsCard title="Preview" description="Zo ziet jouw branding eruit op een widget.">
            <div className="rounded-xl bg-secondary/30 border border-border p-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-full py-2.5 rounded-lg text-xs font-semibold text-center text-white" style={{ backgroundColor: primaryColor }}>Reserveer nu</div>
                <div className="w-full py-2.5 rounded-lg text-xs font-semibold text-center text-white" style={{ backgroundColor: secondaryColor }}>Deel event</div>
              </div>
              <div className="rounded-lg bg-white border border-border p-4" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                <div className="flex items-center gap-2 mb-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-5 w-auto object-contain" />
                  ) : (
                    <div className="w-1 h-5 rounded-sm" style={{ backgroundColor: primaryColor }} />
                  )}
                  <p className="text-sm font-bold text-gray-900">Agenda · {orgName || "Jouw organisatie"}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 flex gap-3 items-start">
                  <div className="text-center rounded-md px-2 py-1.5" style={{ backgroundColor: primaryColor + "15" }}>
                    <p className="text-[10px] font-semibold" style={{ color: primaryColor }}>vr 25 apr</p>
                    <p className="text-[10px] text-gray-500">20:00</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900">Voorbeeld evenement</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Een korte beschrijving van het event</p>
                    <div className="mt-2 inline-block text-[10px] font-medium text-white px-3 py-1 rounded" style={{ backgroundColor: primaryColor }}>
                      Meer info
                    </div>
                  </div>
                </div>
                <p className="text-center text-[9px] text-gray-400 mt-3">Powered by TX EventShare</p>
              </div>
            </div>
          </SettingsCard>

          <Button size="sm" onClick={saveBranding} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? "Opslaan..." : t.common.save}
          </Button>
        </TabsContent>

        {/* Venues */}
        <TabsContent value="venue" className="space-y-5">
          {venues.length > 0 && (
            <div className="space-y-3">
              {venues.map((v) => (
                <div key={v.id} className="rounded-xl bg-card border border-border shadow-card p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm truncate">{v.name}</p>
                      {v.is_primary && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">Standaard</span>
                      )}
                    </div>
                    {(v.address || v.city) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[v.address, v.postal_code, v.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => editVenue(v)} className="text-xs h-7 px-2">Bewerk</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteVenue(v.id)} className="text-destructive hover:text-destructive h-7 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SettingsCard
            title={editingVenueId ? "Locatie bewerken" : "Nieuwe locatie toevoegen"}
            description="Je standaard locatie wordt automatisch ingevuld bij nieuwe evenementen."
          >
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Locatienaam *</Label>
              <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Naam van je locatie" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adres</Label>
                <Input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="Straat en huisnummer" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stad</Label>
                <Input value={venueCity} onChange={(e) => setVenueCity(e.target.value)} placeholder="Stad" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Postcode</Label>
              <Input value={venuePostal} onChange={(e) => setVenuePostal(e.target.value)} placeholder="1234 AB" className="max-w-[200px]" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveVenue} disabled={venueLoading} className="gap-2">
                <Save className="w-4 h-4" />{venueLoading ? "Opslaan..." : editingVenueId ? "Bijwerken" : "Toevoegen"}
              </Button>
              {editingVenueId && (
                <Button size="sm" variant="outline" onClick={resetVenueForm}>Annuleren</Button>
              )}
            </div>
          </SettingsCard>
        </TabsContent>

        {/* Visibility */}
        <TabsContent value="visibility" className="space-y-5">
          <SettingsCard title="Publieke zichtbaarheid" description="Bepaal of jouw evenementen zichtbaar zijn op de publieke ontdekkingspagina van TX EventShare.">
            <div className="flex items-center justify-between rounded-xl bg-secondary/30 border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Toon evenementen op ontdekkingspagina</p>
                <p className="text-xs text-muted-foreground">Je kunt dit per evenement nog overschrijven.</p>
              </div>
              <Switch checked={showOnDiscovery} onCheckedChange={setShowOnDiscovery} />
            </div>
            <Button size="sm" onClick={async () => {
              if (!tenant) return;
              setSaving(true);
              const { error } = await supabase
                .from("tenants")
                .update({ show_on_discovery: showOnDiscovery } as any)
                .eq("id", tenant.id);
              setSaving(false);
              if (error) {
                toast.error("Opslaan mislukt: " + error.message);
              } else {
                toast.success("Zichtbaarheid opgeslagen");
                logAudit({ tenantId: tenant.id, entityType: "tenant", action: "visibility_updated", entityId: tenant.id });
                refetch();
              }
            }} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />{saving ? "Opslaan..." : "Opslaan"}
            </Button>
          </SettingsCard>
        </TabsContent>

        {/* Plan / Subscription */}
        <TabsContent value="plan" className="space-y-5">
          <SettingsCard title="Huidig abonnement" description="Bekijk je actieve abonnement en limieten.">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-display font-bold text-foreground capitalize">{effectivePlanId} plan</p>
                <p className="text-xs text-muted-foreground">
                  {effectivePlanId === "free" && "Beperkt tot 3 actieve events, 1 widget en 1 teamlid"}
                  {effectivePlanId === "basic" && "Tot 15 events, 3 widgets, 3 teamleden en custom branding"}
                  {effectivePlanId === "pro" && "Onbeperkte events, widgets, tot 10 teamleden en alle features"}
                </p>
              </div>
            </div>
            {effectivePlanId !== "pro" && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href="/app/billing">
                  <ExternalLink className="w-3.5 h-3.5" />Upgraden
                </a>
              </Button>
            )}
          </SettingsCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
