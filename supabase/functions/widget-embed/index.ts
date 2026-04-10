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
    { auth: { persistSession: false } },
  );

  try {
    const { data: widget, error: wErr } = await supabase
      .from("widgets")
      .select("*, tenants(name, primary_color, secondary_color, slug, logo_url)")
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
    const config = (widget.config || {}) as any;

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

    // Fetch featured images
    const imageIds = (events || []).map((e: any) => e.featured_image_id).filter(Boolean);
    let imageMap: Record<string, string> = {};
    if (imageIds.length > 0) {
      const { data: mediaRows } = await supabase.from("media").select("id, original_url").in("id", imageIds);
      if (mediaRows) {
        for (const m of mediaRows) {
          if (m.original_url) imageMap[m.id] = m.original_url;
        }
      }
    }

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
        logoUrl: tenant?.logo_url,
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
  const config = (widget.config || {}) as any;
  const pc = tenant.primaryColor;
  const isDark = config.theme === "dark";
  const showDesc = config.show_description !== false;
  const showShare = config.show_share_buttons !== false;

  // Theme colors
  const bg = isDark ? "#1a1a2e" : "#ffffff";
  const cardBg = isDark ? "#16213e" : "#ffffff";
  const cardBorder = isDark ? "#2a2a4a" : "#e5e7eb";
  const textPrimary = isDark ? "#e8e8e8" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textBody = isDark ? "#d1d5db" : "#374151";
  const dateBg = isDark ? pc + "20" : pc + "10";

  const title = widget.type === "agenda"
    ? "Agenda \u00B7 " + escapeHtml(tenant.name)
    : escapeHtml((events[0]?.title) || "Event");

  const eventCards = (events as any[]).map((e: any) => {
    const dateObj = new Date(e.start_date);
    const dayNum = dateObj.getDate();
    const monthShort = dateObj.toLocaleDateString("nl-NL", { month: "short" });
    const weekday = dateObj.toLocaleDateString("nl-NL", { weekday: "short" });
    const time = e.start_time ? e.start_time.slice(0, 5) : "";

    let ctaHtml = "";
    if (e.cta_link) {
      const btnText = escapeHtml(e.cta_button_text || "Meer info");
      ctaHtml = '<a href="' + escapeHtml(e.cta_link) + '" target="_blank" rel="noopener" style="display:block;text-align:center;margin-top:12px;padding:10px 20px;background:' + pc + ';color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">' + btnText + '</a>';
    }

    const descHtml = showDesc && e.short_description
      ? '<div style="font-size:13px;color:' + textBody + ';margin-top:8px;line-height:1.6;">' + escapeHtml(e.short_description) + '</div>'
      : "";

    const imageHtml = e.featured_image_url
      ? '<img src="' + escapeHtml(e.featured_image_url) + '" alt="' + escapeHtml(e.title) + '" loading="lazy" style="display:block;width:100%;height:auto;border-radius:8px;margin-top:10px;object-fit:cover;max-height:220px;" />'
      : "";

    let shareHtml = "";
    if (showShare) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const eventPageUrl = supabaseUrl + "/functions/v1/og-proxy?slug=" + encodeURIComponent(e.slug);

      // Format date for display
      const evDateObj = new Date(e.start_date);
      const evDateStr = evDateObj.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
      const evTimeStr = e.start_time ? e.start_time.slice(0, 5) : "";
      const ctaBtnText = e.cta_button_text || "Meer info";

      // Build visitor WhatsApp text: eventPageUrl first (for OG preview header)
      const visitorLines = [
        eventPageUrl,
        "",
        "Hey, ik zag dit event en het lijkt me echt leuk. Ga je mee?",
        "",
        e.title + " \u2014 " + evDateStr + " om " + evTimeStr,
        "",
      ];
      if (e.cta_link) {
        visitorLines.push(ctaBtnText + ": " + e.cta_link);
      }

      const visitorText = encodeURIComponent(visitorLines.join("\n"));
      const shareUrl = encodeURIComponent(eventPageUrl);
      const clipboardJs = 'navigator.clipboard.writeText(decodeURIComponent(\\x27' + visitorText + '\\x27)).then(function(){alert(\\x27Tekst gekopieerd! Plak in Instagram, TikTok of Google.\\x27)})';
      const imgIcon = 'width:36px;height:36px;border-radius:50%;object-fit:cover;';
      const btnStyle = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;cursor:pointer;border:none;padding:0;overflow:hidden;background:transparent;';
      const baseUrl = 'https://txpromoshare.lovable.app/images/';
      shareHtml = '<div style="display:flex;gap:8px;margin-top:12px;justify-content:center;flex-wrap:wrap;">' +
        '<a href="https://wa.me/?text=' + visitorText + '" target="_blank" rel="noopener" title="WhatsApp" style="' + btnStyle + '"><img src="' + baseUrl + 'whatsapp-icon.png" alt="WhatsApp" style="' + imgIcon + '" /></a>' +
        '<a href="https://www.facebook.com/sharer/sharer.php?u=' + shareUrl + '" target="_blank" rel="noopener" title="Facebook" style="' + btnStyle + '"><img src="' + baseUrl + 'facebook-icon.png" alt="Facebook" style="' + imgIcon + '" /></a>' +
        '<button onclick="' + clipboardJs + '" title="Instagram" style="' + btnStyle + '"><img src="' + baseUrl + 'instagram-icon.png" alt="Instagram" style="' + imgIcon + '" /></button>' +
        '<button onclick="' + clipboardJs + '" title="TikTok" style="' + btnStyle + '"><img src="' + baseUrl + 'tiktok-icon.png" alt="TikTok" style="' + imgIcon + '" /></button>' +
        '<button onclick="' + clipboardJs + '" title="Google" style="' + btnStyle + '"><img src="' + baseUrl + 'google-icon.png" alt="Google" style="' + imgIcon + '" /></button>' +
        '<a href="mailto:?subject=' + encodeURIComponent(e.title) + '&body=' + visitorText + '" title="E-mail" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;color:#fff;text-decoration:none;font-size:16px;background:' + textSecondary + ';">&#9993;</a>' +
        '</div>';
    }

    // Section 1: date block (black) + title side by side
    const heroSection1 =
      '<div style="display:flex;gap:12px;align-items:center;">' +
        '<div style="min-width:60px;text-align:center;background:#111;border-radius:8px;padding:10px 8px;">' +
          '<div style="font-size:12px;color:#fff;font-weight:600;text-transform:capitalize;">' + weekday + ' ' + dayNum + ' ' + monthShort + '</div>' +
          '<div style="font-size:14px;color:#fff;font-weight:700;margin-top:2px;">' + time + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:700;font-size:16px;color:' + textPrimary + ';line-height:1.3;">' + escapeHtml(e.title) + '</div>' +
          (e.subtitle ? '<div style="font-size:13px;color:' + textSecondary + ';margin-top:2px;">' + escapeHtml(e.subtitle) + '</div>' : '') +
        '</div>' +
      '</div>';

    // Section 2: image, description, CTA, share (stacked)
    const heroSection2 =
      imageHtml +
      descHtml +
      ctaHtml +
      shareHtml;

    return '<div style="border:1px solid ' + cardBorder + ';border-radius:12px;padding:16px;margin-bottom:14px;background:' + cardBg + ';">' +
      heroSection1 +
      heroSection2 +
      '</div>';
  }).join("");

  const noEventsHtml = '<p style="color:' + textSecondary + ';font-size:14px;">Geen aankomende evenementen.</p>';
  const innerHtml = events.length === 0 ? noEventsHtml : eventCards;

  // Logo
  const logoHtml = tenant.logoUrl
    ? '<img src="' + escapeHtml(tenant.logoUrl) + '" alt="" style="height:24px;width:auto;object-fit:contain;" />'
    : '';

  const html =
    '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;background:' + bg + ';padding:16px;border-radius:12px;">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
    (logoHtml ? logoHtml : '<div style="width:4px;height:24px;background:' + pc + ';border-radius:2px;"></div>') +
    '<h2 style="margin:0;font-size:18px;font-weight:700;color:' + textPrimary + ';">' + title + '</h2>' +
    '</div>' +
    innerHtml +
    '<div style="text-align:center;margin-top:12px;">' +
    '<a href="https://txeventshare.nl" target="_blank" rel="noopener" style="font-size:11px;color:' + textSecondary + ';text-decoration:none;">Powered by TX EventShare</a>' +
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
