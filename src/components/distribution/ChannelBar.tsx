import { LinkIcon, Code2, Mail, QrCode } from "lucide-react";
import { toast } from "sonner";

interface ChannelBarProps {
  shareUrl: string;
  whatsappText: string;
  socialText: string;
  eventTitle: string;
  eventImageUrl?: string;
  onChannelClick?: (channel: string) => void;
  onShowQR?: () => void;
}

async function nativeShareWithImage(text: string, imageUrl?: string) {
  if (!imageUrl || !navigator.canShare) {
    navigator.clipboard.writeText(text);
    toast.success("Tekst gekopieerd — plak in de app");
    return;
  }
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const file = new File([blob], `event.${ext}`, { type: blob.type });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ text, files: [file] });
      return;
    }
  } catch {
    // fallback
  }
  navigator.clipboard.writeText(text);
  toast.success("Tekst gekopieerd — plak in de app");
}

export function ChannelBar({ shareUrl, whatsappText, socialText, eventTitle, eventImageUrl, onChannelClick, onShowQR }: ChannelBarProps) {
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
      case "instagram":
        nativeShareWithImage(socialText, eventImageUrl);
        break;
      case "tiktok":
        nativeShareWithImage(socialText, eventImageUrl);
        break;
      case "gbp":
        nativeShareWithImage(socialText, eventImageUrl);
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

  const ImgIcon = ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} className="w-5 h-5 rounded" />;

  const channels = [
    { id: "link", icon: LinkIcon, label: "Kopieer link", accent: "bg-primary/10 text-primary hover:bg-primary/20" },
    { id: "whatsapp", icon: () => <ImgIcon src="/images/whatsapp-icon.png" alt="WhatsApp" />, label: "WhatsApp", accent: "bg-green-500/10 text-green-600 hover:bg-green-500/20" },
    { id: "facebook", icon: () => <ImgIcon src="/images/facebook-icon.png" alt="Facebook" />, label: "Facebook", accent: "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20" },
    { id: "instagram", icon: () => <ImgIcon src="/images/instagram-icon.png" alt="Instagram" />, label: "Instagram", accent: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20" },
    { id: "tiktok", icon: () => <ImgIcon src="/images/tiktok-icon.png" alt="TikTok" />, label: "TikTok", accent: "bg-foreground/5 text-foreground hover:bg-foreground/10" },
    { id: "gbp", icon: () => <ImgIcon src="/images/google-icon.png" alt="Google" />, label: "Google", accent: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
    { id: "email", icon: Mail, label: "E-mail", accent: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" },
    { id: "qr", icon: QrCode, label: "QR-code", accent: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20" },
  ];

  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-card">
      <p className="text-xs font-medium text-muted-foreground mb-3">Snel delen via:</p>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
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
