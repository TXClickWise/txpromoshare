import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const widgetId = url.searchParams.get("widget_id");
  const format = url.searchParams.get("format") || "js"; // js or json

  if (!widgetId) {
    return new Response("widget_id required", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Fetch widget config
    const { data: widget, error: wErr } = await supabase
      .from("widgets")
      .select("*, tenants(name, primary_color, secondary_color, slug)")
      .eq("id", widgetId)
      .eq("is_active", true)
      .single();

    if (wErr || !widget) {
      return new Response(JSON.stringify({ error: "Widget not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenant = (widget as any).tenants;
    const tenantId = widget.tenant_id;
    const config = widget.config as any;

    // Fetch published events for this tenant
    let query = supabase
      .from("events")
      .select("id, title, subtitle, slug, start_date, start_time, end_date, end_time, short_description, status, category_id, venue_id, cta_link, cta_button_text")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (widget.type === "single_event" && config?.event_id) {
      query = query.eq("id", config.event_id);
    } else {
      query = query.limit(config?.max_events || 20);
    }

    const { data: events } = await query;

    const payload = {
      widget: {
        id: widget.id,
        type: widget.type,
        name: widget.name,
        config: widget.config,
      },
      tenant: {
        name: tenant?.name,
        primaryColor: tenant?.primary_color || "#E86C2C",
        secondaryColor: tenant?.secondary_color || "#2A9D8F",
        slug: tenant?.slug,
      },
      events: events || [],
    };

    if (format === "json") {
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return embeddable JavaScript
    const js = generateEmbedScript(payload);
    return new Response(js, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateEmbedScript(payload: any): string {
  const { widget, tenant, events } = payload;
  const primaryColor = tenant.primaryColor;
  const isAgenda = widget.type === "agenda";

  const eventsHtml = events.map((e: any) => {
    const date = new Date(e.start_date).toLocaleDateString("nl-NL", {
      weekday: "short", day: "numeric", month: "short",
    });
    const time = e.start_time?.slice(0, 5) || "";
    const ctaHtml = e.cta_link
      ? \`<a href="\${e.cta_link}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;padding:6px 16px;background:\${primaryColor};color:#fff;border-radius:6px;text-decoration:none;font-size:13px;">\${e.cta_button_text || 'Meer info'}</a>\`
      : "";
    return \`
      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:12px;background:#fff;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="min-width:56px;text-align:center;background:\${primaryColor}10;border-radius:8px;padding:8px;">
            <div style="font-size:11px;color:\${primaryColor};font-weight:600;">\${date}</div>
            <div style="font-size:11px;color:#6b7280;">\${time}</div>
          </div>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:15px;color:#111827;">\${e.title}</div>
            \${e.subtitle ? \`<div style="font-size:13px;color:#6b7280;margin-top:2px;">\${e.subtitle}</div>\` : ""}
            \${e.short_description ? \`<div style="font-size:13px;color:#374151;margin-top:6px;">\${e.short_description}</div>\` : ""}
            \${ctaHtml}
          </div>
        </div>
      </div>
    \`;
  }).join("");

  const title = isAgenda ? `Agenda · ${tenant.name}` : (events[0]?.title || "Event");

  return \`
(function() {
  var container = document.getElementById("txpromoshare-widget-\${widget.id}");
  if (!container) {
    var scripts = document.querySelectorAll('script[data-widget-id="\${widget.id}"]');
    if (scripts.length > 0) {
      container = document.createElement("div");
      container.id = "txpromoshare-widget-\${widget.id}";
      scripts[scripts.length - 1].parentNode.insertBefore(container, scripts[scripts.length - 1]);
    }
  }
  if (!container) return;

  container.innerHTML = \\\`
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <div style="width:4px;height:24px;background:\${primaryColor};border-radius:2px;"></div>
        <h2 style="margin:0;font-size:18px;font-weight:700;color:#111827;">\${title}</h2>
      </div>
      \${events.length === 0 ? '<p style="color:#6b7280;font-size:14px;">Geen aankomende evenementen.</p>' : \\\`\${eventsHtml}\\\`}
      <div style="text-align:center;margin-top:12px;">
        <a href="https://txpromoshare.lovable.app" target="_blank" rel="noopener" style="font-size:11px;color:#9ca3af;text-decoration:none;">Powered by TX PromoShare</a>
      </div>
    </div>
  \\\`;
})();
\`;
}
