import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLICKWISE_API_KEY = Deno.env.get("CLICKWISE_API_KEY");
const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const rawApiUrl = Deno.env.get("CLICKWISE_API_URL");
const CLICKWISE_API_URL = (rawApiUrl && rawApiUrl.startsWith("http")) ? rawApiUrl : GHL_BASE_URL;
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

function buildISODateTime(date: string, time: string | null): string {
  // date = "2026-04-15", time = "20:00:00" or "20:00"
  const t = time || "00:00";
  return `${date}T${t.length === 5 ? t + ":00" : t}+02:00`;
}

function addHours(isoStr: string, hours: number): string {
  const d = new Date(isoStr);
  d.setTime(d.getTime() + hours * 3600000);
  // Return in same +02:00 format
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+02:00`;
}

async function callGHL(endpoint: string, apiKey: string, body: Record<string, unknown>): Promise<{ status: number; body: string; ok: boolean }> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) console.error("GHL API error:", res.status, text);
    return { status: res.status, body: text, ok: res.ok };
  } catch (err) {
    console.error("GHL API call failed:", err);
    return { status: 0, body: String(err), ok: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SyncPayload = await req.json();
    const { connection_id, tenant_id, event_type, event_id, data } = body;

    if (!connection_id || !tenant_id || !event_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: membership } = await supabase.rpc("is_tenant_member", {
      _user_id: user.id, _tenant_id: tenant_id,
    });
    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a tenant member" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credentials = connection.credentials_encrypted as any;
    const connectionApiKey = credentials?.api_key;
    const apiKey = connectionApiKey || CLICKWISE_API_KEY;
    const calendarId = credentials?.calendar_id || "TiRSCHmHCYXM16aZbq7g";

    if (!apiKey) {
      await supabase.from("integration_events").insert({
        connection_id, event_id: event_id || null, event_type,
        status: "failed", payload: data as any, response_status: 500,
      });
      return new Response(JSON.stringify({ error: "ClickWise API credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subaccountId = connection.subaccount_id;

    switch (event_type) {
      case "event.published":
      case "event.updated":
      case "event.ended": {
        if (!event_id) {
          return new Response(JSON.stringify({ error: "event_id required for event sync" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: eventRow } = await supabase
          .from("events")
          .select(`*, media:featured_image_id ( original_url, storage_path ), venues:venue_id ( name, city, address ), categories:category_id ( name )`)
          .eq("id", event_id)
          .eq("tenant_id", tenant_id)
          .single();

        if (!eventRow) {
          return new Response(JSON.stringify({ error: "Event not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const media = eventRow.media as any;
        const venue = eventRow.venues as any;
        const category = eventRow.categories as any;

        const imageUrl = buildPublicImageUrl(media?.storage_path || null, media?.original_url || null);
        const eventUrl = `${PUBLIC_APP_URL}/e/${eventRow.slug}`;
        const locationStr = [venue?.name, venue?.city].filter(Boolean).join(", ");
        const addressStr = [venue?.address, venue?.city].filter(Boolean).join(", ");
        const dateStr = `${eventRow.start_date} ${eventRow.start_time || ""}`.trim();
        const shortFallback = `${eventRow.title} - ${dateStr}${locationStr ? ` @ ${locationStr}` : ""}\n${eventUrl}`;

        // === 1. Contact upsert (existing behavior) ===
        const contactBody = {
          locationId: subaccountId,
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

        const contactResult = await callGHL(`${CLICKWISE_API_URL}/contacts/upsert`, apiKey, contactBody);

        // Extract contactId from upsert response for calendar sync
        let ghlContactId: string | null = null;
        try {
          const contactJson = JSON.parse(contactResult.body);
          ghlContactId = contactJson?.contact?.id || null;
        } catch { /* ignore parse errors */ }

        await supabase.from("integration_events").insert({
          connection_id, event_id, event_type,
          status: contactResult.ok ? "success" : "failed",
          payload: contactBody as any,
          response_status: contactResult.status,
        });

        // === 2. Calendar appointment sync ===
        const startTime = buildISODateTime(eventRow.start_date, eventRow.start_time);
        let endTime: string;
        if (eventRow.end_date && eventRow.end_time) {
          endTime = buildISODateTime(eventRow.end_date, eventRow.end_time);
        } else if (eventRow.end_date) {
          endTime = buildISODateTime(eventRow.end_date, eventRow.start_time);
        } else {
          endTime = addHours(startTime, 3);
        }

        const notes = [
          eventRow.short_description || eventRow.full_description || "",
          "",
          `🔗 ${eventUrl}`,
          imageUrl ? `🖼️ ${imageUrl}` : "",
          eventRow.whatsapp_share_text ? `📱 WhatsApp: ${eventRow.whatsapp_share_text}` : "",
          eventRow.social_share_text ? `📣 Social: ${eventRow.social_share_text}` : "",
        ].filter(Boolean).join("\n");

        // Only sync to calendar if we have a contactId
        let calResult = { ok: true, status: 0, body: "skipped - no contactId" };
        if (ghlContactId) {
          const appointmentBody: Record<string, unknown> = {
            calendarId,
            locationId: subaccountId,
            contactId: ghlContactId,
            title: eventRow.title,
            startTime,
            endTime,
            address: addressStr || undefined,
            notes,
            appointmentStatus: event_type === "event.ended" ? "cancelled" : "confirmed",
          };

          calResult = await callGHL(
            `${CLICKWISE_API_URL}/calendars/events/appointments`,
            apiKey,
            appointmentBody,
          );

          let ghlCalError: string | null = null;
          if (!calResult.ok) {
            try { ghlCalError = calResult.body; } catch { /* */ }
          }

          await supabase.from("integration_events").insert({
            connection_id, event_id,
            event_type: "event.calendar_sync",
            status: calResult.ok ? "success" : "failed",
            payload: { ...appointmentBody, _ghl_response: ghlCalError } as any,
            response_status: calResult.status,
          });
        } else {
          console.error("No contactId from upsert, skipping calendar sync");
          await supabase.from("integration_events").insert({
            connection_id, event_id,
            event_type: "event.calendar_sync",
            status: "failed",
            payload: { error: "No contactId from contact upsert" } as any,
            response_status: 0,
          });
        }

        // (duplicate log removed – already logged inside the if/else above)

        // Update last_sync_at
        await supabase
          .from("integration_connections")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", connection_id);

        return new Response(JSON.stringify({
          success: contactResult.ok && calResult.ok,
          contact_status: contactResult.ok ? "success" : "failed",
          calendar_status: calResult.ok ? "success" : "failed",
          ghl_contact_status: contactResult.status,
          ghl_calendar_status: calResult.status,
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      case "contact.sync": {
        const contactBody = { locationId: subaccountId, ...data };
        const result = await callGHL(`${CLICKWISE_API_URL}/contacts/upsert`, apiKey, contactBody);

        await supabase.from("integration_events").insert({
          connection_id, event_id: event_id || null, event_type,
          status: result.ok ? "success" : "failed",
          payload: contactBody as any,
          response_status: result.status,
        });

        await supabase
          .from("integration_connections")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", connection_id);

        return new Response(JSON.stringify({
          success: result.ok, status: result.ok ? "success" : "failed",
          ghl_status: result.status,
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown event_type: ${event_type}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("clickwise-sync error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
