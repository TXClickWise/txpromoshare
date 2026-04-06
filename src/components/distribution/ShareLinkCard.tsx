import { LinkIcon, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareLinkCardProps {
  url: string;
}

export function ShareLinkCard({ url }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link gekopieerd");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-3">
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-foreground text-sm">Publieke event link</h3>
      </div>
      <p className="text-[11px] text-muted-foreground">Deel deze link overal — altijd up-to-date met de laatste eventinfo.</p>
      <div className="flex gap-2">
        <code className="flex-1 text-xs bg-secondary p-3 rounded-lg text-muted-foreground overflow-x-auto font-mono">{url}</code>
        <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
          {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
          <ExternalLink className="w-3.5 h-3.5" />Bekijk publieke pagina
        </Button>
      </a>
    </div>
  );
}
