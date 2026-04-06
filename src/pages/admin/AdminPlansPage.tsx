import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Package, Plus, Pencil, Eye, EyeOff, Star } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface PlanRow {
  id: string; name: string; slug: string; description: string | null;
  features: string[]; limits: Record<string, any>; monthly_price_cents: number;
  yearly_price_cents: number | null; is_active: boolean; is_public: boolean;
  is_featured: boolean; sort_order: number; notes: string | null;
  stripe_monthly_price_id: string | null; stripe_yearly_price_id: string | null;
  created_at: string;
}

const defaultLimits = {
  maxActiveEvents: 3, maxWidgets: 1, maxTeamMembers: 1,
  customCategories: false, customBranding: false, advancedBranding: false,
  multipleLocations: false, clickwiseIntegration: false, advancedDistribution: false,
  advancedAnalytics: false, ticketingReady: false, agendaWidget: false,
  singleEventWidget: false, allTemplates: false, distributionCenter: false,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PlanRow | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", monthly_price_cents: 0,
    yearly_price_cents: 0, is_active: true, is_public: true, is_featured: false,
    sort_order: 0, notes: "", features: "[]", limits: JSON.stringify(defaultLimits, null, 2),
    stripe_monthly_price_id: "", stripe_yearly_price_id: "",
  });

  async function fetchPlans() {
    const { data } = await supabase.from("plans").select("*").order("sort_order");
    setPlans((data || []).map((p: any) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
      limits: typeof p.limits === "object" ? p.limits : {},
    })));
    setLoading(false);
  }

  useEffect(() => { fetchPlans(); }, []);

  function openEdit(plan?: PlanRow) {
    if (plan) {
      setSelected(plan);
      setForm({
        name: plan.name, slug: plan.slug, description: plan.description || "",
        monthly_price_cents: plan.monthly_price_cents, yearly_price_cents: plan.yearly_price_cents || 0,
        is_active: plan.is_active, is_public: plan.is_public, is_featured: plan.is_featured,
        sort_order: plan.sort_order, notes: plan.notes || "",
        features: JSON.stringify(plan.features, null, 2),
        limits: JSON.stringify(plan.limits, null, 2),
        stripe_monthly_price_id: plan.stripe_monthly_price_id || "",
        stripe_yearly_price_id: plan.stripe_yearly_price_id || "",
      });
    } else {
      setSelected(null);
      setForm({
        name: "", slug: "", description: "", monthly_price_cents: 0,
        yearly_price_cents: 0, is_active: true, is_public: true, is_featured: false,
        sort_order: plans.length, notes: "", features: "[]",
        limits: JSON.stringify(defaultLimits, null, 2),
        stripe_monthly_price_id: "", stripe_yearly_price_id: "",
      });
    }
    setEditOpen(true);
  }

  async function save() {
    let features: any, limits: any;
    try { features = JSON.parse(form.features); } catch { toast.error("Ongeldige features JSON"); return; }
    try { limits = JSON.parse(form.limits); } catch { toast.error("Ongeldige limits JSON"); return; }

    const payload = {
      name: form.name, slug: form.slug, description: form.description || null,
      monthly_price_cents: form.monthly_price_cents,
      yearly_price_cents: form.yearly_price_cents || null,
      is_active: form.is_active, is_public: form.is_public, is_featured: form.is_featured,
      sort_order: form.sort_order, notes: form.notes || null,
      features, limits,
      stripe_monthly_price_id: form.stripe_monthly_price_id || null,
      stripe_yearly_price_id: form.stripe_yearly_price_id || null,
    };

    if (selected) {
      const { error } = await supabase.from("plans").update(payload as any).eq("id", selected.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Plan bijgewerkt");
    } else {
      const { error } = await supabase.from("plans").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Plan aangemaakt");
    }
    setEditOpen(false);
    fetchPlans();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Plannen Beheer</h1>
          <p className="text-muted-foreground mt-1">Beheer abonnementsplannen, limieten en features</p>
        </div>
        <Button onClick={() => openEdit()} className="gap-2"><Plus className="w-4 h-4" /> Nieuw plan</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Prijs/maand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Zichtbaar</TableHead>
                <TableHead>Limieten</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground">{p.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      {p.is_featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.monthly_price_cents === 0 ? "Gratis" : `€${(p.monthly_price_cents / 100).toFixed(2)}`}
                  </TableCell>
                  <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Actief" : "Inactief"}</Badge></TableCell>
                  <TableCell>
                    {p.is_public ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.limits?.maxActiveEvents ?? "?"} events · {p.limits?.maxWidgets ?? "?"} widgets · {p.limits?.maxTeamMembers ?? "?"} team
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected ? "Plan bewerken" : "Nieuw plan"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Naam</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Beschrijving</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Prijs/maand (centen)</Label><Input type="number" value={form.monthly_price_cents} onChange={(e) => setForm({ ...form, monthly_price_cents: +e.target.value })} /></div>
              <div className="space-y-2"><Label>Prijs/jaar (centen)</Label><Input type="number" value={form.yearly_price_cents} onChange={(e) => setForm({ ...form, yearly_price_cents: +e.target.value })} /></div>
              <div className="space-y-2"><Label>Sorteer</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Stripe prijs ID (maand)</Label><Input value={form.stripe_monthly_price_id} onChange={(e) => setForm({ ...form, stripe_monthly_price_id: e.target.value })} placeholder="price_..." /></div>
              <div className="space-y-2"><Label>Stripe prijs ID (jaar)</Label><Input value={form.stripe_yearly_price_id} onChange={(e) => setForm({ ...form, stripe_yearly_price_id: e.target.value })} placeholder="price_..." /></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Actief</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} /><Label>Publiek zichtbaar</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Aanbevolen</Label></div>
            </div>
            <div className="space-y-2"><Label>Features (JSON array van strings)</Label><Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="font-mono text-xs min-h-[100px]" /></div>
            <div className="space-y-2"><Label>Limieten (JSON object)</Label><Textarea value={form.limits} onChange={(e) => setForm({ ...form, limits: e.target.value })} className="font-mono text-xs min-h-[200px]" /></div>
            <div className="space-y-2"><Label>Interne notities</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuleren</Button>
            <Button onClick={save}>{selected ? "Opslaan" : "Aanmaken"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
