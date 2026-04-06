import { Code2, Copy, Check, Palette, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface EmbedCodeCardProps {
  type: "agenda" | "single_event";
  tenantSlug: string;
  eventSlug?: string;
}

export function EmbedCodeCard({ type, tenantSlug, eventSlug }: EmbedCodeCardProps) {
  const [theme, setTheme] = useState("light");
  const [copied, setCopied] = useState(false);

  const isAgenda = type === "agenda";
  const title = isAgenda ? "Agenda Widget" : "Event Widget";
  const desc = isAgenda
    ? "Toon al je aankomende evenementen op je eigen website. Altijd up-to-date."
    : "Highlight dit evenement als compacte promo card op je website.";

  const dataAttr = isAgenda
    ? `data-tenant="${tenantSlug}"`
    : `data-event="${eventSlug}"`;

  const widgetId = isAgenda ? "tx-agenda-widget" : "tx-event-widget";

  const code = `<!-- Gebruik de Widgets pagina om een embed-code te genereren -->\n<div id="${widgetId}" ${dataAttr} data-theme="${theme}"></div>`;

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Embed code gekopieerd");
    setTimeout(() => setCopied(false), 2000);
  };

  const features = isAgenda
    ? ["Automatisch bijgewerkt", "Responsive design", "Jouw huisstijl", "Klikt door naar eventpagina"]
    : ["Compacte weergave", "Auto-verwijderd na afloop", "CTA knop inbegrepen", "Past in elke pagina"];

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
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>

        <ul className="grid grid-cols-2 gap-1">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Check className="w-3 h-3 text-accent shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Plak op je website:</p>
          <code className="block text-[11px] bg-secondary p-3 rounded-lg text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
            {code}
          </code>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} className="gap-2 flex-1">
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Gekopieerd!" : "Kopieer code"}
          </Button>
        </div>
      </div>
    </div>
  );
}
