import { useState } from "react";
import { Copy, Check, Code2, Globe, Box, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useUILanguage";
import { toast } from "sonner";

interface Props {
  widgetId: string;
}

type WidgetVersion = "1" | "2";

export function WidgetEmbedInstructions({ widgetId }: Props) {
  const { t } = useTranslation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [version, setVersion] = useState<WidgetVersion>("2");
  const [bottomOffset, setBottomOffset] = useState<number>(0);

  const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const versionParam = version === "2" ? "&v=2" : "";
  const offsetParam = bottomOffset > 0 ? `&bottom_offset=${bottomOffset}` : "";
  const scriptUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widgetId}&format=js${versionParam}${offsetParam}`;
  const iframeUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widgetId}&format=html${versionParam}${offsetParam}`;

  const htmlSnippet = `<div id="txeventshare-widget-${widgetId}"></div>\n<script src="${scriptUrl}" data-widget-id="${widgetId}" async></script>`;
  const iframeSnippet = `<iframe src="${iframeUrl}" style="width:100%;border:0;min-height:600px" loading="lazy" title="Evenementen"></iframe>`;

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(t("embed.codeCopied"));
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-3">
      {/* Version + bottom offset controls */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-3">
        <div>
          <Label className="text-xs font-medium text-foreground mb-1.5 block">
            {t("embed.version.label")}
          </Label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setVersion("1")}
              className={`flex-1 text-xs px-3 py-1.5 rounded-md border transition-colors ${
                version === "1"
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("embed.version.v1")}
            </button>
            <button
              type="button"
              onClick={() => setVersion("2")}
              className={`flex-1 text-xs px-3 py-1.5 rounded-md border transition-colors inline-flex items-center justify-center gap-1.5 ${
                version === "2"
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("embed.version.v2")}
              <span className="text-[9px] px-1 py-0.5 rounded bg-accent/20 text-accent font-semibold uppercase tracking-wide">
                {t("embed.version.v2Badge")}
              </span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t("embed.version.help")}</p>
        </div>

        <div>
          <Label className="text-xs font-medium text-foreground mb-1.5 block">
            {t("embed.bottomOffset.label")}
          </Label>
          <Input
            type="number"
            min={0}
            max={200}
            step={4}
            value={bottomOffset}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setBottomOffset(Number.isFinite(v) && v >= 0 ? Math.min(v, 200) : 0);
            }}
            className="h-7 text-xs"
          />
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t("embed.bottomOffset.help")}</p>
        </div>
      </div>

      <Tabs defaultValue="html" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-9">
          <TabsTrigger value="html" className="gap-1.5 text-xs"><Code2 className="w-3.5 h-3.5" />{t("embed.tab.html")}</TabsTrigger>
          <TabsTrigger value="wordpress" className="gap-1.5 text-xs"><Globe className="w-3.5 h-3.5" />{t("embed.tab.wordpress")}</TabsTrigger>
          <TabsTrigger value="iframe" className="gap-1.5 text-xs"><Box className="w-3.5 h-3.5" />{t("embed.tab.iframe")}</TabsTrigger>
          <TabsTrigger value="other" className="gap-1.5 text-xs"><Sparkles className="w-3.5 h-3.5" />{t("embed.tab.other")}</TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="space-y-3 mt-3">
          <InfoBox>
            <span dangerouslySetInnerHTML={{ __html: t("embed.htmlInfo") }} />
          </InfoBox>
          <CodeBlock code={htmlSnippet} onCopy={() => copy("html", htmlSnippet)} copied={copiedKey === "html"} t={t} />
          <p className="text-xs text-muted-foreground">{t("embed.htmlFooter")}</p>
        </TabsContent>

        <TabsContent value="wordpress" className="space-y-3 mt-3">
          <InfoBox>
            <span dangerouslySetInnerHTML={{ __html: t("embed.wpInfo") }} />
          </InfoBox>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside pl-1">
            <li>{t("embed.wp.step1")}</li>
            <li>{t("embed.wp.step2Pre")} <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-xs font-mono">+</kbd> {t("embed.wp.step2Post")} <strong>Custom HTML</strong>.</li>
            <li>{t("embed.wp.step3")}</li>
            <li>{t("embed.wp.step4")}</li>
          </ol>
          <CodeBlock code={htmlSnippet} onCopy={() => copy("wp", htmlSnippet)} copied={copiedKey === "wp"} t={t} />
          <p className="text-xs text-muted-foreground">{t("embed.wp.footer")}</p>
        </TabsContent>

        <TabsContent value="iframe" className="space-y-3 mt-3">
          <InfoBox tone="warning">{t("embed.iframeInfo")}</InfoBox>
          <CodeBlock code={iframeSnippet} onCopy={() => copy("iframe", iframeSnippet)} copied={copiedKey === "iframe"} t={t} />
          <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("embed.iframeFooter") }} />
        </TabsContent>

        <TabsContent value="other" className="space-y-3 mt-3">
          <InfoBox>{t("embed.otherInfo")}</InfoBox>
          <ul className="space-y-2 text-xs">
            <PlatformRow name="Wix" hint="Voeg een 'Embed HTML' element toe en plak de HTML-snippet." />
            <PlatformRow name="Squarespace" hint="Gebruik een 'Code Block' en plak de HTML-snippet." />
            <PlatformRow name="Webflow" hint="Voeg een 'Embed' element toe en plak de HTML-snippet." />
            <PlatformRow name="Shopify" hint="Voeg een 'Custom Liquid' sectie toe en plak de HTML-snippet." />
            <PlatformRow name="Framer" hint="Gebruik een 'Embed' component en plak de HTML-snippet." />
          </ul>
          <a
            href="mailto:info@txeventshare.nl?subject=Hulp%20bij%20widget%20embed"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {t("embed.help")}<ExternalLink className="w-3 h-3" />
          </a>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CodeBlock({ code, onCopy, copied, t }: { code: string; onCopy: () => void; copied: boolean; t: (k: string) => string }) {
  return (
    <div className="relative">
      <code className="block text-xs bg-secondary p-3 pr-20 rounded-lg text-muted-foreground whitespace-pre-wrap font-mono break-all">
        {code}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
        className="absolute top-2 right-2 h-7 px-2 gap-1 text-xs"
      >
        {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
        {copied ? t("embed.copyOk") : t("embed.copy")}
      </Button>
    </div>
  );
}

function InfoBox({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warning" }) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-foreground"
          : "rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-foreground"
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
