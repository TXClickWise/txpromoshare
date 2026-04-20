import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollText, Search, Eye, X } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";

interface AuditRow {
  id: string; tenant_id: string; tenant_name: string;
  entity_type: string; action: string; entity_id: string | null;
  user_id: string | null; metadata: any; created_at: string;
}

const DATE_RANGES = [
  { value: "all", label: "Alle datums" },
  { value: "today", label: "Vandaag" },
  { value: "7d", label: "Laatste 7 dagen" },
  { value: "30d", label: "Laatste 30 dagen" },
  { value: "90d", label: "Laatste 90 dagen" },
];

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("30d");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<AuditRow | null>(null);

  useEffect(() => {
    async function fetch() {
      const [auditRes, tenantsRes] = await Promise.all([
        supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("tenants").select("id, name"),
      ]);
      const tMap: Record<string, string> = {};
      (tenantsRes.data || []).forEach((t) => { tMap[t.id] = t.name; });
      setItems((auditRes.data || []).map((a: any) => ({ ...a, tenant_name: tMap[a.tenant_id] || "Onbekend" })));
      setLoading(false);
    }
    fetch();
  }, []);

  const dateThreshold = useMemo(() => {
    if (dateFilter === "all") return null;
    if (dateFilter === "today") return startOfDay(new Date());
    const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90;
    return subDays(new Date(), days);
  }, [dateFilter]);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      const matchSearch = !search ||
        a.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
        a.action.toLowerCase().includes(search.toLowerCase()) ||
        a.entity_type.toLowerCase().includes(search.toLowerCase()) ||
        (a.entity_id && a.entity_id.toLowerCase().includes(search.toLowerCase()));
      const matchType = typeFilter === "all" || a.entity_type === typeFilter;
      const matchAction = actionFilter === "all" || a.action === actionFilter;
      const matchDate = !dateThreshold || new Date(a.created_at) >= dateThreshold;
      return matchSearch && matchType && matchAction && matchDate;
    });
  }, [items, search, typeFilter, actionFilter, dateThreshold]);

  const entityTypes = useMemo(() => [...new Set(items.map((i) => i.entity_type))].sort(), [items]);
  const actions = useMemo(() => [...new Set(items.map((i) => i.action))].sort(), [items]);
  const hasActiveFilters = search || typeFilter !== "all" || actionFilter !== "all" || dateFilter !== "30d";

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setActionFilter("all");
    setDateFilter("30d");
  }

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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Volledige geschiedenis van platformwijzigingen — <span className="font-medium text-foreground">{filtered.length}</span> van {items.length} items
          </p>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-xs">
            <X className="w-3.5 h-3.5" /> Filters wissen
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op tenant, actie, type of entity ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            {entityTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Actie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle acties</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Datum</TableHead>
                <TableHead>Organisatie</TableHead>
                <TableHead className="w-[130px]">Type</TableHead>
                <TableHead className="w-[130px]">Actie</TableHead>
                <TableHead className="w-[110px]">Entity ID</TableHead>
                <TableHead className="text-right w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Geen audit items gevonden met de huidige filters
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((a) => (
                <TableRow key={a.id} className="group cursor-pointer" onClick={() => viewDetail(a)}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                    {format(new Date(a.created_at), "d MMM yy HH:mm", { locale: nl })}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{a.tenant_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] capitalize">{a.entity_type}</Badge></TableCell>
                  <TableCell><Badge variant={actionColor(a.action) as any} className="text-[10px] capitalize">{a.action}</Badge></TableCell>
                  <TableCell className="text-[10px] text-muted-foreground font-mono">{a.entity_id ? a.entity_id.slice(0, 8) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                      <Eye className="w-3.5 h-3.5" />
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
