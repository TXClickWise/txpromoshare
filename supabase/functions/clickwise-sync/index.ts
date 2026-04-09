import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLICKWISE_API_KEY = Deno.env.get("CLICKWISE_API_KEY");
const CLICKWISE_API_URL = Deno.env.get("CLICKWISE_API_URL") || "https://services.leadconnectorhq.com";
const PUBLIC_APP_URL = "https://txpromoshare.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SyncPayload {
  connection_id: string;
  tenant_id: string;
  event_type: string;
  event_id?: string;
  data?: Record<string, unknown>;
}

function buildPublicImageUrl(storagePath: string | null, originalUrl: string | null): string {
  if (originalUrl) return originalUrl;
  if (storagePath) {
    return `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`;
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SyncPayload = await req.json();
    const { connection_id, tenant_id, event_type, event_id, data } = body;

    if (!connection_id || !tenant_id || !event_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: membership } = await supabase.rpc("is_tenant_member", {
      _user_id: user.id,
      _tenant_id: tenant_id,
    });
    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a tenant member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: connection } = await supabase
      .from("integration_connections")
      .select("*")
      .eq("id", connection_id)
      .eq("tenant_id", tenant_id)
      .single();

    if (!connection || connection.status !== "connected") {
      return new Response(JSON.stringify({ error: "Integration not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use per-connection API key, fallback to global secret
    const connectionApiKey = (connection.credentials_encrypted as any)?.api_key;
    const apiKey = connectionApiKey || CLICKWISE_API_KEY;

    if (!apiKey) {
      await supabase.from("integration_events").insert({
        connection_id,
        event_id: event_id || null,
        event_type,
        status: "failed",
        payload: data as any,
        response_status: 500,
      });
      return new Response(JSON.stringify({ error: "ClickWise API credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subaccountId = connection.subaccount_id;
    let ghlEndpoint = "";
    let ghlBody: Record<string, unknown> = {};

    switch (event_type) {
      case "event.published":
      case "event.updated":
      case "event.ended": {
        if (!event_id) {
          return new Response(JSON.stringify({ error: "event_id required for event sync" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Fetch full event data with joins
        const { data: eventRow } = await supabase
          .from("events")
          .select(`
            *,
            media:featured_image_id ( original_url, storage_path ),
            venues:venue_id ( name, city, address ),
            categories:category_id ( name )
          `)
          .eq("id", event_id)
          .eq("tenant_id", tenant_id)
          .single();

        if (!eventRow) {
          return new Response(JSON.stringify({ error: "Event not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const media = eventRow.media as any;
        const venue = eventRow.venues as any;
        const category = eventRow.categories as any;

        const imageUrl = buildPublicImageUrl(
          media?.storage_path || null,
          media?.original_url || null,
        );
        const eventUrl = `${PUBLIC_APP_URL}/e/${eventRow.slug}`;
        const locationStr = [venue?.name, venue?.city].filter(Boolean).join(", ");
        const dateStr = `${eventRow.start_date} ${eventRow.start_time || ""}`.trim();
        const shortFallback = `${eventRow.title} - ${dateStr}${locationStr ? ` @ ${locationStr}` : ""}\n${eventUrl}`;

        // Use GHL v2 contacts upsert with custom fields
        ghlEndpoint = `${CLICKWISE_API_URL}/contacts/upsert`;
        ghlBody = {
          locationId: subaccountId,
          // Use the tenant email as contact identifier for upsert
          email: `events@${tenant_id}.txeventshare.local`,
          name: "TX EventShare Sync",
          tags: ["tx-eventshare", `tx-${event_type.replace(".", "-")}`],
          customFields: [
            { key: "tx_event_type", field_value: event_type },
            { key: "tx_event_title", field_value: eventRow.title || "" },
            { key: "tx_event_date", field_value: dateStr },
            { key: "tx_event_location", field_value: locationStr },
            { key: "tx_event_category", field_value: category?.name || "" },
            { key: "tx_event_url", field_value: eventUrl },
            { key: "tx_event_image", field_value: imageUrl },
            { key: "tx_event_whatsapp", field_value: eventRow.whatsapp_share_text || shortFallback },
            { key: "tx_event_social", field_value: eventRow.social_share_text || shortFallback },
          ],
        };
        break;
      }
      case "contact.sync": {
        ghlEndpoint = `${CLICKWISE_API_URL}/contacts/upsert`;
        ghlBody = {
          locationId: subaccountId,
          ...data,
        };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown event_type: ${event_type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Call GoHighLevel API v2
    let responseStatus = 0;
    let syncStatus = "success";
    let responseBody = "";
    try {
      const ghlResponse = await fetch(ghlEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Version": "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ghlBody),
      });
      responseStatus = ghlResponse.status;
      responseBody = await ghlResponse.text();
      if (!ghlResponse.ok) {
        syncStatus = "failed";
        console.error("GHL API error:", responseStatus, responseBody);
      }
    } catch (fetchErr) {
      syncStatus = "failed";
      responseStatus = 0;
      console.error("GHL API call failed:", fetchErr);
    }

    // Log the sync event
    await supabase.from("integration_events").insert({
      connection_id,
      event_id: event_id || null,
      event_type,
      status: syncStatus,
      payload: ghlBody as any,
      response_status: responseStatus,
    });

    // Update last_sync_at
    await supabase
      .from("integration_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", connection_id);

    return new Response(JSON.stringify({
      success: syncStatus === "success",
      status: syncStatus,
      ghl_status: responseStatus,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("clickwise-sync error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
