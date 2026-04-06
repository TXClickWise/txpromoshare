import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLICKWISE_API_KEY = Deno.env.get("CLICKWISE_API_KEY");
const CLICKWISE_API_URL = Deno.env.get("CLICKWISE_API_URL");

interface CreateSubaccountPayload {
  tenant_id: string;
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

    const body: CreateSubaccountPayload = await req.json();
    const { tenant_id } = body;

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "Missing tenant_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is owner of this tenant
    const { data: isOwner } = await supabase.rpc("has_tenant_role", {
      _user_id: user.id,
      _tenant_id: tenant_id,
      _role: "owner",
    });
    if (!isOwner) {
      return new Response(JSON.stringify({ error: "Only tenant owners can create sub-accounts" }), {
        status: 403,
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

    // Check subscription is basic or pro
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("tenant_id", tenant_id)
      .eq("status", "active")
      .single();

    if (!subscription || subscription.plan_id === "free") {
      return new Response(JSON.stringify({ error: "A Basic or Pro plan is required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!CLICKWISE_API_KEY || !CLICKWISE_API_URL) {
      return new Response(JSON.stringify({ error: "ClickWise API credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from("integration_connections")
      .select("id, subaccount_id")
      .eq("tenant_id", tenant_id)
      .eq("provider", "clickwise")
      .eq("status", "connected")
      .maybeSingle();

    if (existing?.subaccount_id) {
      return new Response(JSON.stringify({ 
        success: true, 
        subaccount_id: existing.subaccount_id, 
        message: "Already connected" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create GHL sub-account via API
    const ghlResponse = await fetch(`${CLICKWISE_API_URL}/locations/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLICKWISE_API_KEY}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: tenant.name,
        email: tenant.email || user.email,
        phone: tenant.phone || "",
        website: tenant.website_url || "",
        companyId: tenant.id,
      }),
    });

    if (!ghlResponse.ok) {
      const errBody = await ghlResponse.text();
      console.error("GHL create location failed:", ghlResponse.status, errBody);
      return new Response(JSON.stringify({ error: `ClickWise API error: ${ghlResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ghlData = await ghlResponse.json();
    const subaccountId = ghlData.location?.id || ghlData.id || "";

    // Upsert integration_connection
    if (existing) {
      await supabase
        .from("integration_connections")
        .update({
          subaccount_id: subaccountId,
          status: "connected",
          connected_by: user.id,
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("integration_connections").insert({
        tenant_id,
        provider: "clickwise",
        status: "connected",
        subaccount_id: subaccountId,
        connected_by: user.id,
        last_sync_at: new Date().toISOString(),
        sync_settings: {
          rules: {
            event_published: true,
            event_updated: true,
            event_ended: false,
            event_reminder: false,
            contact_sync: true,
          },
        },
      });
    }

    return new Response(JSON.stringify({ success: true, subaccount_id: subaccountId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("clickwise-create-subaccount error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
