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
  const langParam = (url.searchParams.get("lang") || "nl").toLowerCase();
  const SUPPORTED_LANGS = ["nl", "en", "de", "fy"];
  const lang = SUPPORTED_LANGS.includes(langParam) ? langParam : "nl";

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
    const eventRows = events || [];

    // Bulk-fetch translations if a non-default language was requested
    let translationMap: Record<string, any> = {};
    if (lang !== "nl" && eventRows.length > 0) {
      const ids = eventRows.map((e: any) => e.id);
      const { data: trans } = await supabase
        .from("event_translations")
        .select("event_id, title, subtitle, short_description, cta_button_text")
        .in("event_id", ids)
        .eq("language_code", lang);
      if (trans) for (const t of trans as any[]) translationMap[t.event_id] = t;
    }

    // Per-field NL fallback when translation is partial / missing
    const localizedEvents = eventRows.map((e: any) => {
      const t = translationMap[e.id];
      if (!t) return e;
      const pick = (field: string) => {
        const v = t[field];
        return typeof v === "string" && v.trim().length > 0 ? v : e[field];
      };
      return {
        ...e,
        title: pick("title"),
        subtitle: pick("subtitle"),
        short_description: pick("short_description"),
        cta_button_text: pick("cta_button_text"),
      };
    });

    // Fetch featured images
    const imageIds = localizedEvents.map((e: any) => e.featured_image_id).filter(Boolean);
    let imageMap: Record<string, string> = {};
    if (imageIds.length > 0) {
      const { data: mediaRows } = await supabase.from("media").select("id, original_url").in("id", imageIds);
      if (mediaRows) {
        for (const m of mediaRows) {
          if (m.original_url) imageMap[m.id] = m.original_url;
        }
      }
    }

    const eventsWithImages = localizedEvents.map((e: any) => ({
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

interface ThemeTokens {
  bg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textBody: string;
  pc: string;
  dateBlockBg: string;
  dateBlockText: string;
}

function getTheme(config: any, pc: string): ThemeTokens {
  const isDark = config.theme === "dark";
  return {
    pc,
    bg: isDark ? "#1a1a2e" : "#ffffff",
    cardBg: isDark ? "#16213e" : "#ffffff",
    cardBorder: isDark ? "#2a2a4a" : "#e5e7eb",
    textPrimary: isDark ? "#e8e8e8" : "#111827",
    textSecondary: isDark ? "#9ca3af" : "#6b7280",
    textBody: isDark ? "#d1d5db" : "#374151",
    dateBlockBg: "#111111",
    dateBlockText: "#ffffff",
  };
}

function formatDateParts(dateStr: string, timeStr: string | null) {
  const dateObj = new Date(dateStr);
  return {
    dayNum: dateObj.getDate(),
    monthShort: dateObj.toLocaleDateString("nl-NL", { month: "short" }).replace(".", ""),
    weekday: dateObj.toLocaleDateString("nl-NL", { weekday: "short" }).replace(".", ""),
    time: timeStr ? timeStr.slice(0, 5) : "",
  };
}

function buildShareHtml(e: any, t: ThemeTokens): string {
  const cacheBuster = Math.floor(Date.now() / 60000);
  const eventPageUrl = "https://txeventshare.nl/e/" + encodeURIComponent(e.slug) + "/index.html?v=" + cacheBuster;
  const visitorText = encodeURIComponent("Hey, ik zag dit event en het lijkt me echt leuk. Ga je mee?\n\n" + eventPageUrl);
  const shareUrl = encodeURIComponent(eventPageUrl);
  const clipboardJs = 'navigator.clipboard.writeText(decodeURIComponent(\\x27' + visitorText + '\\x27)).then(function(){alert(\\x27Tekst gekopieerd! Plak in Instagram, TikTok of Google.\\x27)})';
  const baseUrl = 'https://txpromoshare.lovable.app/images/';

  return [
    '<a href="https://wa.me/?text=' + visitorText + '" target="_blank" rel="noopener" title="WhatsApp" class="txes-share-btn"><img src="' + baseUrl + 'whatsapp-icon.png" alt="WhatsApp" /></a>',
    '<a href="https://www.facebook.com/sharer/sharer.php?u=' + shareUrl + '" target="_blank" rel="noopener" title="Facebook" class="txes-share-btn"><img src="' + baseUrl + 'facebook-icon.png" alt="Facebook" /></a>',
    '<button onclick="' + clipboardJs + '" title="Instagram" class="txes-share-btn"><img src="' + baseUrl + 'instagram-icon.png" alt="Instagram" /></button>',
    '<button onclick="' + clipboardJs + '" title="TikTok" class="txes-share-btn"><img src="' + baseUrl + 'tiktok-icon.png" alt="TikTok" /></button>',
    '<button onclick="' + clipboardJs + '" title="Google" class="txes-share-btn"><img src="' + baseUrl + 'google-icon.png" alt="Google" /></button>',
    '<a href="mailto:?subject=' + encodeURIComponent(e.title) + '&body=' + visitorText + '" title="E-mail" class="txes-share-btn txes-share-mail" style="background:' + t.textSecondary + ';">&#9993;</a>',
  ].join("");
}

// Compact agenda card — built for scannability on mobile
function buildAgendaCard(e: any, t: ThemeTokens, config: any): string {
  const showShare = config.show_share_buttons !== false;
  const showImage = config.show_image !== false;
  const { dayNum, monthShort, weekday, time } = formatDateParts(e.start_date, e.start_time);

  const thumb = showImage && e.featured_image_url
    ? '<div class="txes-agenda-thumb"><img src="' + escapeHtml(e.featured_image_url) + '" alt="' + escapeHtml(e.title) + '" loading="lazy" /></div>'
    : '';

  const cta = e.cta_link
    ? '<a href="' + escapeHtml(e.cta_link) + '" target="_blank" rel="noopener" class="txes-agenda-cta" style="background:' + t.pc + ';">' + escapeHtml(e.cta_button_text || "Meer info") + '</a>'
    : '';

  const share = showShare
    ? '<div class="txes-agenda-share">' + buildShareHtml(e, t) + '</div>'
    : '';

  const subtitle = e.subtitle
    ? '<div class="txes-agenda-subtitle" style="color:' + t.textSecondary + ';">' + escapeHtml(e.subtitle) + '</div>'
    : '';

  return '<article class="txes-agenda-card" style="background:' + t.cardBg + ';border-color:' + t.cardBorder + ';">' +
    '<div class="txes-agenda-row">' +
      '<div class="txes-date-block" style="background:' + t.dateBlockBg + ';color:' + t.dateBlockText + ';">' +
        '<div class="txes-date-weekday">' + weekday + '</div>' +
        '<div class="txes-date-day">' + dayNum + '</div>' +
        '<div class="txes-date-month">' + monthShort + '</div>' +
        (time ? '<div class="txes-date-time">' + time + '</div>' : '') +
      '</div>' +
      thumb +
      '<div class="txes-agenda-info">' +
        '<h3 class="txes-agenda-title" style="color:' + t.textPrimary + ';">' + escapeHtml(e.title) + '</h3>' +
        subtitle +
      '</div>' +
    '</div>' +
    (cta || share ? '<div class="txes-agenda-actions">' + cta + share + '</div>' : '') +
  '</article>';
}

// Rich single-event card — full detail for hero placement
function buildSingleEventCard(e: any, t: ThemeTokens, config: any): string {
  const showDesc = config.show_description !== false;
  const showShare = config.show_share_buttons !== false;
  const showImage = config.show_image !== false;
  const { dayNum, monthShort, weekday, time } = formatDateParts(e.start_date, e.start_time);

  const cta = e.cta_link
    ? '<a href="' + escapeHtml(e.cta_link) + '" target="_blank" rel="noopener" class="txes-single-cta" style="background:' + t.pc + ';">' + escapeHtml(e.cta_button_text || "Meer info") + '</a>'
    : '';

  const desc = showDesc && e.short_description
    ? '<p class="txes-single-desc" style="color:' + t.textBody + ';">' + escapeHtml(e.short_description) + '</p>'
    : '';

  const image = showImage && e.featured_image_url
    ? '<img class="txes-single-image" src="' + escapeHtml(e.featured_image_url) + '" alt="' + escapeHtml(e.title) + '" loading="lazy" />'
    : '';

  const share = showShare
    ? '<div class="txes-single-share">' + buildShareHtml(e, t) + '</div>'
    : '';

  return '<article class="txes-single-card" style="background:' + t.cardBg + ';border-color:' + t.cardBorder + ';">' +
    '<div class="txes-single-header">' +
      '<div class="txes-date-block txes-date-block-lg" style="background:' + t.dateBlockBg + ';color:' + t.dateBlockText + ';">' +
        '<div class="txes-date-weekday">' + weekday + '</div>' +
        '<div class="txes-date-day">' + dayNum + '</div>' +
        '<div class="txes-date-month">' + monthShort + '</div>' +
        (time ? '<div class="txes-date-time">' + time + '</div>' : '') +
      '</div>' +
      '<div class="txes-single-titlewrap">' +
        '<h2 class="txes-single-title" style="color:' + t.textPrimary + ';">' + escapeHtml(e.title) + '</h2>' +
        (e.subtitle ? '<div class="txes-single-subtitle" style="color:' + t.textSecondary + ';">' + escapeHtml(e.subtitle) + '</div>' : '') +
      '</div>' +
    '</div>' +
    image +
    desc +
    cta +
    share +
  '</article>';
}

function buildStyles(widgetId: string, t: ThemeTokens): string {
  const scope = '#txeventshare-widget-' + widgetId;
  return '<style>' +
    scope + ' *{box-sizing:border-box;}' +
    scope + ' .txes-root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:640px;margin:0 auto;background:' + t.bg + ';padding:16px;border-radius:12px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px));}' +
    scope + ' .txes-header{display:flex;align-items:center;gap:8px;margin-bottom:14px;}' +
    scope + ' .txes-header h2{margin:0;font-size:17px;font-weight:700;color:' + t.textPrimary + ';line-height:1.3;}' +
    scope + ' .txes-header img{height:22px;width:auto;object-fit:contain;}' +
    scope + ' .txes-accent{width:4px;height:22px;background:' + t.pc + ';border-radius:2px;}' +
    scope + ' .txes-empty{color:' + t.textSecondary + ';font-size:14px;text-align:center;padding:24px 8px;}' +
    scope + ' .txes-footer{text-align:center;margin-top:14px;}' +
    scope + ' .txes-footer a{font-size:11px;color:' + t.textSecondary + ';text-decoration:none;}' +

    /* Date block */
    scope + ' .txes-date-block{flex-shrink:0;width:54px;border-radius:8px;padding:6px 4px;text-align:center;line-height:1.1;}' +
    scope + ' .txes-date-weekday{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;opacity:0.85;}' +
    scope + ' .txes-date-day{font-size:20px;font-weight:800;margin-top:1px;}' +
    scope + ' .txes-date-month{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;opacity:0.85;}' +
    scope + ' .txes-date-time{font-size:11px;font-weight:700;margin-top:3px;padding-top:3px;border-top:1px solid rgba(255,255,255,0.18);}' +
    scope + ' .txes-date-block-lg{width:64px;padding:8px 6px;}' +
    scope + ' .txes-date-block-lg .txes-date-day{font-size:24px;}' +

    /* Agenda card — compact */
    scope + ' .txes-agenda-card{border:1px solid;border-radius:10px;padding:10px;margin-bottom:10px;}' +
    scope + ' .txes-agenda-row{display:flex;gap:10px;align-items:center;}' +
    scope + ' .txes-agenda-thumb{flex-shrink:0;width:56px;height:56px;border-radius:8px;overflow:hidden;background:#f3f4f6;}' +
    scope + ' .txes-agenda-thumb img{width:100%;height:100%;object-fit:cover;display:block;}' +
    scope + ' .txes-agenda-info{flex:1;min-width:0;}' +
    scope + ' .txes-agenda-title{margin:0;font-size:15px;font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
    scope + ' .txes-agenda-subtitle{font-size:12px;margin-top:2px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}' +
    scope + ' .txes-agenda-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;flex-wrap:wrap;}' +
    scope + ' .txes-agenda-cta{display:inline-block;padding:7px 14px;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;line-height:1;}' +
    scope + ' .txes-agenda-share{display:flex;gap:6px;flex-wrap:wrap;}' +
    scope + ' .txes-agenda-share .txes-share-btn{width:28px;height:28px;}' +
    scope + ' .txes-agenda-share .txes-share-btn img{width:28px;height:28px;}' +

    /* Single event — rich */
    scope + ' .txes-single-card{border:1px solid;border-radius:12px;padding:16px;margin-bottom:14px;}' +
    scope + ' .txes-single-header{display:flex;gap:12px;align-items:center;}' +
    scope + ' .txes-single-titlewrap{flex:1;min-width:0;}' +
    scope + ' .txes-single-title{margin:0;font-size:18px;font-weight:700;line-height:1.3;}' +
    scope + ' .txes-single-subtitle{font-size:13px;margin-top:3px;}' +
    scope + ' .txes-single-image{display:block;width:100%;height:auto;max-height:240px;object-fit:cover;border-radius:8px;margin-top:12px;}' +
    scope + ' .txes-single-desc{font-size:14px;line-height:1.6;margin:12px 0 0 0;}' +
    scope + ' .txes-single-cta{display:block;text-align:center;margin-top:14px;padding:11px 20px;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;}' +
    scope + ' .txes-single-share{display:flex;gap:8px;margin-top:14px;justify-content:center;flex-wrap:wrap;}' +

    /* Share buttons — shared base */
    scope + ' .txes-share-btn{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;cursor:pointer;border:none;padding:0;overflow:hidden;background:transparent;text-decoration:none;}' +
    scope + ' .txes-share-btn img{width:36px;height:36px;border-radius:50%;object-fit:cover;display:block;}' +
    scope + ' .txes-share-mail{color:#fff;font-size:16px;}' +

    /* Mobile — extra compaction */
    '@media (max-width:480px){' +
      scope + ' .txes-root{padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));}' +
      scope + ' .txes-agenda-card{padding:8px;margin-bottom:8px;}' +
      scope + ' .txes-agenda-row{gap:8px;}' +
      scope + ' .txes-agenda-thumb{width:48px;height:48px;}' +
      scope + ' .txes-agenda-title{font-size:14px;}' +
      scope + ' .txes-date-block{width:48px;padding:5px 3px;}' +
      scope + ' .txes-date-block .txes-date-day{font-size:18px;}' +
      scope + ' .txes-agenda-cta{padding:6px 12px;font-size:12px;}' +
      scope + ' .txes-agenda-share .txes-share-btn,' + scope + ' .txes-agenda-share .txes-share-btn img{width:26px;height:26px;}' +
      scope + ' .txes-single-image{max-height:180px;}' +
      scope + ' .txes-single-title{font-size:16px;}' +
    '}' +
  '</style>';
}

function generateEmbedScript(payload: any): string {
  const { widget, tenant, events } = payload;
  const config = (widget.config || {}) as any;
  const t = getTheme(config, tenant.primaryColor);

  const isSingle = widget.type === "single_event";
  const title = isSingle
    ? escapeHtml((events[0]?.title) || "Event")
    : "Agenda \u00B7 " + escapeHtml(tenant.name);

  const cards = (events as any[]).map((e: any) =>
    isSingle ? buildSingleEventCard(e, t, config) : buildAgendaCard(e, t, config)
  ).join("");

  const innerHtml = events.length === 0
    ? '<p class="txes-empty">Geen aankomende evenementen.</p>'
    : cards;

  const logoHtml = tenant.logoUrl
    ? '<img src="' + escapeHtml(tenant.logoUrl) + '" alt="" />'
    : '<div class="txes-accent"></div>';

  const styles = buildStyles(widget.id, t);

  const html = styles +
    '<div class="txes-root">' +
      '<header class="txes-header">' + logoHtml + '<h2>' + title + '</h2></header>' +
      innerHtml +
      '<div class="txes-footer"><a href="https://txeventshare.nl" target="_blank" rel="noopener">Powered by TX EventShare</a></div>' +
    '</div>';

  const escapedHtml = JSON.stringify(html);

  return '(function(){' +
    'var c=document.getElementById("txeventshare-widget-' + widget.id + '");' +
    'if(!c){var s=document.querySelectorAll(\'script[data-widget-id="' + widget.id + '"]\');' +
    'if(s.length>0){c=document.createElement("div");c.id="txeventshare-widget-' + widget.id + '";' +
    's[s.length-1].parentNode.insertBefore(c,s[s.length-1]);}}' +
    'if(c){c.innerHTML=' + escapedHtml + ';}' +
    '})();';
}
