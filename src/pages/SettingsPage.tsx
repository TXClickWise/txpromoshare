import { Building2, Palette, MapPin, Phone, Mail, Save, Plus, Trash2, Upload, X } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function SettingsPage() {
  const { tenant, tenantId, refetch } = useTenant();

  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E86C2C");
  const [secondaryColor, setSecondaryColor] = useState("#2A9D8F");
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
      setWebsite(tenant.website_url || "");
      setEmail(tenant.email || "");
      setPhone(tenant.phone || "");
      setPrimaryColor(tenant.primary_color || "#E86C2C");
      setSecondaryColor(tenant.secondary_color || "#2A9D8F");
      setLogoUrl(tenant.logo_url || null);
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
      .update({ name: orgName, website_url: website, email, phone })
      .eq("id", tenant.id);
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
    } else {
      toast.success("Instellingen opgeslagen");
      if (tenant) logAudit({ tenantId: tenant.id, entityType: "tenant", action: "settings_updated", entityId: tenant.id });
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
      if (tenant) logAudit({ tenantId: tenant.id, entityType: "tenant", action: "branding_updated", entityId: tenant.id });
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
      <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.settings}</h1>

      <Tabs defaultValue="organization">
        <TabsList className="mb-6">
          <TabsTrigger value="organization" className="gap-1.5"><Building2 className="w-3.5 h-3.5" />Organisatie</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5"><Palette className="w-3.5 h-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="venue" className="gap-1.5"><MapPin className="w-3.5 h-3.5" />Locaties</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bedrijfsnaam</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              </div>
            </div>
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
            <Button size="sm" onClick={saveOrganization} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />{saving ? "Opslaan..." : t.common.save}
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="branding">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Logo</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 cursor-pointer transition-colors bg-secondary/20">
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-foreground">Upload je logo</p>
                <p className="text-xs text-muted-foreground mt-1">PNG of SVG, minimaal 200x200px</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primaire kleur</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
                </div>
                <p className="text-[11px] text-muted-foreground">Wordt gebruikt op eventpagina's en widgets</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secundaire kleur</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/30 border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</p>
              <div className="flex gap-3">
                <div className="w-full py-2.5 rounded-lg text-xs font-semibold text-center text-white" style={{ backgroundColor: primaryColor }}>Reserveer nu</div>
                <div className="w-full py-2.5 rounded-lg text-xs font-semibold text-center text-white" style={{ backgroundColor: secondaryColor }}>Deel event</div>
              </div>
            </div>

            <Button size="sm" onClick={saveBranding} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />{saving ? "Opslaan..." : t.common.save}
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="venue">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Existing venues */}
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

            {/* Add/edit form */}
            <div className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
              <p className="text-sm font-medium text-foreground">
                {editingVenueId ? "Locatie bewerken" : "Nieuwe locatie toevoegen"}
              </p>
              <p className="text-xs text-muted-foreground">Je standaard locatie wordt automatisch ingevuld bij nieuwe evenementen.</p>
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
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
