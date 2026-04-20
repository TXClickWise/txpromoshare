// Public Events Read API
// GET /public-events-api/v1/tenants/{slug}/events
// GET /public-events-api/v1/tenants/{slug}/events/{event_slug}
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_BASE_URL = "https://txeventshare.nl";
const MEDIA_PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/media/`;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const ListQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
      ...extraHeaders,
    },
  });
}

function errorResponse(message: string, status: number, details?: unknown) {
  return jsonResponse({ error: message, details }, status);
}

function buildImageUrl(media: { storage_path: string | null; original_url: string | null } | null): string | null {
  if (!media) return null;
  if (media.storage_path) return `${MEDIA_PUBLIC_BASE}${media.storage_path}`;
  if (media.original_url) return media.original_url;
  return null;
}

async function fetchTenant(slug: string) {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, logo_url, primary_color, secondary_color, public_api_enabled, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function serializeEvent(e: any, includeGallery = false) {
  const base: any = {
    id: e.id,
    slug: e.slug,
    title: e.title,
    subtitle: e.subtitle,
    short_description: e.short_description,
    description: e.full_description,
    start_date: e.start_date,
    start_time: e.start_time,
    end_date: e.end_date,
    end_time: e.end_time,
    is_featured: e.is_featured,
    featured_until: e.featured_until,
    organizer_name: e.organizer_name,
    cta_link: e.cta_link,
    cta_button_text: e.cta_button_text,
    tags: e.tags ?? [],
    category: e.categories
      ? { slug: e.categories.slug, name: e.categories.name, color: e.categories.color }
      : null,
    venue: e.venues
      ? {
          name: e.venues.name,
          address: e.venues.address,
          city: e.venues.city,
          postal_code: e.venues.postal_code,
        }
      : null,
    featured_image_url: buildImageUrl(e.media ?? null),
    public_url: `${PUBLIC_BASE_URL}/e/${e.slug}`,
  };
  if (includeGallery) {
    const gallery = (e.event_gallery ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((g: any) => ({
        url: buildImageUrl(g.media ?? null),
        alt: g.media?.alt_text ?? null,
      }))
      .filter((g: any) => g.url);
    base.gallery = gallery;
  }
  return base;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const url = new URL(req.url);
    // Path examples:
    //   /public-events-api/v1/tenants/{slug}/events
    //   /public-events-api/v1/tenants/{slug}/events/{event_slug}
    // We match by trimming any function-name prefix.
    const segments = url.pathname.split("/").filter(Boolean);
    // find "v1"
    const vIdx = segments.indexOf("v1");
    if (vIdx === -1 || segments[vIdx + 1] !== "tenants" || !segments[vIdx + 2] || segments[vIdx + 3] !== "events") {
      return errorResponse(
        "Not found. Use /v1/tenants/{tenant_slug}/events or /v1/tenants/{tenant_slug}/events/{event_slug}",
        404,
      );
    }

    const tenantSlug = decodeURIComponent(segments[vIdx + 2]);
    const eventSlug = segments[vIdx + 4] ? decodeURIComponent(segments[vIdx + 4]) : null;

    const tenant = await fetchTenant(tenantSlug);
    if (!tenant || tenant.status !== "active") {
      return errorResponse("Tenant not found", 404);
    }
    if (!tenant.public_api_enabled) {
      return errorResponse("Public API is disabled for this tenant", 403);
    }

    const tenantPayload = {
      slug: tenant.slug,
      name: tenant.name,
      logo_url: tenant.logo_url,
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
    };

    const baseSelect = `
      id, slug, title, subtitle, short_description, full_description,
      start_date, end_date, start_time, end_time,
      organizer_name, cta_link, cta_button_text, tags,
      is_featured, featured_until, status,
      categories:category_id ( slug, name, color ),
      venues:venue_id ( name, address, city, postal_code ),
      media:featured_image_id ( storage_path, original_url )
    `;

    // Single event
    if (eventSlug) {
      const { data, error } = await supabase
        .from("events")
        .select(baseSelect)
        .eq("tenant_id", tenant.id)
        .eq("slug", eventSlug)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      if (!data) return errorResponse("Event not found", 404);

      return jsonResponse({ tenant: tenantPayload, event: serializeEvent(data) });
    }

    // List
    const parsed = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return errorResponse("Invalid query parameters", 400, parsed.error.flatten().fieldErrors);
    }
    const { from, to, category, limit, offset } = parsed.data;
    const today = new Date().toISOString().slice(0, 10);
    const fromDate = from ?? today;

    let query = supabase
      .from("events")
      .select(baseSelect, { count: "exact" })
      .eq("tenant_id", tenant.id)
      .eq("status", "published")
      .gte("start_date", fromDate)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true })
      .range(offset, offset + limit - 1);

    if (to) query = query.lte("start_date", to);

    const { data, error, count } = await query;
    if (error) throw error;

    let events = (data ?? []).map(serializeEvent);
    if (category) {
      events = events.filter((e) => e.category?.slug === category);
    }

    return jsonResponse({
      tenant: tenantPayload,
      events,
      pagination: {
        total: count ?? events.length,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error("public-events-api error", err);
    return errorResponse("Internal server error", 500, String(err));
  }
});
