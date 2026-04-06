import { LinkIcon, MessageCircle, Code2, Share2, Mail, QrCode } from "lucide-react";
import { toast } from "sonner";

interface ChannelBarProps {
  shareUrl: string;
  whatsappText: string;
  onChannelClick?: (channel: string) => void;
}

const channels = [
  { id: "link", icon: LinkIcon, label: "Deel link", color: "text-primary", bg: "bg-primary/10", hoverBg: "hover:bg-primary/15" },
  { id: "whatsapp", icon: MessageCircle, label: "WhatsApp", color: "text-accent", bg: "bg-accent/10", hoverBg: "hover:bg-accent/15" },
  { id: "embed", icon: Code2, label: "Embed", color: "text-primary", bg: "bg-primary/10", hoverBg: "hover:bg-primary/15" },
  { id: "social", icon: Share2, label: "Social", color: "text-primary", bg: "bg-primary/10", hoverBg: "hover:bg-primary/15" },
  { id: "email", icon: Mail, label: "E-mail", color: "text-muted-foreground", bg: "bg-secondary", hoverBg: "hover:bg-secondary/80" },
  { id: "qr", icon: QrCode, label: "QR-code", color: "text-muted-foreground", bg: "bg-secondary", hoverBg: "hover:bg-secondary/80" },
];

export function ChannelBar({ shareUrl, whatsappText, onChannelClick }: ChannelBarProps) {
  const handleClick = (channelId: string) => {
    if (channelId === "link") {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link gekopieerd naar klembord");
    } else if (channelId === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank");
    } else if (channelId === "email") {
      toast.info("E-mail distributie is binnenkort beschikbaar", { description: "Beschikbaar in het Pro plan" });
    } else if (channelId === "qr") {
      toast.info("QR-code generator is binnenkort beschikbaar", { description: "Beschikbaar in het Pro plan" });
    }
    onChannelClick?.(channelId);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {channels.map((ch) => (
        <button
          key={ch.id}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card ${ch.hoverBg} transition-all cursor-pointer`}
          onClick={() => handleClick(ch.id)}
        >
          <ch.icon className={`w-5 h-5 ${ch.color}`} />
          <span className="text-[10px] font-medium text-foreground">{ch.label}</span>
        </button>
      ))}
    </div>
  );
}
