import { useState, useEffect } from "react";
import { Users, Plus, Shield, Mail, MoreHorizontal, Crown, Pencil, UserMinus } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamMember {
  user_id: string;
  role: string;
  full_name: string | null;
  initials: string;
}

const roleDescriptions: Record<string, string> = {
  owner: "Volledige toegang, facturatie, teamleden",
  admin: "Alles behalve facturatie",
  editor: "Events, media, categorieën beheren",
  marketer: "Events bekijken en verspreiden",
  viewer: "Alleen inzien",
};

export default function TeamPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  useEffect(() => {
    if (!tenantId) return;
    async function fetch() {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("tenant_id", tenantId!);
      if (!roles || roles.length === 0) { setLoading(false); return; }

      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);

      const profileMap: Record<string, string | null> = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p.full_name; });

      setMembers(roles.map(r => {
        const name = profileMap[r.user_id] || "Onbekend";
        const parts = (name || "").split(" ");
        const initials = parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
        return { user_id: r.user_id, role: r.role, full_name: name, initials };
      }));
      setLoading(false);
    }
    fetch();
  }, [tenantId]);

  async function handleInvite() {
    if (!inviteEmail || !tenantId || !user) return;
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
      // Send team invitation email
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
      setInviteEmail("");
      setInviteOpen(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.team.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{members.length} leden</p>
        </div>
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
      </div>

      <div className="rounded-xl bg-secondary/30 border border-border p-4">
        <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary" />Rollen in jouw team</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(t.team.roles).map(([key, label]) => (
            <div key={key} className="text-xs">
              <span className="font-medium text-foreground">{label}</span>
              <p className="text-muted-foreground text-[11px]">{roleDescriptions[key]}</p>
            </div>
          ))}
        </div>
      </div>

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
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center gap-1">
                {m.role === "owner" && <Crown className="w-3 h-3" />}
                {t.team.roles[m.role as keyof typeof t.team.roles] || m.role}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <UpgradeBanner feature="Meer teamleden (tot 10) & geavanceerde rollen" plan="Pro" compact />
    </div>
  );
}
