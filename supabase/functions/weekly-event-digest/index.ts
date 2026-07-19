import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  fetchSubscribers,
  detectLanguage,
  detectChannel,
  sendMessage,
  buildDigestMessage,
  markUnsubscribed,
  type DigestEvent,
} from "./fan-out-sms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") || "https://txeventshare.nl";

function amsterdamDate(d: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const results: Array<{ tenant_id: string; status: string; detail: string }> = [];

  try {
    const now = new Date();
    const today = amsterdamDate(now);
    const nextWeekStr = amsterdamDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

    console.log(`[weekly-digest] Window ${today} → ${nextWeekStr}`);

    const { data: connections, error: connError } = await supabase
      .from("integration_connections")
      .select("id, tenant_id, subaccount_id, credentials_encrypted")
      .eq("provider", "clickwise")
      .eq("status", "connected");

    if (connError) {
      console.error("[weekly-digest] Failed to fetch connections:", connError);
      return new Response(JSON.stringify({ error: "Failed to fetch connections" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const activeConnections = (connections || []).filter((c) => {
      const creds = c.credentials_encrypted as any;
      return creds?.fan_out_enabled === true && creds?.api_key;
    });

    console.log(`[weekly-digest] ${activeConnections.length} active fan-out tenants`);

    for (const connection of activeConnections) {
      const credentials = connection.credentials_encrypted as any;
      const apiKey = credentials.api_key as string;
      const tenantId = connection.tenant_id as string;

      const { data: existingDigest } = await supabase
        .from("integration_events")
        .select("id")
        .eq("connection_id", connection.id)
        .eq("event_type", "fan_out.weekly_digest")
        .gte("attempted_at", today + "T00:00:00")
        .limit(1);

      if (existingDigest && existingDigest.length > 0) {
        console.log(`[weekly-digest] Already sent today for ${tenantId}, skip`);
        results.push({ tenant_id: tenantId, status: "skipped", detail: "already_sent_today" });
        continue;
      }

      const { data: singleEvents } = await supabase
        .from("events")
        .select(`id, title, slug, start_date, start_time, venues:venue_id ( name, city )`)
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .eq("is_recurring", false)
        .gte("start_date", today)
        .lte("start_date", nextWeekStr)
        .order("start_date", { ascending: true });

      const { data: occurrences } = await supabase
        .from("event_occurrences")
        .select(`
          id, occurrence_date, start_time,
          events:event_id ( id, title, slug, start_time, venues:venue_id ( name, city ) )
        `)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .gte("occurrence_date", today)
        .lte("occurrence_date", nextWeekStr)
        .order("occurrence_date", { ascending: true });

      interface Item { title: string; date: string; startTime: string; location: string; slug: string; }
      const items: Item[] = [];

      for (const ev of singleEvents || []) {
        const venue = (ev as any).venues;
        items.push({
          title: ev.title,
          date: ev.start_date,
          startTime: ev.start_time ? String(ev.start_time).substring(0, 5) : "",
          location: [venue?.name, venue?.city].filter(Boolean).join(", "),
          slug: ev.slug,
        });
      }

      for (const occ of occurrences || []) {
        const ev = (occ as any).events;
        if (!ev) continue;
        const venue = ev.venues;
        const t = String(occ.start_time || ev.start_time || "");
        items.push({
          title: ev.title,
          date: occ.occurrence_date,
          startTime: t ? t.substring(0, 5) : "",
          location: [venue?.name, venue?.city].filter(Boolean).join(", "),
          slug: ev.slug,
        });
      }

      items.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

      console.log(`[weekly-digest] Tenant ${tenantId}: ${items.length} events`);

      if (items.length === 0) {
        results.push({ tenant_id: tenantId, status: "skipped", detail: "no_events" });
        continue;
      }

      const subscribers = await fetchSubscribers(
        apiKey,
        connection.subaccount_id!,
        credentials.subscriber_tag || "events",
      );
      console.log(`[weekly-digest] Tenant ${tenantId}: ${subscribers.length} subscribers`);

      if (subscribers.length === 0) {
        results.push({ tenant_id: tenantId, status: "skipped", detail: "no_subscribers" });
        continue;
      }

      const tenantEventUrlTemplate = credentials?.event_page_url_template as string | undefined;
      const digestEvents: DigestEvent[] = items.map((ev) => ({
        title: ev.title,
        date: ev.date,
        startTime: ev.startTime,
        location: ev.location,
        url: tenantEventUrlTemplate
          ? tenantEventUrlTemplate.replace("{slug}", ev.slug)
          : `${PUBLIC_APP_URL}/e/${ev.slug}`,
      }));

      const venueName = credentials.venue_name || "Evenement";

      let sent = 0;
      let failed = 0;
      let skippedUnsubscribed = 0;
      const errors: string[] = [];

      for (const subscriber of subscribers) {
        if (!subscriber.phone) continue;
        const lang = detectLanguage(subscriber, credentials.language_field_key || "voorkeurstaal");
        const channel = detectChannel(subscriber, credentials.channel_field_key || "notification_channel");
        const message = buildDigestMessage(lang, digestEvents, venueName);
        if (!message) continue;
        const result = await sendMessage(apiKey, subscriber.id, message, channel);
        if (result.ok) {
          sent++;
        } else if (result.unsubscribed) {
          skippedUnsubscribed++;
          await markUnsubscribed(apiKey, subscriber.id);
        } else {
          failed++;
          errors.push(`${subscriber.id}:${channel}:${result.errorDetail || String(result.body).substring(0, 200)}`);
        }
        await new Promise((r) => setTimeout(r, 100));
      }

      await supabase.from("integration_events").insert({
        connection_id: connection.id,
        event_id: null,
        event_type: "fan_out.weekly_digest",
        status: failed === 0 ? "success" : (sent > 0 ? "partial" : "failed"),
        payload: {
          date: today,
          events_count: items.length,
          subscribers_found: subscribers.length,
          sent,
          failed,
          skipped_unsubscribed: skippedUnsubscribed,
          errors: errors.slice(0, 10),
        } as any,
        response_status: failed === 0 ? 200 : 207,
      });

      results.push({
        tenant_id: tenantId,
        status: "sent",
        detail: `${items.length} events, ${sent} sent, ${failed} failed, ${skippedUnsubscribed} unsubscribed`,
      });
    }

    return new Response(
      JSON.stringify({ success: true, date: today, tenants_processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[weekly-digest] Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});