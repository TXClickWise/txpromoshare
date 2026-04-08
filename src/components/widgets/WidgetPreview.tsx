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

  const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const previewUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widget.id}&format=preview`;

  // Build a simple HTML page that loads the widget script
  const scriptUrl = `${baseUrl}/functions/v1/widget-embed?widget_id=${widget.id}&format=js&_t=${refreshKey}`;
  const previewHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;}</style>
</head><body>
<div id="txeventshare-widget-${widget.id}"></div>
<script src="${scriptUrl}" data-widget-id="${widget.id}" async></script>
</body></html>`;

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
          >
            <Monitor className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewport === "mobile" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewport("mobile")}
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

      <div className={`rounded-lg border border-border bg-white overflow-hidden transition-all mx-auto ${
        viewport === "mobile" ? "max-w-[375px]" : "w-full"
      }`}>
        <iframe
          ref={iframeRef}
          key={refreshKey}
          srcDoc={previewHtml}
          className="w-full border-0"
          style={{ minHeight: 300, height: "auto" }}
          sandbox="allow-scripts allow-same-origin"
          title="Widget preview"
        />
      </div>
    </div>
  );
}
