import { Users, Plus, Shield, Mail } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const teamMembers = [
  { name: "Jan de Vries", email: "jan@cafedekroeg.nl", role: "owner" as const, initials: "JD" },
  { name: "Lisa Bakker", email: "lisa@cafedekroeg.nl", role: "editor" as const, initials: "LB" },
];

export default function TeamPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">{t.team.title}</h1>
        <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
          <Plus className="w-4 h-4" />{t.team.invite}
        </Button>
      </div>
      <div className="space-y-2">
        {teamMembers.map((m) => (
          <div key={m.email} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-xs font-bold text-secondary-foreground">{m.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {t.team.roles[m.role]}
            </span>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Basic plan:</strong> Maximaal 3 teamleden. <a href="/app/billing" className="text-primary hover:underline">Upgrade naar Pro</a> voor meer.
        </p>
      </div>
    </div>
  );
}
