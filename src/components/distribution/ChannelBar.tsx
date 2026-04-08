import { LinkIcon, MessageCircle, Code2, Facebook, Twitter, Mail, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ChannelBarProps {
  shareUrl: string;
  whatsappText: string;
  socialText: string;
  eventTitle: string;
  onChannelClick?: (channel: string) => void;
  onShowQR?: () => void;
}

export function ChannelBar({ shareUrl, whatsappText, socialText, eventTitle, onChannelClick, onShowQR }: ChannelBarProps) {
  const handleClick = (channelId: string) => {
    switch (channelId) {
      case "link":
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link gekopieerd naar klembord");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(socialText)}`, "_blank");
        break;
      case "x":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(socialText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
        break;
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent(eventTitle)}&body=${encodeURIComponent(`${socialText}\n\n${shareUrl}`)}`, "_blank");
        break;
      case "qr":
        onShowQR?.();
        break;
    }
    onChannelClick?.(channelId);
  };

  const channels = [
    { id: "link", icon: LinkIcon, label: "Kopieer link", accent: "bg-primary/10 text-primary hover:bg-primary/20" },
    { id: "whatsapp", icon: MessageCircle, label: "WhatsApp", accent: "bg-green-500/10 text-green-600 hover:bg-green-500/20" },
    { id: "facebook", icon: Facebook, label: "Facebook", accent: "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20" },
    { id: "x", icon: Twitter, label: "X / Twitter", accent: "bg-foreground/5 text-foreground hover:bg-foreground/10" },
    { id: "email", icon: Mail, label: "E-mail", accent: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" },
    { id: "qr", icon: QrCode, label: "QR-code", accent: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20" },
  ];

  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-card">
      <p className="text-xs font-medium text-muted-foreground mb-3">Snel delen via:</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {channels.map((ch) => (
          <button
            key={ch.id}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border transition-all cursor-pointer ${ch.accent}`}
            onClick={() => handleClick(ch.id)}
          >
            <ch.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{ch.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
