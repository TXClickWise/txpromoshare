import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLICKWISE_API_KEY = Deno.env.get("CLICKWISE_API_KEY");
const CLICKWISE_API_URL = Deno.env.get("CLICKWISE_API_URL");

interface SyncPayload {
  connection_id: string;
  tenant_id: string;
  event_type: string; // event.published | event.updated | event.ended | contact.sync
  event_id?: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify JWT
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
      return new Response(JSON.stringify({ error: "Missing required fields: connection_id, tenant_id, event_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user is tenant member
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

    // Get connection info
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

    if (!CLICKWISE_API_KEY || !CLICKWISE_API_URL) {
      // Log as failed
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

    // Build the GHL API call based on event_type
    let ghlEndpoint = "";
    let ghlBody: Record<string, unknown> = {};
    const subaccountId = connection.subaccount_id;

    switch (event_type) {
      case "event.published":
      case "event.updated":
      case "event.ended": {
        // Push event data as a note/custom value to GHL
        ghlEndpoint = `${CLICKWISE_API_URL}/contacts/`;
        ghlBody = {
          locationId: subaccountId,
          customFields: [
            { key: "tx_event_type", value: event_type },
            { key: "tx_event_data", value: JSON.stringify(data) },
          ],
        };
        break;
      }
      case "contact.sync": {
        // Sync tenant contact info to GHL
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

    // Call GoHighLevel API
    let responseStatus = 0;
    let syncStatus = "success";
    try {
      const ghlResponse = await fetch(ghlEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLICKWISE_API_KEY}`,
          "Version": "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ghlBody),
      });
      responseStatus = ghlResponse.status;
      if (!ghlResponse.ok) {
        syncStatus = "failed";
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
      payload: data as any,
      response_status: responseStatus,
    });

    // Update last_sync_at
    await supabase
      .from("integration_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", connection_id);

    return new Response(JSON.stringify({ success: syncStatus === "success", status: syncStatus }), {
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
