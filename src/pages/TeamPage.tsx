import { Users, Plus, Shield, Mail, MoreHorizontal, Crown, Pencil, UserMinus } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const teamMembers = [
  { name: "Jan de Vries", email: "jan@cafedekroeg.nl", role: "owner" as const, initials: "JD", isYou: true },
  { name: "Lisa Bakker", email: "lisa@cafedekroeg.nl", role: "editor" as const, initials: "LB", isYou: false },
];

const pendingInvites = [
  { email: "mark@cafedekroeg.nl", role: "marketer" as const, sentAt: "2 dagen geleden" },
];

const roleDescriptions: Record<string, string> = {
  owner: "Volledige toegang, facturatie, teamleden",
  admin: "Alles behalve facturatie",
  editor: "Events, media, categorieën beheren",
  marketer: "Events bekijken en verspreiden",
  viewer: "Alleen inzien",
};

export default function TeamPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.team.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{teamMembers.length} leden · 1 uitnodiging</p>
        </div>
        <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
          <Plus className="w-4 h-4" />{t.team.invite}
        </Button>
      </div>

      {/* Role overview */}
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

      {/* Active members */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actieve leden</h2>
        <div className="space-y-2">
          {teamMembers.map((m, i) => (
            <motion.div
              key={m.email}
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
                  <p className="font-medium text-foreground text-sm">{m.name}</p>
                  {m.isYou && <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">Jij</span>}
                </div>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center gap-1">
                {m.role === "owner" && <Crown className="w-3 h-3" />}
                {t.team.roles[m.role]}
              </span>
              {!m.isYou && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Rol wijzigen</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive"><UserMinus className="w-4 h-4 mr-2" />Verwijderen</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Openstaande uitnodigingen</h2>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.email} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-dashed border-border">
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">Verstuurd {inv.sentAt}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-highlight/10 text-highlight-foreground">
                  {t.team.roles[inv.role]}
                </span>
                <Button variant="ghost" size="sm" className="text-xs">Opnieuw sturen</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <UpgradeBanner feature="Meer teamleden (tot 10) & geavanceerde rollen" plan="Pro" compact />
    </div>
  );
}
