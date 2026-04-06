import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Search } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface SubRow {
  id: string; tenant_id: string; tenant_name: string;
  plan_id: string; status: string; created_at: string;
  current_period_end: string | null; stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetch() {
      const [subsRes, tenantsRes] = await Promise.all([
        supabase.from("subscriptions").select("*"),
        supabase.from("tenants").select("id, name"),
      ]);
      const tMap: Record<string, string> = {};
      (tenantsRes.data || []).forEach((t) => { tMap[t.id] = t.name; });
      setSubs((subsRes.data || []).map((s: any) => ({
        ...s, tenant_name: tMap[s.tenant_id] || "Onbekend",
      })));
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      const matchSearch = !search || s.tenant_name.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === "all" || s.plan_id === planFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [subs, search, planFilter, statusFilter]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Abonnementen</h1>
        <p className="text-muted-foreground mt-1">{subs.length} abonnement{subs.length !== 1 ? "en" : ""}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek organisatie..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle plannen</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="active">Actief</SelectItem>
            <SelectItem value="canceled">Geannuleerd</SelectItem>
            <SelectItem value="past_due">Achterstallig</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisatie</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stripe Customer</TableHead>
                <TableHead>Gestart</TableHead>
                <TableHead>Verloopt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Geen abonnementen gevonden
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.tenant_name}</TableCell>
                  <TableCell>
                    <Badge variant={s.plan_id === "pro" ? "default" : s.plan_id === "basic" ? "secondary" : "outline"} className="capitalize">{s.plan_id}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "default" : "destructive"} className="capitalize">
                      {s.status === "active" ? "Actief" : s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {s.stripe_customer_id || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(s.created_at), "d MMM yyyy", { locale: nl })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.current_period_end ? format(new Date(s.current_period_end), "d MMM yyyy", { locale: nl }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
