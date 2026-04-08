import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Plus, Search, Eye, Pencil, Ban, CheckCircle, AlertTriangle, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { getEffectivePlanId, hasActivePlanOverride } from "@/lib/effectivePlan";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan_id: string;
  email: string | null;
  phone: string | null;
  status: string;
  contact_person: string | null;
  business_type: string | null;
  city: string | null;
  created_at: string;
  effective_plan_id: string;
  has_active_override: boolean;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<TenantRow | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<any[]>([]);

  // Edit form
  const [form, setForm] = useState({
    name: "", email: "", phone: "", contact_person: "", address: "", city: "",
    postal_code: "", country: "NL", business_type: "", status: "active",
  });

  async function fetchTenants() {
    const [tenantsRes, overridesRes] = await Promise.all([
      supabase.from("tenants")
        .select("id, name, slug, plan_id, email, phone, status, contact_person, business_type, city, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("plan_overrides").select("tenant_id, override_plan_slug, ends_at, is_active").eq("is_active", true),
    ]);
    const overrideMap = new Map(
      (overridesRes.data || [])
        .filter((override) => hasActivePlanOverride(override))
        .map((override) => [override.tenant_id, override])
    );
    setTenants(((tenantsRes.data || []) as Omit<TenantRow, "effective_plan_id" | "has_active_override">[]).map((tenant) => {
      const override = overrideMap.get(tenant.id);
      return {
        ...tenant,
        effective_plan_id: getEffectivePlanId(tenant.plan_id, override),
        has_active_override: hasActivePlanOverride(override),
      };
    }));
    setLoading(false);
  }

  useEffect(() => { fetchTenants(); }, []);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.contact_person || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPlan = planFilter === "all" || t.effective_plan_id === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [tenants, search, statusFilter, planFilter]);

  function openEdit(t: TenantRow) {
    setSelected(t);
    setForm({
      name: t.name, email: t.email || "", phone: t.phone || "",
      contact_person: t.contact_person || "", address: "", city: t.city || "",
      postal_code: "", country: "NL", business_type: t.business_type || "",
      status: t.status || "active",
    });
    // Fetch full tenant data
    supabase.from("tenants").select("*").eq("id", t.id).single().then(({ data }) => {
      if (data) {
        setForm((f) => ({
          ...f,
          address: (data as any).address || "",
          postal_code: (data as any).postal_code || "",
          country: (data as any).country || "NL",
        }));
      }
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!selected) return;
    const { error } = await supabase.from("tenants").update({
      name: form.name, email: form.email || null, phone: form.phone || null,
      contact_person: form.contact_person || null, address: form.address || null,
      city: form.city || null, postal_code: form.postal_code || null,
      country: form.country || "NL", business_type: form.business_type || null,
      status: form.status,
    } as any).eq("id", selected.id);
    if (error) { toast.error("Fout bij opslaan: " + error.message); return; }
    // Audit
    await supabase.from("audit_log").insert({
      tenant_id: selected.id, entity_type: "tenant", action: "admin_edit",
      entity_id: selected.id, metadata: { changes: form } as any,
    });
    toast.success("Organisatie bijgewerkt");
    setEditOpen(false);
    fetchTenants();
  }

  async function toggleStatus(t: TenantRow, newStatus: string) {
    const { error } = await supabase.from("tenants").update({ status: newStatus } as any).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("audit_log").insert({
      tenant_id: t.id, entity_type: "tenant", action: "status_change",
      entity_id: t.id, metadata: { old: t.status, new: newStatus } as any,
    });
    toast.success(`Status gewijzigd naar ${newStatus}`);
    fetchTenants();
  }

  async function openNotes(t: TenantRow) {
    setSelected(t);
    setNoteText("");
    const { data } = await supabase.from("admin_notes")
      .select("*").eq("entity_type", "tenant").eq("entity_id", t.id)
      .order("created_at", { ascending: false });
    setNotes(data || []);
    setNoteOpen(true);
  }

  async function addNote() {
    if (!selected || !noteText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("admin_notes").insert({
      entity_type: "tenant", entity_id: selected.id,
      content: noteText.trim(), created_by: user?.id || null,
    } as any);
    toast.success("Notitie toegevoegd");
    setNoteText("");
    const { data } = await supabase.from("admin_notes")
      .select("*").eq("entity_type", "tenant").eq("entity_id", selected.id)
      .order("created_at", { ascending: false });
    setNotes(data || []);
  }

  async function createTenant() {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
    // We can't insert directly due to RLS, use service role via edge function would be ideal
    // But platform_admins have no INSERT on tenants. For now, we need a migration to allow that.
    // Let's try — the admin might have insert perms via the ALL policy... Actually no, tenants has no INSERT policy.
    // We'll need to handle this. For now show toast.
    toast.error("Handmatig aanmaken vereist extra rechten — gebruik registratie of vraag ontwikkelaar.");
    setCreateOpen(false);
  }

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge variant="default" className="bg-green-600">Actief</Badge>;
    if (status === "suspended") return <Badge variant="destructive">Opgeschort</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Inactief</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Organisaties</h1>
          <p className="text-muted-foreground mt-1">{tenants.length} organisatie{tenants.length !== 1 ? "s" : ""} geregistreerd</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op naam, e-mail of contact..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="active">Actief</SelectItem>
            <SelectItem value="suspended">Opgeschort</SelectItem>
            <SelectItem value="deactivated">Inactief</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle plannen</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisatie</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aangemaakt</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Geen organisaties gevonden
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((t) => (
                <TableRow key={t.id} className="group">
                  <TableCell>
                    <Link to={`/admin/tenants/${t.id}`} className="hover:text-primary transition-colors">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{t.slug}</div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{t.contact_person || "—"}</div>
                    <div className="text-xs text-muted-foreground">{t.email || ""}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={t.effective_plan_id === "pro" ? "default" : t.effective_plan_id === "basic" ? "secondary" : "outline"} className="capitalize">{t.effective_plan_id}</Badge>
                      {t.has_active_override && <Badge variant="outline">Override</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(t.status || "active")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(t.created_at), "d MMM yyyy", { locale: nl })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Bewerken">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openNotes(t)} title="Notities">
                        <StickyNote className="w-4 h-4" />
                      </Button>
                      {(t.status || "active") === "active" ? (
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(t, "suspended")} title="Opschorten">
                          <Ban className="w-4 h-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(t, "active")} title="Activeren">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Organisatie bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Naam</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Contactpersoon</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefoon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Adres</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Stad</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>Postcode</Label><Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
              <div className="space-y-2"><Label>Land</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedrijfstype</Label>
                <Select value={form.business_type || "overig"} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horeca">Horeca</SelectItem>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="organisator">Event Organisator</SelectItem>
                    <SelectItem value="sport">Sportclub</SelectItem>
                    <SelectItem value="overig">Overig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="suspended">Opgeschort</SelectItem>
                    <SelectItem value="deactivated">Inactief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuleren</Button>
            <Button onClick={saveEdit}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Notities — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Textarea placeholder="Nieuwe notitie..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="min-h-[60px]" />
            </div>
            <Button onClick={addNote} disabled={!noteText.trim()} size="sm">Toevoegen</Button>
            <div className="space-y-2 mt-4">
              {notes.length === 0 && <p className="text-sm text-muted-foreground">Nog geen notities</p>}
              {notes.map((n: any) => (
                <div key={n.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "d MMM yyyy HH:mm", { locale: nl })}</p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
