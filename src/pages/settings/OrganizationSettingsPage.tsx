import { Building2, Phone, Mail, Save, Globe } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useUILanguage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";

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

export default function OrganizationSettingsPage() {
  const { t } = useTranslation();
  const { tenant, refetch } = useTenant();

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

  async function saveVisibility() {
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
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          {t("settings.item.company")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("settings.item.company.desc")}</p>
      </div>

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

      <SettingsCard title={t("settings.visibility.title")} description={t("settings.visibility.subtitle")}>
        <div className="flex items-center justify-between rounded-xl bg-secondary/30 border border-border p-4">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("settings.visibility.toggleLabel")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.visibility.toggleHelp")}</p>
            </div>
          </div>
          <Switch checked={showOnDiscovery} onCheckedChange={setShowOnDiscovery} />
        </div>
        <Button size="sm" onClick={saveVisibility} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />{saving ? t("common.saving") : t("common.save")}
        </Button>
      </SettingsCard>
    </div>
  );
}