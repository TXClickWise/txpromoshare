import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollText, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface AuditRow {
  id: string; tenant_id: string; tenant_name: string;
  entity_type: string; action: string; entity_id: string | null;
  user_id: string | null; metadata: any; created_at: string;
}

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<AuditRow | null>(null);

  useEffect(() => {
    async function fetch() {
      const [auditRes, tenantsRes] = await Promise.all([
        supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("tenants").select("id, name"),
      ]);
      const tMap: Record<string, string> = {};
      (tenantsRes.data || []).forEach((t) => { tMap[t.id] = t.name; });
      setItems((auditRes.data || []).map((a: any) => ({ ...a, tenant_name: tMap[a.tenant_id] || "Onbekend" })));
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      const matchSearch = !search ||
        a.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
        a.action.toLowerCase().includes(search.toLowerCase()) ||
        a.entity_type.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || a.entity_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [items, search, typeFilter]);

  const entityTypes = [...new Set(items.map((i) => i.entity_type))];

  function viewDetail(item: AuditRow) {
    setSelected(item);
    setDetailOpen(true);
  }

  const actionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "default";
    if (action.includes("delete") || action.includes("remove") || action.includes("revert")) return "destructive";
    if (action.includes("edit") || action.includes("update") || action.includes("change")) return "secondary";
    return "outline";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground mt-1">Volledige geschiedenis van platformwijzigingen</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek in audit log..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            {entityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Organisatie</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actie</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Geen audit items gevonden
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((a) => (
                <TableRow key={a.id} className="group">
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(a.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                  </TableCell>
                  <TableCell className="text-sm">{a.tenant_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{a.entity_type}</Badge></TableCell>
                  <TableCell><Badge variant={actionColor(a.action) as any} className="text-xs capitalize">{a.action}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{a.entity_id ? a.entity_id.slice(0, 8) + "..." : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => viewDetail(a)} className="opacity-0 group-hover:opacity-100">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Audit Detail</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Datum</span><p className="font-medium">{format(new Date(selected.created_at), "d MMM yyyy HH:mm:ss", { locale: nl })}</p></div>
                <div><span className="text-muted-foreground">Organisatie</span><p className="font-medium">{selected.tenant_name}</p></div>
                <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{selected.entity_type}</p></div>
                <div><span className="text-muted-foreground">Actie</span><p className="font-medium capitalize">{selected.action}</p></div>
                <div><span className="text-muted-foreground">Entity ID</span><p className="font-medium font-mono text-xs">{selected.entity_id || "—"}</p></div>
                <div><span className="text-muted-foreground">User ID</span><p className="font-medium font-mono text-xs">{selected.user_id || "—"}</p></div>
              </div>
              <div>
                <span className="text-muted-foreground">Metadata</span>
                <pre className="mt-1 p-3 rounded-lg bg-secondary/50 border border-border text-xs overflow-auto max-h-[300px]">
                  {selected.metadata ? JSON.stringify(selected.metadata, null, 2) : "Geen metadata"}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
