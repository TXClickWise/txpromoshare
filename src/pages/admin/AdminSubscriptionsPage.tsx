import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface SubRow {
  id: string;
  tenant_name: string;
  plan_id: string;
  status: string;
  created_at: string;
  current_period_end: string | null;
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [subsRes, tenantsRes] = await Promise.all([
        supabase.from("subscriptions").select("id, tenant_id, plan_id, status, created_at, current_period_end"),
        supabase.from("tenants").select("id, name"),
      ]);

      const tenantMap: Record<string, string> = {};
      (tenantsRes.data || []).forEach((t) => { tenantMap[t.id] = t.name; });

      setSubs((subsRes.data || []).map((s) => ({
        id: s.id,
        tenant_name: tenantMap[s.tenant_id] || "Onbekend",
        plan_id: s.plan_id,
        status: s.status,
        created_at: s.created_at,
        current_period_end: s.current_period_end,
      })));
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Abonnementen</h1>
        <p className="text-muted-foreground mt-1">{subs.length} abonnement{subs.length !== 1 ? "en" : ""}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisatie</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gestart</TableHead>
                <TableHead>Verloopt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nog geen abonnementen
                  </TableCell>
                </TableRow>
              )}
              {subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.tenant_name}</TableCell>
                  <TableCell>
                    <Badge variant={s.plan_id === "pro" ? "default" : s.plan_id === "basic" ? "secondary" : "outline"} className="capitalize">
                      {s.plan_id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "default" : "destructive"} className="capitalize">
                      {s.status === "active" ? "Actief" : s.status}
                    </Badge>
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
