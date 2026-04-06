import { LinkIcon, MessageCircle, Code2, Share2 } from "lucide-react";

interface DistributionStatsProps {
  stats: { channel: string; count: number }[];
}

const channelMeta: Record<string, { icon: typeof LinkIcon; label: string; color: string }> = {
  link: { icon: LinkIcon, label: "Link gedeeld", color: "text-primary" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-accent" },
  embed: { icon: Code2, label: "Widget views", color: "text-primary" },
  social: { icon: Share2, label: "Social", color: "text-primary" },
};

export function DistributionStats({ stats }: DistributionStatsProps) {
  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => {
        const meta = channelMeta[s.channel] || channelMeta.link;
        const Icon = meta.icon;
        return (
          <div key={s.channel} className="p-3 rounded-xl bg-card border border-border text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${meta.color}`} />
            <div className="text-lg font-display font-bold text-foreground">{s.count}</div>
            <div className="text-[10px] text-muted-foreground">{meta.label}</div>
          </div>
        );
      })}
    </div>
  );
}
