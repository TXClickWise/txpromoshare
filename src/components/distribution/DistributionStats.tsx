import { LinkIcon, MessageCircle, Code2, Share2, Mail, BarChart3 } from "lucide-react";

interface DistributionStatsProps {
  stats: { channel: string; count: number }[];
}

const channelMeta: Record<string, { icon: typeof LinkIcon; label: string; color: string; bg: string }> = {
  link: { icon: LinkIcon, label: "Link gedeeld", color: "text-primary", bg: "bg-primary/10" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-green-600", bg: "bg-green-500/10" },
  facebook: { icon: Share2, label: "Facebook", color: "text-blue-600", bg: "bg-blue-600/10" },
  x: { icon: Share2, label: "X / Twitter", color: "text-foreground", bg: "bg-foreground/5" },
  embed: { icon: Code2, label: "Widget views", color: "text-primary", bg: "bg-primary/10" },
  social: { icon: Share2, label: "Social", color: "text-primary", bg: "bg-primary/10" },
  email: { icon: Mail, label: "E-mail", color: "text-orange-600", bg: "bg-orange-500/10" },
};

export function DistributionStats({ stats }: DistributionStatsProps) {
  const total = stats.reduce((sum, s) => sum + s.count, 0);

  if (stats.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-card border border-border text-center">
        <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-display font-semibold text-foreground text-sm mb-1">Nog geen activiteit</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Zodra je dit evenement deelt via een van de kanalen hierboven, verschijnen hier de statistieken.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-card border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground text-sm">Deelactiviteit</h3>
          <span className="text-xs text-muted-foreground">{total} totaal</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => {
            const meta = channelMeta[s.channel] || channelMeta.link;
            const Icon = meta.icon;
            return (
              <div key={s.channel} className={`p-3 rounded-xl ${meta.bg} text-center`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${meta.color}`} />
                <div className="text-lg font-display font-bold text-foreground">{s.count}</div>
                <div className="text-xs text-muted-foreground">{meta.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
