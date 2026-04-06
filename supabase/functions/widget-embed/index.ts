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
  const format = url.searchParams.get("format") || "js";

  if (!widgetId) {
    return new Response("widget_id required", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
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

    let query = supabase
      .from("events")
      .select("id, title, subtitle, slug, start_date, start_time, end_date, end_time, short_description, status, cta_link, cta_button_text")
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
      widget: { id: widget.id, type: widget.type, name: widget.name, config: widget.config },
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

    const js = generateEmbedScript(payload);
    return new Response(js, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateEmbedScript(payload: any): string {
  const { widget, tenant, events } = payload;
  const pc = tenant.primaryColor;
  const title = widget.type === "agenda" ? "Agenda \u00B7 " + escapeHtml(tenant.name) : escapeHtml((events[0]?.title) || "Event");

  const eventCards = (events as any[]).map((e: any) => {
    const dateStr = new Date(e.start_date).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
    const time = e.start_time ? e.start_time.slice(0, 5) : "";
    let ctaHtml = "";
    if (e.cta_link) {
      const btnText = escapeHtml(e.cta_button_text || "Meer info");
      ctaHtml = '<a href="' + escapeHtml(e.cta_link) + '" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;padding:6px 16px;background:' + pc + ';color:#fff;border-radius:6px;text-decoration:none;font-size:13px;">' + btnText + '</a>';
    }
    const subtitleHtml = e.subtitle ? '<div style="font-size:13px;color:#6b7280;margin-top:2px;">' + escapeHtml(e.subtitle) + '</div>' : "";
    const descHtml = e.short_description ? '<div style="font-size:13px;color:#374151;margin-top:6px;">' + escapeHtml(e.short_description) + '</div>' : "";

    return '<div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:12px;background:#fff;">' +
      '<div style="display:flex;gap:12px;align-items:flex-start;">' +
      '<div style="min-width:56px;text-align:center;background:' + pc + '10;border-radius:8px;padding:8px;">' +
      '<div style="font-size:11px;color:' + pc + ';font-weight:600;">' + dateStr + '</div>' +
      '<div style="font-size:11px;color:#6b7280;">' + time + '</div>' +
      '</div>' +
      '<div style="flex:1;">' +
      '<div style="font-weight:600;font-size:15px;color:#111827;">' + escapeHtml(e.title) + '</div>' +
      subtitleHtml + descHtml + ctaHtml +
      '</div></div></div>';
  }).join("");

  const noEventsHtml = '<p style="color:#6b7280;font-size:14px;">Geen aankomende evenementen.</p>';
  const innerHtml = events.length === 0 ? noEventsHtml : eventCards;

  const html = '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
    '<div style="width:4px;height:24px;background:' + pc + ';border-radius:2px;"></div>' +
    '<h2 style="margin:0;font-size:18px;font-weight:700;color:#111827;">' + title + '</h2>' +
    '</div>' +
    innerHtml +
    '<div style="text-align:center;margin-top:12px;">' +
    '<a href="https://txeventshare.nl" target="_blank" rel="noopener" style="font-size:11px;color:#9ca3af;text-decoration:none;">Powered by TX EventShare</a>' +
    '</div></div>';

  const escapedHtml = JSON.stringify(html);

  return '(function(){' +
    'var c=document.getElementById("txeventshare-widget-' + widget.id + '");' +
    'if(!c){var s=document.querySelectorAll(\'script[data-widget-id="' + widget.id + '"]\');' +
    'if(s.length>0){c=document.createElement("div");c.id="txeventshare-widget-' + widget.id + '";' +
    's[s.length-1].parentNode.insertBefore(c,s[s.length-1]);}}' +
    'if(c){c.innerHTML=' + escapedHtml + ';}' +
    '})();';
}
