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
  const slug = url.searchParams.get("slug");

  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return new Response("slug parameter required", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // Fetch event by slug
    const { data: event, error } = await supabase
      .from("events")
      .select("title, short_description, slug, start_date, start_time, featured_image_id, seo_title, seo_description")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !event) {
      // Redirect to SPA anyway — it will show "not found"
      const spaUrl = `https://txeventshare.nl/e/${encodeURIComponent(slug)}`;
      return new Response(`<html><head><meta http-equiv="refresh" content="0;url=${spaUrl}"></head></html>`, {
        status: 302,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Location": spaUrl },
      });
    }

    // Fetch featured image URL
    let imageUrl = "https://txeventshare.nl/placeholder.svg";
    if (event.featured_image_id) {
      const { data: media } = await supabase
        .from("media")
        .select("original_url, storage_path")
        .eq("id", event.featured_image_id)
        .single();
      if (media?.original_url) {
        imageUrl = media.original_url;
      } else if (media?.storage_path) {
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(media.storage_path);
        if (urlData?.publicUrl) imageUrl = urlData.publicUrl;
      }
    }

    // Build meta content
    const title = escapeHtml(event.seo_title || event.title);
    const timeStr = event.start_time ? event.start_time.slice(0, 5) : "";
    const datePrefix = `${formatDateNL(event.start_date)}${timeStr ? ` om ${timeStr}` : ""}`;
    const baseDesc = event.seo_description || event.short_description || event.title;
    const description = escapeHtml(`${datePrefix} — ${baseDesc}`);
    const canonicalUrl = `https://txeventshare.nl/e/${event.slug}`;
    const escapedImage = escapeHtml(imageUrl);

    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>${title} | TX EventShare</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${escapedImage}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:site_name" content="TX EventShare">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapedImage}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">
</head>
<body>
  <p>Doorsturen naar <a href="${escapeHtml(canonicalUrl)}">${title}</a>…</p>
  <script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (_err) {
    const fallback = `https://txeventshare.nl/e/${encodeURIComponent(slug)}`;
    return new Response(`<html><head><meta http-equiv="refresh" content="0;url=${fallback}"></head></html>`, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateNL(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}
