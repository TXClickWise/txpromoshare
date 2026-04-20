import { useState } from "react";
import { Copy, Check, Code2, Globe, Box, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Props {
  widgetId: string;
}

export function WidgetEmbedInstructions({ widgetId }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const scriptUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widgetId}&format=js`;
  const iframeUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widgetId}&format=html`;

  const htmlSnippet = `<div id="txeventshare-widget-${widgetId}"></div>\n<script src="${scriptUrl}" data-widget-id="${widgetId}" async></script>`;
  const iframeSnippet = `<iframe src="${iframeUrl}" style="width:100%;border:0;min-height:600px" loading="lazy" title="Evenementen"></iframe>`;

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Code gekopieerd");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <Tabs defaultValue="html" className="w-full">
      <TabsList className="grid grid-cols-4 w-full h-9">
        <TabsTrigger value="html" className="gap-1.5 text-xs"><Code2 className="w-3.5 h-3.5" />HTML</TabsTrigger>
        <TabsTrigger value="wordpress" className="gap-1.5 text-xs"><Globe className="w-3.5 h-3.5" />WordPress</TabsTrigger>
        <TabsTrigger value="iframe" className="gap-1.5 text-xs"><Box className="w-3.5 h-3.5" />iframe</TabsTrigger>
        <TabsTrigger value="other" className="gap-1.5 text-xs"><Sparkles className="w-3.5 h-3.5" />Anders</TabsTrigger>
      </TabsList>

      <TabsContent value="html" className="space-y-3 mt-3">
        <InfoBox>
          <strong>Aanbevolen.</strong> Plak deze code op de plek waar de widget moet verschijnen. Werkt op elke website (HTML, Webflow, Squarespace, Framer, eigen build).
        </InfoBox>
        <CodeBlock code={htmlSnippet} onCopy={() => copy("html", htmlSnippet)} copied={copiedKey === "html"} />
        <p className="text-[11px] text-muted-foreground">
          De widget update automatisch wanneer je evenementen wijzigt — geen herpublicatie van je site nodig.
        </p>
      </TabsContent>

      <TabsContent value="wordpress" className="space-y-3 mt-3">
        <InfoBox>
          Voor de meeste WordPress thema's werkt het <strong>Custom HTML</strong> blok perfect. Geen plugin nodig.
        </InfoBox>
        <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside pl-1">
          <li>Open je pagina of post in de WordPress editor.</li>
          <li>Klik op <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] font-mono">+</kbd> en zoek naar <strong>Custom HTML</strong>.</li>
          <li>Plak de code hieronder in het blok.</li>
          <li>Publiceer of werk de pagina bij.</li>
        </ol>
        <CodeBlock code={htmlSnippet} onCopy={() => copy("wp", htmlSnippet)} copied={copiedKey === "wp"} />
        <p className="text-[11px] text-muted-foreground">
          Werkt ook met Elementor (HTML widget), Divi (Code module) en Gutenberg.
        </p>
      </TabsContent>

      <TabsContent value="iframe" className="space-y-3 mt-3">
        <InfoBox tone="warning">
          Gebruik alleen als script-embed niet mogelijk is (bv. strenge CMS'en). De hoogte schaalt minder vloeiend mee.
        </InfoBox>
        <CodeBlock code={iframeSnippet} onCopy={() => copy("iframe", iframeSnippet)} copied={copiedKey === "iframe"} />
        <p className="text-[11px] text-muted-foreground">
          Pas <code className="bg-secondary px-1 rounded">min-height</code> aan voor jouw aantal evenementen.
        </p>
      </TabsContent>

      <TabsContent value="other" className="space-y-3 mt-3">
        <InfoBox>
          Werkt jouw platform er niet bij? Probeer eerst de HTML-snippet — die werkt op 95% van de sites.
        </InfoBox>
        <ul className="space-y-2 text-[11px]">
          <PlatformRow name="Wix" hint="Voeg een 'Embed HTML' element toe en plak de HTML-snippet." />
          <PlatformRow name="Squarespace" hint="Gebruik een 'Code Block' en plak de HTML-snippet." />
          <PlatformRow name="Webflow" hint="Voeg een 'Embed' element toe en plak de HTML-snippet." />
          <PlatformRow name="Shopify" hint="Voeg een 'Custom Liquid' sectie toe en plak de HTML-snippet." />
          <PlatformRow name="Framer" hint="Gebruik een 'Embed' component en plak de HTML-snippet." />
        </ul>
        <a
          href="mailto:info@txeventshare.nl?subject=Hulp%20bij%20widget%20embed"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          Hulp nodig? Mail support<ExternalLink className="w-3 h-3" />
        </a>
      </TabsContent>
    </Tabs>
  );
}

function CodeBlock({ code, onCopy, copied }: { code: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative">
      <code className="block text-[11px] bg-secondary p-3 pr-20 rounded-lg text-muted-foreground whitespace-pre-wrap font-mono break-all">
        {code}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
        className="absolute top-2 right-2 h-7 px-2 gap-1 text-[11px]"
      >
        {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
        {copied ? "OK" : "Kopieer"}
      </Button>
    </div>
  );
}

function InfoBox({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warning" }) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] text-foreground"
          : "rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-[11px] text-foreground"
      }
    >
      {children}
    </div>
  );
}

function PlatformRow({ name, hint }: { name: string; hint: string }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border border-border p-2.5">
      <span className="text-xs font-semibold text-foreground min-w-[80px]">{name}</span>
      <span className="text-muted-foreground">{hint}</span>
    </li>
  );
}
