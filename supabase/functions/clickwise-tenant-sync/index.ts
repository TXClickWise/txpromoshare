import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLICKWISE_API_KEY = Deno.env.get("CLICKWISE_API_KEY");
const CLICKWISE_API_URL = Deno.env.get("CLICKWISE_API_URL");
const CLICKWISE_OWN_SUBACCOUNT_ID = Deno.env.get("CLICKWISE_OWN_SUBACCOUNT_ID");

/**
 * clickwise-tenant-sync
 * 
 * Syncs tenant (customer) data to the TX EventShare platform owner's 
 * own ClickWise/GHL sub-account as a contact. This enables the platform
 * owner to use ClickWise for marketing to their own customers.
 * 
 * Triggered on:
 * - tenant.registered  → new customer signed up
 * - tenant.plan_changed → customer upgraded/downgraded plan
 * - tenant.updated → customer updated their org info
 */

interface TenantSyncPayload {
  event_type: "tenant.registered" | "tenant.plan_changed" | "tenant.updated";
  tenant_id: string;
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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!CLICKWISE_API_KEY || !CLICKWISE_API_URL || !CLICKWISE_OWN_SUBACCOUNT_ID) {
      return new Response(JSON.stringify({ error: "ClickWise platform credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: TenantSyncPayload = await req.json();
    const { event_type, tenant_id } = body;

    if (!event_type || !tenant_id) {
      return new Response(JSON.stringify({ error: "Missing event_type or tenant_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tenant info
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenant_id)
      .single();

    if (!tenant) {
      return new Response(JSON.stringify({ error: "Tenant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get subscription info
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("tenant_id", tenant_id)
      .eq("status", "active")
      .maybeSingle();

    // Get owner profile
    const { data: ownerRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("tenant_id", tenant_id)
      .eq("role", "owner")
      .maybeSingle();

    let ownerProfile = null;
    if (ownerRole) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", ownerRole.user_id)
        .maybeSingle();
      ownerProfile = profile;
    }

    // Get team member count
    const { count: teamCount } = await supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id);

    // Build GHL upsert contact payload
    const ghlBody = {
      locationId: CLICKWISE_OWN_SUBACCOUNT_ID,
      email: tenant.email || "",
      phone: tenant.phone || ownerProfile?.phone || "",
      name: ownerProfile?.full_name || tenant.name,
      companyName: tenant.name,
      website: tenant.website_url || "",
      tags: [
        `plan:${subscription?.plan_id || "free"}`,
        `source:txeventshare`,
        `event:${event_type}`,
      ],
      customFields: [
        { key: "tx_tenant_id", value: tenant_id },
        { key: "tx_plan", value: subscription?.plan_id || "free" },
        { key: "tx_team_size", value: String(teamCount || 1) },
        { key: "tx_registered_at", value: tenant.created_at },
        { key: "tx_slug", value: tenant.slug },
        { key: "tx_sync_event", value: event_type },
        { key: "tx_synced_at", value: new Date().toISOString() },
      ],
    };

    let responseStatus = 0;
    let syncStatus = "success";

    try {
      const ghlResponse = await fetch(`${CLICKWISE_API_URL}/contacts/upsert`, {
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
        const errText = await ghlResponse.text();
        console.error("GHL upsert contact failed:", responseStatus, errText);
      }
    } catch (fetchErr) {
      syncStatus = "failed";
      responseStatus = 0;
      console.error("GHL API call failed:", fetchErr);
    }

    // Log the sync — use "platform" connection or find one
    const { data: platformConnection } = await supabase
      .from("integration_connections")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("provider", "clickwise")
      .maybeSingle();

    if (platformConnection) {
      await supabase.from("integration_events").insert({
        connection_id: platformConnection.id,
        event_type: `platform.${event_type}`,
        status: syncStatus,
        payload: ghlBody as any,
        response_status: responseStatus,
      });
    }

    return new Response(JSON.stringify({ success: syncStatus === "success", status: syncStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("clickwise-tenant-sync error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
