import { useState } from "react";
import { Copy, Check, Code2, Globe, Box } from "lucide-react";
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
  const wpSnippet = htmlSnippet;
  const iframeSnippet = `<iframe src="${iframeUrl}" style="width:100%;border:0;min-height:600px" loading="lazy" title="Evenementen"></iframe>`;

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Code gekopieerd");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <Tabs defaultValue="html" className="w-full">
      <TabsList className="grid grid-cols-3 w-full h-9">
        <TabsTrigger value="html" className="gap-1.5 text-xs"><Code2 className="w-3.5 h-3.5" />HTML</TabsTrigger>
        <TabsTrigger value="wordpress" className="gap-1.5 text-xs"><Globe className="w-3.5 h-3.5" />WordPress</TabsTrigger>
        <TabsTrigger value="iframe" className="gap-1.5 text-xs"><Box className="w-3.5 h-3.5" />iframe</TabsTrigger>
      </TabsList>

      <TabsContent value="html" className="space-y-3 mt-3">
        <p className="text-[11px] text-muted-foreground">
          Plak deze code op de plek waar de widget moet verschijnen. Werkt op elke website.
        </p>
        <CodeBlock code={htmlSnippet} onCopy={() => copy("html", htmlSnippet)} copied={copiedKey === "html"} />
      </TabsContent>

      <TabsContent value="wordpress" className="space-y-3 mt-3">
        <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Open je pagina/post in de WordPress editor.</li>
          <li>Voeg een <strong>Custom HTML</strong> blok toe.</li>
          <li>Plak de code hieronder en publiceer.</li>
        </ol>
        <CodeBlock code={wpSnippet} onCopy={() => copy("wp", wpSnippet)} copied={copiedKey === "wp"} />
      </TabsContent>

      <TabsContent value="iframe" className="space-y-3 mt-3">
        <p className="text-[11px] text-muted-foreground">
          Voor strenge CMS'en of als alternatief. Werkt overal, maar minder vloeiend dan de script-versie.
        </p>
        <CodeBlock code={iframeSnippet} onCopy={() => copy("iframe", iframeSnippet)} copied={copiedKey === "iframe"} />
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
