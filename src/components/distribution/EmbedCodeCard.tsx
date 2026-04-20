import { Code2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useUILanguage";
import { toast } from "sonner";

interface EmbedCodeCardProps {
  type: "agenda" | "single_event";
  tenantSlug: string;
  eventSlug?: string;
}

export function EmbedCodeCard({ type, tenantSlug, eventSlug }: EmbedCodeCardProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState("light");
  const [copied, setCopied] = useState(false);

  const isAgenda = type === "agenda";
  const title = isAgenda ? t("widgets.agenda") : t("widgets.singleEvent");

  const dataAttr = isAgenda
    ? `data-tenant="${tenantSlug}"`
    : `data-event="${eventSlug}"`;

  const widgetId = isAgenda ? "tx-agenda-widget" : "tx-event-widget";

  const code = `<!-- ${t("widgetWizard.embedDesc")} -->\n<div id="${widgetId}" ${dataAttr} data-theme="${theme}"></div>`;

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(t("distribution.embedCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
      {/* Preview area */}
      <div className="h-24 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center border-b border-border relative">
        <div className="flex flex-col items-center gap-1">
          <Code2 className="w-6 h-6 text-primary" />
          <span className="text-xs font-display font-semibold text-foreground">{title}</span>
        </div>
        <div className="absolute top-2 right-2">
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="h-7 text-[10px] w-20 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("widgetWizard.themeLight")}</SelectItem>
              <SelectItem value="dark">{t("widgetWizard.themeDark")}</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">{t("widgetWizard.embedDesc")}</p>

        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{t("distribution.embedTitle")}:</p>
          <code className="block text-[11px] bg-secondary p-3 rounded-lg text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
            {code}
          </code>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} className="gap-2 flex-1">
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t("widgets.copied") : t("embed.copy")}
          </Button>
        </div>
      </div>
    </div>
  );
}
