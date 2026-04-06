import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Search, Pencil, Ban, CheckCircle, UserX, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  roles: { tenant_id: string; tenant_name: string; role: string }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", status: "active" });
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<any[]>([]);

  async function fetchUsers() {
    const [profilesRes, rolesRes, tenantsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, status, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, tenant_id, role"),
      supabase.from("tenants").select("id, name"),
    ]);

    const tenantMap: Record<string, string> = {};
    (tenantsRes.data || []).forEach((t) => { tenantMap[t.id] = t.name; });

    const rolesByUser: Record<string, { tenant_id: string; tenant_name: string; role: string }[]> = {};
    (rolesRes.data || []).forEach((r) => {
      if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
      rolesByUser[r.user_id].push({ tenant_id: r.tenant_id, tenant_name: tenantMap[r.tenant_id] || "Onbekend", role: r.role });
    });

    setUsers((profilesRes.data || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      status: p.status || "active",
      created_at: p.created_at,
      roles: rolesByUser[p.id] || [],
    })));
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || u.id.includes(search);
      const matchRole = roleFilter === "all" || u.roles.some((r) => r.role === roleFilter);
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  function openEdit(u: UserRow) {
    setSelected(u);
    setEditForm({ full_name: u.full_name || "", phone: u.phone || "", status: u.status });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!selected) return;
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name || null,
      phone: editForm.phone || null,
      status: editForm.status,
    } as any).eq("id", selected.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Gebruiker bijgewerkt");
    setEditOpen(false);
    fetchUsers();
  }

  async function toggleUserStatus(u: UserRow, newStatus: string) {
    const { error } = await supabase.from("profiles").update({ status: newStatus } as any).eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status gewijzigd naar ${newStatus}`);
    fetchUsers();
  }

  async function openNotes(u: UserRow) {
    setSelected(u);
    setNoteText("");
    const { data } = await supabase.from("admin_notes")
      .select("*").eq("entity_type", "user").eq("entity_id", u.id)
      .order("created_at", { ascending: false });
    setNotes(data || []);
    setNoteOpen(true);
  }

  async function addNote() {
    if (!selected || !noteText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("admin_notes").insert({
      entity_type: "user", entity_id: selected.id,
      content: noteText.trim(), created_by: user?.id || null,
    } as any);
    toast.success("Notitie toegevoegd");
    setNoteText("");
    const { data } = await supabase.from("admin_notes")
      .select("*").eq("entity_type", "user").eq("entity_id", selected.id)
      .order("created_at", { ascending: false });
    setNotes(data || []);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Gebruikers</h1>
        <p className="text-muted-foreground mt-1">{users.length} gebruiker{users.length !== 1 ? "s" : ""} op het platform</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op naam of ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle rollen</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="marketer">Marketer</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="active">Actief</SelectItem>
            <SelectItem value="blocked">Geblokkeerd</SelectItem>
            <SelectItem value="deactivated">Inactief</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Organisatie(s)</TableHead>
                <TableHead>Rol(len)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Geregistreerd</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Geen gebruikers gevonden
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((u) => (
                <TableRow key={u.id} className="group">
                  <TableCell>
                    <div className="font-medium">{u.full_name || "Onbekend"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}...</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.roles.length === 0 ? <span className="text-muted-foreground">—</span> : u.roles.map((r) => r.tenant_name).join(", ")}
                  </TableCell>
                  <TableCell>
                    {u.roles.length === 0 ? "—" : (
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r, i) => (
                          <Badge key={i} variant="outline" className="capitalize text-xs">{r.role}</Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "active" ? "default" : "destructive"} className="capitalize">
                      {u.status === "active" ? "Actief" : u.status === "blocked" ? "Geblokkeerd" : "Inactief"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(u.created_at), "d MMM yyyy", { locale: nl })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Bewerken"><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openNotes(u)} title="Notities"><StickyNote className="w-4 h-4" /></Button>
                      {u.status === "active" ? (
                        <Button variant="ghost" size="icon" onClick={() => toggleUserStatus(u, "blocked")} title="Blokkeren"><Ban className="w-4 h-4 text-destructive" /></Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => toggleUserStatus(u, "active")} title="Activeren"><CheckCircle className="w-4 h-4 text-green-600" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gebruiker bewerken</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Naam</Label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Telefoon</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="blocked">Geblokkeerd</SelectItem>
                  <SelectItem value="deactivated">Inactief</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuleren</Button>
            <Button onClick={saveEdit}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Admin Notities — {selected?.full_name || "Gebruiker"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea placeholder="Nieuwe notitie..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="min-h-[60px]" />
            <Button onClick={addNote} disabled={!noteText.trim()} size="sm">Toevoegen</Button>
            <div className="space-y-2 mt-4">
              {notes.length === 0 && <p className="text-sm text-muted-foreground">Nog geen notities</p>}
              {notes.map((n: any) => (
                <div key={n.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm whitespace-pre-wrap">{n.content}</p>
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
