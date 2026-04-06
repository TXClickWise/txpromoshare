import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan_id: string;
  email: string | null;
  created_at: string;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("tenants").select("id, name, slug, plan_id, email, created_at").order("created_at", { ascending: false }).then(({ data }) => {
      setTenants(data || []);
      setLoading(false);
    });
  }, []);

  const planColor = (plan: string) => {
    if (plan === "pro") return "default";
    if (plan === "basic") return "secondary";
    return "outline";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Organisaties</h1>
        <p className="text-muted-foreground mt-1">{tenants.length} organisatie{tenants.length !== 1 ? "s" : ""} geregistreerd</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Aangemaakt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nog geen organisaties
                  </TableCell>
                </TableRow>
              )}
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{t.slug}</TableCell>
                  <TableCell>
                    <Badge variant={planColor(t.plan_id) as any} className="capitalize">{t.plan_id}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.email || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(t.created_at), "d MMM yyyy", { locale: nl })}
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
