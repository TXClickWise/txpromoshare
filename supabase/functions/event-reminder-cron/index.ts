import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fanOutNotification } from "./fan-out-sms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") || "https://txeventshare.nl";

/**
 * Format a Date as YYYY-MM-DD / HH:mm:ss in Europe/Amsterdam timezone.
 * Events in DB are stored in local Amsterdam time, so we must compare in that tz.
 */
function toAmsterdamParts(d: Date): { date: string; time: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}:${parts.second}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const results: Array<{ event_id: string; tenant_id: string; status: string; detail: string }> = [];

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 105 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 135 * 60 * 1000);

    const ws = toAmsterdamParts(windowStart);
    const we = toAmsterdamParts(windowEnd);

    console.log(`[reminder-cron] Window (Amsterdam): ${ws.date} ${ws.time} → ${we.date} ${we.time}`);

    interface ReminderCandidate {
      eventId: string;
      tenantId: string;
      title: string;
      slug: string;
      startDate: string;
      startTime: string;
      description: string;
      venueName: string;
      venueCity: string;
    }

    const candidates: ReminderCandidate[] = [];

    const inWindow = (date: string, time: string): boolean => {
      const t = (time || "00:00:00").substring(0, 8);
      if (ws.date === we.date) {
        return date === ws.date && t >= ws.time && t <= we.time;
      }
      if (date === ws.date) return t >= ws.time;
      if (date === we.date) return t <= we.time;
      return false;
    };

    // 1. Single (non-recurring) events
    const dates = ws.date === we.date ? [ws.date] : [ws.date, we.date];
    const { data: singleEvents, error: singleError } = await supabase
      .from("events")
      .select(`
        id, title, slug, start_date, start_time, short_description, whatsapp_share_text, tenant_id,
        venues:venue_id ( name, city ),
        is_recurring
      `)
      .eq("status", "published")
      .eq("is_recurring", false)
      .in("start_date", dates);

    if (singleError) console.error("[reminder-cron] single events error:", singleError);

    for (const ev of singleEvents || []) {
      const t = String(ev.start_time || "00:00:00").substring(0, 8).padEnd(8, "0");
      if (!inWindow(ev.start_date, t)) continue;
      const venue = ev.venues as any;
      candidates.push({
        eventId: ev.id,
        tenantId: ev.tenant_id,
        title: ev.title,
        slug: ev.slug,
        startDate: ev.start_date,
        startTime: t,
        description: ev.whatsapp_share_text || ev.short_description || "",
        venueName: venue?.name || "",
        venueCity: venue?.city || "",
      });
    }

    // 2. Recurring occurrences
    const { data: occurrences, error: occError } = await supabase
      .from("event_occurrences")
      .select(`
        id, event_id, occurrence_date, start_time, tenant_id,
        events:event_id (
          id, title, slug, short_description, whatsapp_share_text, start_time,
          venues:venue_id ( name, city )
        )
      `)
      .eq("status", "active")
      .in("occurrence_date", dates);

    if (occError) console.error("[reminder-cron] occurrences error:", occError);

    for (const occ of occurrences || []) {
      const ev = (occ as any).events;
      if (!ev) continue;
      const t = String(occ.start_time || ev.start_time || "00:00:00").substring(0, 8).padEnd(8, "0");
      if (!inWindow(occ.occurrence_date, t)) continue;
      const venue = ev.venues as any;
      candidates.push({
        eventId: ev.id,
        tenantId: occ.tenant_id,
        title: ev.title,
        slug: ev.slug,
        startDate: occ.occurrence_date,
        startTime: t,
        description: ev.whatsapp_share_text || ev.short_description || "",
        venueName: venue?.name || "",
        venueCity: venue?.city || "",
      });
    }

    console.log(`[reminder-cron] ${candidates.length} candidate(s)`);

    for (const c of candidates) {
      // Dedupe: skip if reminder already logged for this event+date
      const { data: existing } = await supabase
        .from("integration_events")
        .select("id")
        .eq("event_id", c.eventId)
        .eq("event_type", "fan_out.reminder")
        .gte("attempted_at", c.startDate + "T00:00:00")
        .lte("attempted_at", c.startDate + "T23:59:59")
        .limit(1);

      if (existing && existing.length > 0) {
        results.push({ event_id: c.eventId, tenant_id: c.tenantId, status: "skipped", detail: "already_sent" });
        continue;
      }

      const { data: connection } = await supabase
        .from("integration_connections")
        .select("id, credentials_encrypted, subaccount_id")
        .eq("tenant_id", c.tenantId)
        .eq("provider", "clickwise")
        .eq("status", "connected")
        .maybeSingle();

      if (!connection) {
        results.push({ event_id: c.eventId, tenant_id: c.tenantId, status: "skipped", detail: "no_connection" });
        continue;
      }

      const credentials = (connection.credentials_encrypted || {}) as any;
      const apiKey = credentials.api_key;
      const fanOutEnabled = credentials.fan_out_enabled === true;

      if (!fanOutEnabled || !apiKey) {
        results.push({ event_id: c.eventId, tenant_id: c.tenantId, status: "skipped", detail: "fan_out_disabled" });
        continue;
      }

      const locationStr = [c.venueName, c.venueCity].filter(Boolean).join(", ");
      const tenantEventUrlTemplate = credentials?.event_page_url_template;
      const eventUrl = tenantEventUrlTemplate
        ? String(tenantEventUrlTemplate).replace("{slug}", c.slug)
        : `${PUBLIC_APP_URL}/e/${c.slug}`;

      const fanOutConfig = {
        apiKey,
        locationId: connection.subaccount_id!,
        subscriberTag: credentials.subscriber_tag || "events",
        languageFieldKey: credentials.language_field_key || "voorkeurstaal",
        channelFieldKey: credentials.channel_field_key || "notification_channel",
        venueName: credentials.venue_name || c.venueName || "Evenement",
      };

      const fanOutEventData = {
        title: c.title,
        date: c.startDate,
        startTime: c.startTime.substring(0, 5),
        location: locationStr,
        description: c.description,
        url: eventUrl,
      };

      console.log(`[reminder-cron] Sending reminder for "${c.title}" (${c.eventId})`);

      const fanOutResult = await fanOutNotification(
        fanOutConfig,
        "reminder",
        fanOutEventData,
        supabase,
        connection.id,
        c.eventId,
      );

      // Log a dedicated reminder marker (also used for dedupe)
      await supabase.from("integration_events").insert({
        connection_id: connection.id,
        event_id: c.eventId,
        event_type: "fan_out.reminder",
        status: fanOutResult.failed === 0 ? "success" : (fanOutResult.sms_sent + fanOutResult.whatsapp_sent > 0 ? "partial" : "failed"),
        payload: {
          action: "reminder",
          start_date: c.startDate,
          start_time: c.startTime,
          subscribers_found: fanOutResult.subscribers_found,
          sms_sent: fanOutResult.sms_sent,
          whatsapp_sent: fanOutResult.whatsapp_sent,
          failed: fanOutResult.failed,
          skipped_unsubscribed: fanOutResult.skipped_unsubscribed,
          errors: fanOutResult.errors.slice(0, 10),
        } as any,
        response_status: fanOutResult.failed === 0 ? 200 : 207,
      });

      results.push({
        event_id: c.eventId,
        tenant_id: c.tenantId,
        status: "sent",
        detail: `${fanOutResult.sms_sent} SMS, ${fanOutResult.whatsapp_sent} WA, ${fanOutResult.failed} failed`,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      checked_at: now.toISOString(),
      window: { start_local: `${ws.date} ${ws.time}`, end_local: `${we.date} ${we.time}` },
      candidates_found: candidates.length,
      results,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[reminder-cron] Fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});