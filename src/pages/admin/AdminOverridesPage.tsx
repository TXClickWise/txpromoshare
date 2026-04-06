import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowUpDown, Plus, Undo2, Search } from "lucide-react";
import { format, addWeeks, addMonths } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface OverrideRow {
  id: string; tenant_id: string; tenant_name: string;
  original_plan_slug: string; override_plan_slug: string;
  started_at: string; ends_at: string | null; reason: string | null;
  is_active: boolean; reverted_at: string | null;
}

export default function AdminOverridesPage() {
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string; plan_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    tenant_id: "", override_plan: "pro", duration: "1_month", custom_date: "", reason: "",
  });

  async function fetchData() {
    const [ovRes, tenRes] = await Promise.all([
      supabase.from("plan_overrides").select("*").order("created_at", { ascending: false }),
      supabase.from("tenants").select("id, name, plan_id").order("name"),
    ]);
    const tMap: Record<string, string> = {};
    (tenRes.data || []).forEach((t: any) => { tMap[t.id] = t.name; });
    setTenants((tenRes.data || []) as any);
    setOverrides((ovRes.data || []).map((o: any) => ({ ...o, tenant_name: tMap[o.tenant_id] || "Onbekend" })));
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return overrides.filter((o) => {
      const matchSearch = !search || o.tenant_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || (statusFilter === "active" && o.is_active) || (statusFilter === "expired" && !o.is_active);
      return matchSearch && matchStatus;
    });
  }, [overrides, search, statusFilter]);

  async function createOverride() {
    if (!form.tenant_id) { toast.error("Selecteer een organisatie"); return; }
    const tenant = tenants.find((t) => t.id === form.tenant_id);
    if (!tenant) return;

    let ends_at: string | null = null;
    const now = new Date();
    if (form.duration === "1_week") ends_at = addWeeks(now, 1).toISOString();
    else if (form.duration === "1_month") ends_at = addMonths(now, 1).toISOString();
    else if (form.duration === "custom" && form.custom_date) ends_at = new Date(form.custom_date).toISOString();
    // "no_end" => null

    const { data: { user } } = await supabase.auth.getUser();

    // Deactivate any existing active overrides for this tenant
    await supabase.from("plan_overrides").update({ is_active: false, reverted_at: now.toISOString() } as any)
      .eq("tenant_id", form.tenant_id).eq("is_active", true);

    const { error } = await supabase.from("plan_overrides").insert({
      tenant_id: form.tenant_id,
      original_plan_slug: tenant.plan_id,
      override_plan_slug: form.override_plan,
      ends_at,
      reason: form.reason || null,
      performed_by: user?.id || null,
      is_active: true,
    } as any);

    if (error) { toast.error(error.message); return; }

    // Log in audit
    await supabase.from("audit_log").insert({
      tenant_id: form.tenant_id, entity_type: "plan_override", action: "create",
      metadata: { original: tenant.plan_id, override: form.override_plan, duration: form.duration, ends_at, reason: form.reason } as any,
    });

    toast.success(`Override aangemaakt: ${tenant.name} → ${form.override_plan}`);
    setCreateOpen(false);
    fetchData();
  }

  async function revertOverride(o: OverrideRow) {
    const { error } = await supabase.from("plan_overrides").update({
      is_active: false, reverted_at: new Date().toISOString(),
    } as any).eq("id", o.id);
    if (error) { toast.error(error.message); return; }

    await supabase.from("audit_log").insert({
      tenant_id: o.tenant_id, entity_type: "plan_override", action: "revert",
      metadata: { override_id: o.id, original: o.original_plan_slug, override: o.override_plan_slug } as any,
    });

    toast.success("Override teruggedraaid");
    fetchData();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Plan Overrides</h1>
          <p className="text-muted-foreground mt-1">Tijdelijke plan-upgrades en admin overrides</p>
        </div>
        <Button onClick={() => { setForm({ tenant_id: "", override_plan: "pro", duration: "1_month", custom_date: "", reason: "" }); setCreateOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nieuwe Override
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek organisatie..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alles</SelectItem>
            <SelectItem value="active">Actief</SelectItem>
            <SelectItem value="expired">Verlopen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisatie</TableHead>
                <TableHead>Origineel</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Einde</TableHead>
                <TableHead>Reden</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    <ArrowUpDown className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Geen overrides gevonden
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.tenant_name}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{o.original_plan_slug}</Badge></TableCell>
                  <TableCell><Badge variant="default" className="capitalize">{o.override_plan_slug}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={o.is_active ? "default" : "secondary"} className={o.is_active ? "bg-green-600" : ""}>
                      {o.is_active ? "Actief" : o.reverted_at ? "Teruggedraaid" : "Verlopen"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(o.started_at), "d MMM yyyy", { locale: nl })}</TableCell>
                  <TableCell className="text-sm">{o.ends_at ? format(new Date(o.ends_at), "d MMM yyyy", { locale: nl }) : "Onbeperkt"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{o.reason || "—"}</TableCell>
                  <TableCell className="text-right">
                    {o.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1 text-destructive"><Undo2 className="w-3 h-3" /> Terugdraaien</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Override terugdraaien?</AlertDialogTitle>
                            <AlertDialogDescription>
                              De organisatie {o.tenant_name} wordt teruggezet naar het {o.original_plan_slug} plan. Premium features worden direct beperkt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revertOverride(o)}>Terugdraaien</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Override Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nieuwe Plan Override</DialogTitle>
            <DialogDescription>Tijdelijk een organisatie upgraden naar een hoger plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Organisatie</Label>
              <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecteer organisatie..." /></SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.plan_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Override plan</Label>
              <Select value={form.override_plan} onValueChange={(v) => setForm({ ...form, override_plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duur</Label>
              <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_week">1 week</SelectItem>
                  <SelectItem value="1_month">1 maand</SelectItem>
                  <SelectItem value="no_end">Geen einddatum</SelectItem>
                  <SelectItem value="custom">Aangepaste datum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.duration === "custom" && (
              <div className="space-y-2">
                <Label>Einddatum</Label>
                <Input type="date" value={form.custom_date} onChange={(e) => setForm({ ...form, custom_date: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Reden / interne notitie</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Waarom wordt deze override aangemaakt?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuleren</Button>
            <Button onClick={createOverride}>Override aanmaken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
