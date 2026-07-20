import { Building2, Palette, MapPin, Phone, Mail, Save, Plus, Trash2, Upload, X, Globe, Bell, Shield, Key, ExternalLink } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useUILanguage";
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
import BrandingTab from "@/components/settings/BrandingTab";

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
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
  const [saving, setSaving] = useState(false);
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
      toast.error(t("settings.org.saveFailed", { msg: error.message }));
    } else {
      toast.success(t("settings.org.saved"));
      logAudit({ tenantId: tenant.id, entityType: "tenant", action: "settings_updated", entityId: tenant.id });
      refetch();
    }
  }

  async function saveVenue() {
    if (!tenantId || !venueName.trim()) {
      toast.error(t("settings.venues.nameRequired2"));
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
      toast.success(t("settings.venues.updated"));
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
      toast.success(t("settings.venues.added"));
    }
    resetVenueForm();
    fetchVenues();
  }

  async function deleteVenue(id: string) {
    const { error } = await supabase.from("venues").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("settings.venues.deleted"));
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
        <h1 className="text-2xl font-display font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList className="mb-6 gap-1 h-auto w-full sm:w-auto overflow-x-auto scrollbar-hidden flex-nowrap justify-start sm:flex-wrap">
          <TabsTrigger value="organization" className="gap-1.5 text-xs"><Building2 className="w-3.5 h-3.5" />{t("settings.tab.organization")}</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs"><Palette className="w-3.5 h-3.5" />{t("settings.tab.branding")}</TabsTrigger>
          <TabsTrigger value="venue" className="gap-1.5 text-xs"><MapPin className="w-3.5 h-3.5" />{t("settings.tab.venues")}</TabsTrigger>
          <TabsTrigger value="visibility" className="gap-1.5 text-xs"><Globe className="w-3.5 h-3.5" />{t("settings.tab.visibility")}</TabsTrigger>
          <TabsTrigger value="plan" className="gap-1.5 text-xs"><Key className="w-3.5 h-3.5" />{t("settings.tab.plan")}</TabsTrigger>
        </TabsList>

        {/* Organization */}
        <TabsContent value="organization" className="space-y-5">
          <SettingsCard title={t("settings.org.title")} description={t("settings.org.subtitle")}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.org.name")}</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.org.contact")}</Label>
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder={t("settings.org.contactPlaceholder")} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.org.businessType")}</Label>
                <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder={t("settings.org.businessPlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.org.website")}</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title={t("settings.contact.title")}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" />{t("settings.contact.email")}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" />{t("settings.contact.phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31..." />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title={t("settings.address.title")}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.address.street")}</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("settings.address.streetPlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.address.city")}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("settings.org.cityPlaceholder")} />
              </div>
            </div>
            <div className="space-y-2 max-w-[200px]">
              <Label className="text-sm font-medium text-foreground">{t("settings.address.postal")}</Label>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="1234 AB" />
            </div>
          </SettingsCard>

          <Button size="sm" onClick={saveOrganization} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? t("common.saving") : t("common.save")}
          </Button>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding">
          <BrandingTab />
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
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t("settings.venues.primary")}</span>
                      )}
                    </div>
                    {(v.address || v.city) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[v.address, v.postal_code, v.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => editVenue(v)} className="text-xs min-h-11 sm:min-h-0 sm:h-7 px-3 sm:px-2">{t("settings.venues.edit")}</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteVenue(v.id)} className="text-destructive hover:text-destructive min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:h-7 px-3 sm:px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SettingsCard
            title={editingVenueId ? t("settings.venues.editing") : t("settings.venues.adding")}
            description={t("settings.venues.help")}
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t("settings.venues.nameRequired")}</Label>
              <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder={t("settings.venues.namePlaceholder")} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.address.street")}</Label>
                <Input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder={t("settings.address.streetPlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.address.city")}</Label>
                <Input value={venueCity} onChange={(e) => setVenueCity(e.target.value)} placeholder={t("settings.org.cityPlaceholder")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t("settings.address.postal")}</Label>
              <Input value={venuePostal} onChange={(e) => setVenuePostal(e.target.value)} placeholder="1234 AB" className="max-w-[200px]" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveVenue} disabled={venueLoading} className="gap-2">
                <Save className="w-4 h-4" />{venueLoading ? t("common.saving") : editingVenueId ? t("settings.venues.update") : t("settings.venues.add")}
              </Button>
              {editingVenueId && (
                <Button size="sm" variant="outline" onClick={resetVenueForm}>{t("common.cancel")}</Button>
              )}
            </div>
          </SettingsCard>
        </TabsContent>

        {/* Visibility */}
        <TabsContent value="visibility" className="space-y-5">
          <SettingsCard title={t("settings.visibility.title")} description={t("settings.visibility.subtitle")}>
            <div className="flex items-center justify-between rounded-xl bg-secondary/30 border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{t("settings.visibility.toggleLabel")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.visibility.toggleHelp")}</p>
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
                toast.error(t("settings.org.saveFailed", { msg: error.message }));
              } else {
                toast.success(t("settings.visibility.saved"));
                logAudit({ tenantId: tenant.id, entityType: "tenant", action: "visibility_updated", entityId: tenant.id });
                refetch();
              }
            }} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />{saving ? t("common.saving") : t("common.save")}
            </Button>
          </SettingsCard>
        </TabsContent>

        {/* Plan / Subscription */}
        <TabsContent value="plan" className="space-y-5">
          <SettingsCard title={t("settings.plan.title")} description={t("settings.plan.subtitle")}>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-display font-bold text-foreground capitalize">{t("nav.plan", { plan: effectivePlanId })}</p>
                <p className="text-xs text-muted-foreground">
                  {effectivePlanId === "free" && t("settings.plan.freeDesc")}
                  {effectivePlanId === "basic" && t("settings.plan.basicDesc")}
                  {effectivePlanId === "pro" && t("settings.plan.proDesc")}
                </p>
              </div>
            </div>
            {effectivePlanId !== "pro" && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href="/app/billing">
                  <ExternalLink className="w-3.5 h-3.5" />{t("settings.plan.upgrade")}
                </a>
              </Button>
            )}
          </SettingsCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
