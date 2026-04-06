import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOOST_PRICES: Record<number, string> = {
  7: "price_1TJMNAL34Z8Db3WQmsvBhKdM",
  14: "price_1TJMNFL34Z8Db3WQkWi4cafm",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("Niet ingelogd");

    const { eventId, boostDays, useCredit } = await req.json();
    if (!eventId || ![7, 14].includes(boostDays)) {
      return new Response(JSON.stringify({ error: "Ongeldige parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get event + tenant
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, tenant_id, start_date, end_date")
      .eq("id", eventId)
      .single();
    if (!event) throw new Error("Evenement niet gevonden");

    // Check user is member of tenant
    const { data: membership } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("tenant_id", event.tenant_id)
      .limit(1);
    if (!membership?.length) throw new Error("Geen toegang");

    // Calculate featured_until: min(now + boostDays, event end date)
    const boostEnd = new Date();
    boostEnd.setDate(boostEnd.getDate() + boostDays);
    const eventEnd = event.end_date
      ? new Date(event.end_date + "T23:59:59Z")
      : new Date(event.start_date + "T23:59:59Z");
    const featuredUntil = boostEnd < eventEnd ? boostEnd : eventEnd;

    // Try to use a free boost credit
    if (useCredit) {
      const { data: credits } = await supabaseAdmin
        .from("boost_credits")
        .select("*")
        .eq("tenant_id", event.tenant_id)
        .gt("remaining", 0)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true })
        .limit(1);

      if (credits?.length) {
        // Use credit
        await supabaseAdmin
          .from("boost_credits")
          .update({ remaining: credits[0].remaining - 1 })
          .eq("id", credits[0].id);

        // Activate boost
        await supabaseAdmin
          .from("events")
          .update({
            is_featured: true,
            featured_until: featuredUntil.toISOString(),
          })
          .eq("id", eventId);

        return new Response(
          JSON.stringify({ success: true, method: "credit" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Geen boost-credits beschikbaar" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Stripe checkout
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: BOOST_PRICES[boostDays], quantity: 1 }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/app/events/${eventId}?boosted=${boostDays}`,
      cancel_url: `${req.headers.get("origin")}/app/events/${eventId}`,
      metadata: {
        event_id: eventId,
        boost_days: String(boostDays),
        featured_until: featuredUntil.toISOString(),
        tenant_id: event.tenant_id,
      },
    });

    // Activate boost immediately (trust Stripe redirect for now)
    await supabaseAdmin
      .from("events")
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
      })
      .eq("id", eventId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
