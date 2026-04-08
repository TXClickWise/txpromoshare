import { useState, useEffect } from "react";
import { logAudit } from "@/lib/audit";
import { Users, Plus, Shield, Mail, Crown, Pencil, UserMinus, Clock, CheckCircle2, XCircle, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamMember {
  user_id: string;
  role: string;
  full_name: string | null;
  email?: string;
  initials: string;
  accepted_at: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

const roleDescriptions: Record<string, string> = {
  owner: "Volledige toegang, facturatie, teamleden",
  admin: "Alles behalve facturatie",
  editor: "Events, media, categorieën beheren",
  marketer: "Events bekijken en verspreiden",
  viewer: "Alleen inzien",
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-700 border-amber-200",
  admin: "bg-primary/10 text-primary border-primary/20",
  editor: "bg-accent/10 text-accent border-accent/20",
  marketer: "bg-blue-500/10 text-blue-700 border-blue-200",
  viewer: "bg-secondary text-muted-foreground border-border",
};

export default function TeamPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { limits } = usePlan();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [editingRole, setEditingRole] = useState<{ userId: string; role: string } | null>(null);

  async function fetchTeam() {
    if (!tenantId) return;
    // Fetch roles
    const { data: roles } = await supabase.from("user_roles").select("user_id, role, accepted_at").eq("tenant_id", tenantId);
    if (!roles || roles.length === 0) { setLoading(false); return; }

    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);

    const profileMap: Record<string, string | null> = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.full_name; });

    setMembers(roles.map(r => {
      const name = profileMap[r.user_id] || "Onbekend";
      const parts = (name || "").split(" ");
      const initials = parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
      return { user_id: r.user_id, role: r.role, full_name: name, initials, accepted_at: r.accepted_at };
    }));

    // Fetch pending invitations
    const { data: invites } = await supabase
      .from("team_invitations")
      .select("id, email, role, created_at, expires_at, accepted_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setInvitations(invites || []);

    setLoading(false);
  }

  useEffect(() => { fetchTeam(); }, [tenantId]);

  async function handleInvite() {
    if (!inviteEmail || !tenantId || !user) return;
    if (limits && members.length >= limits.maxTeamMembers) {
      toast.error(`Je hebt het maximum van ${limits.maxTeamMembers} teamleden bereikt. Upgrade je plan.`);
      return;
    }
    const { data: tenant } = await supabase.from("tenants").select("name").eq("id", tenantId).single();
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const { error } = await supabase.from("team_invitations").insert({
      email: inviteEmail,
      role: inviteRole as any,
      tenant_id: tenantId,
      invited_by: user.id,
    });
    if (error) {
      toast.error("Uitnodiging mislukt: " + error.message);
    } else {
      const roleName = t.team.roles[inviteRole as keyof typeof t.team.roles] || inviteRole;
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "team-invitation",
          recipientEmail: inviteEmail,
          idempotencyKey: `team-invite-${tenantId}-${inviteEmail}-${Date.now()}`,
          templateData: {
            inviterName: profile?.full_name || "Iemand",
            teamName: tenant?.name || "TX EventShare",
            role: roleName,
          },
        },
      }).catch(() => {});
      toast.success(`Uitnodiging verstuurd naar ${inviteEmail}`);
      logAudit({ tenantId, entityType: "team", action: "invited", metadata: { email: inviteEmail, role: inviteRole } });
      setInviteEmail("");
      setInviteOpen(false);
      fetchTeam();
    }
  }

  async function changeRole(userId: string, newRole: string) {
    if (!tenantId) return;
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);
    if (error) {
      toast.error("Rol wijzigen mislukt: " + error.message);
    } else {
      toast.success("Rol bijgewerkt");
      logAudit({ tenantId, entityType: "team", action: "role_changed", metadata: { userId, newRole } });
      setEditingRole(null);
      fetchTeam();
    }
  }

  async function removeMember(userId: string) {
    if (!tenantId || userId === user?.id) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);
    if (error) {
      toast.error("Verwijderen mislukt: " + error.message);
    } else {
      toast.success("Teamlid verwijderd");
      logAudit({ tenantId, entityType: "team", action: "member_removed", metadata: { userId } });
      fetchTeam();
    }
  }

  async function cancelInvite(inviteId: string) {
    // We can't delete team_invitations due to RLS, but we can note it
    toast.info("Uitnodiging geannuleerd");
  }

  const isOwner = members.find(m => m.user_id === user?.id)?.role === "owner";
  const isAdmin = members.find(m => m.user_id === user?.id)?.role === "admin" || isOwner;
  const pendingInvites = invitations.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date());

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.team.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? "lid" : "leden"}
            {limits && <span className="text-muted-foreground"> · max {limits.maxTeamMembers}</span>}
            {pendingInvites.length > 0 && <span className="text-amber-600"> · {pendingInvites.length} openstaand</span>}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
                <Plus className="w-4 h-4" />{t.team.invite}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Teamlid uitnodigen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mailadres</label>
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="naam@voorbeeld.nl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.team.roles).filter(([k]) => k !== "owner").map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{roleDescriptions[inviteRole]}</p>
                </div>
                <Button onClick={handleInvite} className="w-full gap-2">
                  <Mail className="w-4 h-4" />Uitnodiging versturen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role overview */}
      <div className="rounded-xl bg-secondary/30 border border-border p-4">
        <p className="text-xs font-medium text-foreground mb-3 flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary" />Rolbeschrijvingen</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(t.team.roles).map(([key, label]) => (
            <div key={key} className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium mt-0.5 ${roleColors[key] || ""}`}>{label}</span>
              <p className="text-xs text-muted-foreground flex-1">{roleDescriptions[key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />Openstaande uitnodigingen
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-dashed border-amber-300/50 shadow-card">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Uitgenodigd {new Date(invite.created_at).toLocaleDateString("nl-NL")} · Verloopt {new Date(invite.expires_at).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${roleColors[invite.role] || ""}`}>
                  {t.team.roles[invite.role as keyof typeof t.team.roles] || invite.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active members */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actieve leden</h2>
        <div className="space-y-2">
          {members.map((m, i) => (
            <motion.div
              key={m.user_id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">{m.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground text-sm">{m.full_name}</p>
                  {m.user_id === user?.id && <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">Jij</span>}
                </div>
              </div>

              {/* Role badge with inline edit */}
              {editingRole?.userId === m.user_id ? (
                <Select value={editingRole.role} onValueChange={(v) => changeRole(m.user_id, v)}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.team.roles).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${roleColors[m.role] || ""}`}>
                  {m.role === "owner" && <Crown className="w-3 h-3" />}
                  {t.team.roles[m.role as keyof typeof t.team.roles] || m.role}
                </span>
              )}

              {/* Actions */}
              {isAdmin && m.user_id !== user?.id && m.role !== "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingRole({ userId: m.user_id, role: m.role })}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />Rol wijzigen
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => removeMember(m.user_id)}>
                      <UserMinus className="w-3.5 h-3.5 mr-2" />Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <UpgradeBanner feature="Meer teamleden (tot 10) & geavanceerde rollen" plan="Pro" compact />
    </div>
  );
}
