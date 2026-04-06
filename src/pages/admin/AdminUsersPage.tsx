import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface UserRow {
  id: string;
  full_name: string | null;
  created_at: string;
  roles: { tenant_name: string; role: string }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [profilesRes, rolesRes, tenantsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, tenant_id, role"),
        supabase.from("tenants").select("id, name"),
      ]);

      const tenantMap: Record<string, string> = {};
      (tenantsRes.data || []).forEach((t) => { tenantMap[t.id] = t.name; });

      const rolesByUser: Record<string, { tenant_name: string; role: string }[]> = {};
      (rolesRes.data || []).forEach((r) => {
        if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
        rolesByUser[r.user_id].push({ tenant_name: tenantMap[r.tenant_id] || "Onbekend", role: r.role });
      });

      setUsers((profilesRes.data || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        created_at: p.created_at,
        roles: rolesByUser[p.id] || [],
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
        <h1 className="text-2xl font-display font-bold text-foreground">Gebruikers</h1>
        <p className="text-muted-foreground mt-1">{users.length} gebruiker{users.length !== 1 ? "s" : ""} op het platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Organisatie(s)</TableHead>
                <TableHead>Rol(len)</TableHead>
                <TableHead>Geregistreerd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nog geen gebruikers
                  </TableCell>
                </TableRow>
              )}
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "Onbekend"}</TableCell>
                  <TableCell className="text-sm">
                    {u.roles.length === 0 ? <span className="text-muted-foreground">—</span> : u.roles.map((r) => r.tenant_name).join(", ")}
                  </TableCell>
                  <TableCell>
                    {u.roles.length === 0 ? <span className="text-muted-foreground">—</span> : (
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r, i) => (
                          <Badge key={i} variant="outline" className="capitalize text-xs">{r.role}</Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(u.created_at), "d MMM yyyy", { locale: nl })}
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
