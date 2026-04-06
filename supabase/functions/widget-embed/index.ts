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
      .select("id, title, subtitle, slug, start_date, start_time, end_date, end_time, short_description, status, cta_link, cta_button_text, featured_image_id")
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

    // Fetch featured images for events that have them
    const imageIds = (events || []).map((e: any) => e.featured_image_id).filter(Boolean);
    let imageMap: Record<string, string> = {};
    if (imageIds.length > 0) {
      const { data: mediaRows } = await supabase
        .from("media")
        .select("id, original_url")
        .in("id", imageIds);
      if (mediaRows) {
        for (const m of mediaRows) {
          if (m.original_url) imageMap[m.id] = m.original_url;
        }
      }
    }
    // Attach image URLs to events
    const eventsWithImages = (events || []).map((e: any) => ({
      ...e,
      featured_image_url: e.featured_image_id ? imageMap[e.featured_image_id] || null : null,
    }));

    const payload = {
      widget: { id: widget.id, type: widget.type, name: widget.name, config: widget.config },
      tenant: {
        name: tenant?.name,
        primaryColor: tenant?.primary_color || "#E86C2C",
        secondaryColor: tenant?.secondary_color || "#2A9D8F",
        slug: tenant?.slug,
      },
      events: eventsWithImages,
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

    // Featured image – small thumbnail, right-aligned
    const imageHtml = e.featured_image_url
      ? '<img src="' + escapeHtml(e.featured_image_url) + '" alt="' + escapeHtml(e.title) + '" style="width:100px;height:100px;object-fit:cover;border-radius:8px;flex-shrink:0;" />'
      : "";

    // Share buttons
    const eventUrl = e.cta_link || ("https://txeventshare.nl/event/" + escapeHtml(e.slug));
    const shareText = encodeURIComponent(e.title + " — " + dateStr + " " + time);
    const shareUrl = encodeURIComponent(eventUrl);
    const shareHtml = '<div style="display:flex;gap:6px;margin-top:10px;">' +
      '<a href="https://wa.me/?text=' + shareText + "%20" + shareUrl + '" target="_blank" rel="noopener" title="Deel via WhatsApp" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#25D366;color:#fff;text-decoration:none;font-size:16px;">&#9993;</a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + shareUrl + '" target="_blank" rel="noopener" title="Deel op Facebook" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#1877F2;color:#fff;text-decoration:none;font-size:14px;font-weight:700;">f</a>' +
      '<a href="https://twitter.com/intent/tweet?text=' + shareText + '&url=' + shareUrl + '" target="_blank" rel="noopener" title="Deel op X" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#000;color:#fff;text-decoration:none;font-size:14px;font-weight:700;">𝕏</a>' +
      '<a href="mailto:?subject=' + shareText + '&body=' + shareText + "%20" + shareUrl + '" title="Deel via e-mail" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#6b7280;color:#fff;text-decoration:none;font-size:16px;">✉</a>' +
      '</div>';

    return '<div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:12px;background:#fff;display:flex;gap:12px;align-items:flex-start;">' +
      '<div style="min-width:56px;text-align:center;background:' + pc + '10;border-radius:8px;padding:8px;">' +
      '<div style="font-size:11px;color:' + pc + ';font-weight:600;">' + dateStr + '</div>' +
      '<div style="font-size:11px;color:#6b7280;">' + time + '</div>' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
      '<div style="font-weight:600;font-size:15px;color:#111827;">' + escapeHtml(e.title) + '</div>' +
      subtitleHtml + descHtml + ctaHtml + shareHtml +
      '</div>' +
      imageHtml +
      '</div>';
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
