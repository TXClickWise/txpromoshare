import { LinkIcon, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useUILanguage";

interface ShareLinkCardProps {
  url: string;
  eventId: string;
}

export function ShareLinkCard({ url, eventId }: ShareLinkCardProps) {
  const { t } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success(t("share.linkCopied"));
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyId = () => {
    navigator.clipboard.writeText(eventId);
    setCopiedId(true);
    toast.success(t("share.eventIdCopied"));
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-foreground text-sm">{t("share.publicLink")}</h3>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{t("share.eventUrl")}</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-secondary p-2.5 rounded-lg text-muted-foreground overflow-x-auto font-mono">{url}</code>
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 h-9">
              {copiedLink ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors mt-1">
            <ExternalLink className="w-3.5 h-3.5" />{t("share.viewPublic")}
          </a>
        </div>

        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{t("share.eventId")} <span className="normal-case">{t("share.eventIdHint")}</span></p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-secondary p-2.5 rounded-lg text-muted-foreground overflow-x-auto font-mono">{eventId}</code>
            <Button variant="outline" size="sm" onClick={copyId} className="shrink-0 h-9">
              {copiedId ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
