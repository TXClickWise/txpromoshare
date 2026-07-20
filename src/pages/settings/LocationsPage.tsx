import { useEffect, useState } from "react";
import { MapPin, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { useTranslation } from "@/hooks/useUILanguage";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export default function LocationsPage() {
  const { t } = useTranslation();
  const { tenantId } = useTenant();
  const [venues, setVenues] = useState<Tables<"venues">[]>([]);

  // Add form (bottom of page)
  const [addName, setAddName] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addCity, setAddCity] = useState("");
  const [addPostal, setAddPostal] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit dialog
  const [editing, setEditing] = useState<Tables<"venues"> | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPostal, setEditPostal] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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

  async function addVenue() {
    if (!tenantId || !addName.trim()) {
      toast.error(t("settings.venues.nameRequired2"));
      return;
    }
    setAdding(true);
    const isPrimary = venues.length === 0;
    const { error } = await supabase.from("venues").insert({
      tenant_id: tenantId,
      name: addName.trim(),
      address: addAddress || null,
      city: addCity || null,
      postal_code: addPostal || null,
      is_primary: isPrimary,
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("settings.venues.added"));
    logAudit({ tenantId, entityType: "venue", action: "created" });
    setAddName(""); setAddAddress(""); setAddCity(""); setAddPostal("");
    fetchVenues();
  }

  function openEdit(v: Tables<"venues">) {
    setEditing(v);
    setEditName(v.name);
    setEditAddress(v.address || "");
    setEditCity(v.city || "");
    setEditPostal(v.postal_code || "");
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editName.trim()) {
      toast.error(t("settings.venues.nameRequired2"));
      return;
    }
    setSavingEdit(true);
    const { error } = await supabase
      .from("venues")
      .update({
        name: editName.trim(),
        address: editAddress || null,
        city: editCity || null,
        postal_code: editPostal || null,
      })
      .eq("id", editing.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("settings.venues.updated"));
    if (tenantId) logAudit({ tenantId, entityType: "venue", action: "updated", entityId: editing.id });
    setEditing(null);
    fetchVenues();
  }

  async function deleteVenue(id: string) {
    const { error } = await supabase.from("venues").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("settings.venues.deleted"));
    if (tenantId) logAudit({ tenantId, entityType: "venue", action: "deleted", entityId: id });
    fetchVenues();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          {t("settings.locations.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("settings.locations.subtitle")}</p>
      </div>

      {venues.length > 0 && (
        <div className="rounded-xl bg-card border border-border shadow-card p-4 space-y-3">
          {venues.map((v) => (
            <div key={v.id} className="rounded-xl bg-secondary/30 border border-border p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="font-medium text-foreground text-sm truncate">{v.name}</p>
                  {v.is_primary && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {t("settings.venues.primary")}
                    </span>
                  )}
                </div>
                {(v.address || v.city) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[v.address, v.postal_code, v.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openEdit(v)} className="text-xs min-h-11 sm:min-h-0 sm:h-8 px-3">
                  {t("settings.venues.edit")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteVenue(v.id)} className="text-destructive hover:text-destructive min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:h-8 px-3">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("settings.locations.addTitle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("settings.venues.help")}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">{t("settings.venues.nameRequired")}</Label>
          <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder={t("settings.venues.namePlaceholder")} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{t("settings.address.street")}</Label>
            <Input value={addAddress} onChange={(e) => setAddAddress(e.target.value)} placeholder={t("settings.address.streetPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{t("settings.address.city")}</Label>
            <Input value={addCity} onChange={(e) => setAddCity(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">{t("settings.address.postal")}</Label>
          <Input value={addPostal} onChange={(e) => setAddPostal(e.target.value)} placeholder="1234 AB" className="max-w-[200px]" />
        </div>
        <Button size="sm" onClick={addVenue} disabled={adding} className="gap-2 min-h-11">
          <Save className="w-4 h-4" />{adding ? t("common.saving") : t("settings.venues.add")}
        </Button>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.locations.editDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t("settings.venues.nameRequired")}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t("settings.address.street")}</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.address.city")}</Label>
                <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("settings.address.postal")}</Label>
                <Input value={editPostal} onChange={(e) => setEditPostal(e.target.value)} placeholder="1234 AB" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} className="min-h-11">
              {t("common.cancel")}
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="min-h-11 gap-2">
              <Save className="w-4 h-4" />{savingEdit ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}