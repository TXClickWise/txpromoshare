import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

interface WidgetPreviewProps {
  widget: Tables<"widgets">;
}

export function WidgetPreview({ widget }: WidgetPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const [iframeHeight, setIframeHeight] = useState(420);

  const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const scriptUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widget.id}&format=js&_t=${refreshKey}`;

  // Inject postMessage-based auto-resize so iframe height matches content
  const previewHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
  body{padding:12px;}
</style>
</head><body>
<div id="txeventshare-widget-${widget.id}"></div>
<script src="${scriptUrl}" data-widget-id="${widget.id}" async></script>
<script>
  (function(){
    function reportHeight(){
      var h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      parent.postMessage({ type: 'txes-preview-height', widgetId: '${widget.id}', height: h }, '*');
    }
    var ro = new ResizeObserver(function(){ reportHeight(); });
    ro.observe(document.body);
    window.addEventListener('load', function(){ setTimeout(reportHeight, 200); });
    setTimeout(reportHeight, 600);
    setTimeout(reportHeight, 1500);
  })();
</script>
</body></html>`;

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || e.data.type !== "txes-preview-height") return;
      if (e.data.widgetId !== widget.id) return;
      const h = Number(e.data.height) || 0;
      if (h > 0) setIframeHeight(Math.min(Math.max(h + 24, 240), 1600));
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [widget.id]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live preview</p>
        <div className="flex gap-1">
          <Button
            variant={viewport === "desktop" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewport("desktop")}
            title="Desktop preview"
          >
            <Monitor className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewport === "mobile" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewport("mobile")}
            title="Mobiel preview"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Ververs preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {viewport === "desktop" ? (
        <DesktopFrame>
          <iframe
            ref={iframeRef}
            key={`d-${refreshKey}`}
            srcDoc={previewHtml}
            className="w-full border-0 bg-white"
            style={{ height: iframeHeight, transition: "height 200ms ease" }}
            sandbox="allow-scripts allow-same-origin"
            title="Widget desktop preview"
          />
        </DesktopFrame>
      ) : (
        <MobileFrame>
          <iframe
            ref={iframeRef}
            key={`m-${refreshKey}`}
            srcDoc={previewHtml}
            className="w-full border-0 bg-white"
            style={{ height: iframeHeight, transition: "height 200ms ease" }}
            sandbox="allow-scripts allow-same-origin"
            title="Widget mobile preview"
          />
        </MobileFrame>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        Preview wordt automatisch geschaald op basis van inhoud.
      </p>
    </div>
  );
}

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden shadow-sm">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background/60">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className="flex-1 mx-2 px-3 py-1 rounded-md bg-muted text-[11px] text-muted-foreground truncate">
          jouwwebsite.nl
        </div>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  // Realistic phone frame: rounded corners, notch, side bezels.
  return (
    <div className="flex justify-center">
      <div
        className="relative rounded-[2.5rem] border-[10px] border-foreground/90 bg-foreground/90 shadow-xl overflow-hidden"
        style={{ width: 340 }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-foreground/90 rounded-b-2xl z-10" />
        <div className="bg-white rounded-[1.75rem] overflow-hidden" style={{ minHeight: 480 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
