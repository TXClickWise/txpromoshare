import type { Plugin } from "vite";
import fs from "fs";
import path from "path";

/**
 * Vite plugin that generates static HTML files at /e/[slug]/index.html
 * with event-specific Open Graph tags for WhatsApp/social media previews.
 *
 * At runtime Lovable hosting serves these static files BEFORE the SPA fallback,
 * so crawlers see correct OG tags while real users still get the full React app
 * (same JS bundle, React Router handles the /e/:slug route).
 */
export function ogPagesPlugin(
  supabaseUrl: string | undefined,
  supabaseKey: string | undefined,
): Plugin {
  return {
    name: "vite-plugin-og-pages",
    apply: "build",

    async writeBundle(options) {
      if (!supabaseUrl || !supabaseKey) {
        console.warn("[og-pages] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY – skipping");
        return;
      }

      const outDir = options.dir || "dist";
      const indexPath = path.join(outDir, "index.html");

      if (!fs.existsSync(indexPath)) {
        console.warn("[og-pages] dist/index.html not found – skipping");
        return;
      }

      const baseHtml = fs.readFileSync(indexPath, "utf-8");

      try {
        // Fetch published events via REST (anon key – public SELECT policy)
        const eventsRes = await fetch(
          `${supabaseUrl}/rest/v1/events?status=eq.published&select=title,slug,short_description,start_date,start_time,seo_title,seo_description,featured_image_id`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          },
        );

        if (!eventsRes.ok) {
          console.warn("[og-pages] Failed to fetch events:", eventsRes.status);
          return;
        }

        const events: any[] = await eventsRes.json();
        if (!events.length) {
          console.log("[og-pages] No published events found");
          return;
        }

        // Fetch featured images
        const imageIds = events.map((e) => e.featured_image_id).filter(Boolean);
        const imageMap: Record<string, { original_url: string | null; storage_path: string | null }> = {};

        if (imageIds.length) {
          const idsParam = `in.(${imageIds.map((id: string) => `"${id}"`).join(",")})`;
          const mediaRes = await fetch(
            `${supabaseUrl}/rest/v1/media?id=${idsParam}&select=id,original_url,storage_path`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            },
          );
          if (mediaRes.ok) {
            const media: any[] = await mediaRes.json();
            for (const m of media) {
              imageMap[m.id] = { original_url: m.original_url, storage_path: m.storage_path };
            }
          }
        }

        let generated = 0;

        for (const event of events) {
          const ogImage = buildOgImageUrl(supabaseUrl, event, imageMap);
          const title = esc(event.seo_title || event.title);
          const timeStr = event.start_time ? event.start_time.slice(0, 5) : "";
          const dateStr = formatDateNL(event.start_date);
          const datePrefix = `${dateStr}${timeStr ? ` om ${timeStr}` : ""}`;
          const rawDesc = event.seo_description || event.short_description || event.title;
          const description = esc(`${datePrefix} — ${rawDesc}`);
          const canonical = `https://txeventshare.nl/e/${event.slug}`;

          let html = baseHtml;

          // Replace <title>
          html = html.replace(/<title>[^<]*<\/title>/, `<title>${title} | TX EventShare</title>`);

          // Replace meta description
          html = html.replace(
            /<meta name="description"[^>]*>/,
            `<meta name="description" content="${description}">`,
          );

          // Replace canonical
          html = html.replace(
            /<link rel="canonical"[^>]*>/,
            `<link rel="canonical" href="${canonical}">`,
          );

          // Replace OG tags
          html = html.replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="website">`);
          html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}">`);
          html = html.replace(
            /<meta property="og:image"[^>]*>/,
            `<meta property="og:image" content="${esc(ogImage)}">\n    <meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">`,
          );
          html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}">`);
          html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}">`);

          // Replace Twitter tags
          html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}">`);
          html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}">`);
          html = html.replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(ogImage)}">`);

          // Write file
          const dir = path.join(outDir, "e", event.slug);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
          generated++;
        }

        console.log(`[og-pages] ✅ Generated ${generated} static OG pages`);
      } catch (err) {
        console.error("[og-pages] Error generating OG pages:", err);
      }
    },
  };
}

function buildOgImageUrl(
  supabaseUrl: string,
  event: any,
  imageMap: Record<string, { original_url: string | null; storage_path: string | null }>,
): string {
  const fallback = "https://txeventshare.nl/placeholder.svg";
  if (!event.featured_image_id || !imageMap[event.featured_image_id]) return fallback;

  const media = imageMap[event.featured_image_id];

  // Prefer storage transform for optimized 1200×630 image (~150 KB)
  if (media.storage_path) {
    return `${supabaseUrl}/storage/v1/render/image/public/media/${media.storage_path}?width=1200&height=630&resize=cover&quality=80`;
  }

  return media.original_url || fallback;
}

function esc(str: string): string {
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
