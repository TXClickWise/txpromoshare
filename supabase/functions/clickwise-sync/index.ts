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
  const t = time || "00:00";
  return `${date}T${t.length === 5 ? t + ":00" : t}+02:00`;
}

function clampGhlEndTime(startISO: string, endISO: string): string {
  const startDate = startISO.split("T")[0];
  const endDate = endISO.split("T")[0];
  let clamped = endISO;
  if (endDate > startDate) {
    clamped = `${startDate}T23:55:00+02:00`;
  }
  // Round minutes down to nearest multiple of 5
  const timeMatch = clamped.match(/T(\d{2}):(\d{2})/);
  if (timeMatch) {
    const mins = parseInt(timeMatch[2], 10);
    const rounded = Math.floor(mins / 5) * 5;
    clamped = clamped.replace(/T(\d{2}):(\d{2})/, `T${timeMatch[1]}:${String(rounded).padStart(2, "0")}`);
  }
  return clamped;
}

function addHours(isoStr: string, hours: number): string {
  const d = new Date(isoStr);
  d.setTime(d.getTime() + hours * 3600000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+02:00`;
}

async function callGHL(endpoint: string, apiKey: string, body: Record<string, unknown>, method = "POST"): Promise<{ status: number; body: string; ok: boolean }> {
  try {
    const res = await fetch(endpoint, {
      method,
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

// Look up existing GHL appointment ID from previous successful sync
async function findExistingAppointmentId(supabase: any, connectionId: string, eventId: string, suffix = ""): Promise<string | null> {
  const eventType = suffix ? `event.occurrence_sync` : "event.calendar_sync";
  const { data } = await supabase
    .from("integration_events")
    .select("payload")
    .eq("connection_id", connectionId)
    .eq("event_id", eventId)
    .eq("event_type", eventType)
    .in("status", ["success", "failed"])
    .order("attempted_at", { ascending: false })
    .limit(10);

  if (!data) return null;
  for (const row of data) {
    const p = row.payload as any;
    if (suffix && p?._occurrence_id !== suffix) continue;
    if (p?.ghl_appointment_id) return p.ghl_appointment_id;
  }
  return null;
}

// Check if a GHL error is "Calendar is inactive"
function isCalendarInactiveError(body: string): boolean {
  try {
    const json = JSON.parse(body);
    const msg = (json?.message || json?.error || json?.msg || "").toLowerCase();
    return msg.includes("calendar is inactive") || msg.includes("calendar is not active");
  } catch {
    return body.toLowerCase().includes("calendar is inactive");
  }
}

// Create or update an appointment in GHL
async function syncAppointment(
  supabase: any,
  opts: {
    apiKey: string;
    calendarId: string;
    subaccountId: string;
    connectionId: string;
    eventId: string;
    contactId: string;
    title: string;
    startTime: string;
    endTime: string;
    address: string;
    notes: string;
    appointmentStatus: string;
    eventType: string;
    logEventType: string;
    occurrenceId?: string;
  },
): Promise<{ ok: boolean; appointmentId?: string; calendarInactive?: boolean }> {
  const existingId = await findExistingAppointmentId(supabase, opts.connectionId, opts.eventId, opts.occurrenceId || "");

  const appointmentBody: Record<string, unknown> = {
    calendarId: opts.calendarId,
    locationId: opts.subaccountId,
    contactId: opts.contactId,
    title: opts.title,
    startTime: opts.startTime,
    endTime: opts.endTime,
    address: opts.address || undefined,
    notes: opts.notes,
    appointmentStatus: opts.appointmentStatus,
    ignoreDateRange: true,
    ignoreFreeSlotValidation: true,
    toNotify: false,
    selectedTimezone: "Europe/Amsterdam",
  };

  let result: { ok: boolean; status: number; body: string };
  let method: string;
  if (existingId) {
    // PUT to update existing appointment
    method = "PUT";
    result = await callGHL(
      `${CLICKWISE_API_URL}/calendars/events/appointments/${existingId}`,
      opts.apiKey,
      appointmentBody,
      "PUT",
    );
    // If PUT returns 404, the appointment was deleted in GHL — fall back to POST
    if (!result.ok && result.status === 404) {
      console.log("Existing appointment not found in GHL, falling back to POST");
      method = "POST";
      result = await callGHL(
        `${CLICKWISE_API_URL}/calendars/events/appointments`,
        opts.apiKey,
        appointmentBody,
      );
    }
  } else {
    // POST to create new appointment
    method = "POST";
    result = await callGHL(
      `${CLICKWISE_API_URL}/calendars/events/appointments`,
      opts.apiKey,
      appointmentBody,
    );
    // If POST returns 400 (slot conflict / duplicate), try to find and update existing
    if (!result.ok && result.status === 400 && !isCalendarInactiveError(result.body)) {
      console.log("POST returned 400, attempting to find existing appointment via contacts endpoint");
      try {
        const searchRes = await fetch(
          `${CLICKWISE_API_URL}/contacts/${opts.contactId}/appointments`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${opts.apiKey}`,
              "Version": "2021-07-28",
            },
          },
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          console.log("Contact appointments response:", JSON.stringify(searchData).substring(0, 500));
          const appointments = searchData?.events || searchData?.appointments || [];
          // Find appointment matching this calendar
          const matchingAppt = appointments.find((a: any) => a.calendarId === opts.calendarId) || appointments[0];
          if (matchingAppt) {
            const apptId = matchingAppt.id || matchingAppt.appointmentId;
            if (apptId) {
              console.log("Found existing appointment, updating via PUT:", apptId);
              method = "PUT";
              result = await callGHL(
                `${CLICKWISE_API_URL}/calendars/events/appointments/${apptId}`,
                opts.apiKey,
                appointmentBody,
                "PUT",
              );
            }
          } else {
            console.log("No existing appointments found for contact, POST truly failed");
          }
        } else {
          console.error("Contact appointments search failed:", searchRes.status);
        }
      } catch (searchErr) {
        console.error("Failed to search for existing appointments:", searchErr);
      }
    }
  }

  // === Retry without ignoreDateRange if "Calendar is inactive" ===
  if (!result.ok && result.status === 400 && isCalendarInactiveError(result.body)) {
    console.log("Calendar inactive error detected — retrying WITHOUT ignoreDateRange");
    const retryBody = { ...appointmentBody };
    delete retryBody.ignoreDateRange;

    const endpoint = existingId
      ? `${CLICKWISE_API_URL}/calendars/events/appointments/${existingId}`
      : `${CLICKWISE_API_URL}/calendars/events/appointments`;
    const retryMethod = existingId ? "PUT" : "POST";

    const retryResult = await callGHL(endpoint, opts.apiKey, retryBody, retryMethod);
    if (retryResult.ok) {
      console.log("Retry without ignoreDateRange succeeded!");
      result = retryResult;
      method = retryMethod;
    } else {
      console.error("Retry without ignoreDateRange also failed:", retryResult.status, retryResult.body);
      // Keep original result for logging
    }
  }

  // Detect calendar inactive for return value
  const calendarInactive = !result.ok && result.status === 400 && isCalendarInactiveError(result.body);

  // Extract appointment ID from response
  let ghlAppointmentId: string | null = existingId;
  if (result.ok) {
    try {
      const json = JSON.parse(result.body);
      ghlAppointmentId = json?.id || json?.appointment?.id || ghlAppointmentId || null;
    } catch { /* */ }
  }

  const logPayload: Record<string, unknown> = {
    ...appointmentBody,
    ghl_appointment_id: ghlAppointmentId,
    _method: method,
    _existing_id: existingId || undefined, 
  };
  if (opts.occurrenceId) logPayload._occurrence_id = opts.occurrenceId;
  if (!result.ok) {
    logPayload._ghl_response = result.body;
    if (calendarInactive) logPayload._error_hint = "calendar_inactive_for_date";
  }

  await supabase.from("integration_events").insert({
    connection_id: opts.connectionId,
    event_id: opts.eventId,
    event_type: opts.logEventType,
    status: result.ok ? "success" : "failed",
    payload: logPayload as any,
    response_status: result.status,
  });

  return { ok: result.ok, appointmentId: ghlAppointmentId || undefined, calendarInactive };
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
    const calendarId = credentials?.calendar_id;
    const apiKey = connectionApiKey || CLICKWISE_API_KEY;

    if (!apiKey) {
      await supabase.from("integration_events").insert({
        connection_id, event_id: event_id || null, event_type,
        status: "failed", payload: data as any, response_status: 500,
      });
      return new Response(JSON.stringify({ error: "ClickWise API credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!calendarId) {
      await supabase.from("integration_events").insert({
        connection_id,
        event_id: event_id || null,
        event_type,
        status: "failed",
        payload: { ...(data || {}), error: "ClickWise calendar_id ontbreekt in de koppeling" } as any,
        response_status: 422,
      });

      return new Response(JSON.stringify({ error: "ClickWise calendar_id ontbreekt in de koppeling" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

        // === 1. Contact upsert (unique per event) ===
        const contactBody = {
          locationId: subaccountId,
          email: `event-${eventRow.slug}@${tenant_id}.txeventshare.local`,
          name: eventRow.title,
          tags: ["tx-eventshare", `tx-${event_type.replace(".", "-")}`, `tx-event-${eventRow.slug}`],
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

        let ghlContactId: string | null = null;
        try {
          const contactJson = JSON.parse(contactResult.body);
          ghlContactId = contactJson?.contact?.id || null;
        } catch { /* */ }

        await supabase.from("integration_events").insert({
          connection_id, event_id, event_type,
          status: contactResult.ok ? "success" : "failed",
          payload: contactBody as any,
          response_status: contactResult.status,
        });

        // === 2. Calendar appointment sync (create or update) ===
        const startTime = buildISODateTime(eventRow.start_date, eventRow.start_time);
        let endTime: string;
        if (eventRow.end_date && eventRow.end_time) {
          endTime = buildISODateTime(eventRow.end_date, eventRow.end_time);
        } else if (eventRow.end_date) {
          endTime = buildISODateTime(eventRow.end_date, eventRow.start_time);
        } else if (eventRow.end_time) {
          // end_time without end_date — check if it crosses midnight
          const endDate = eventRow.end_time < eventRow.start_time
            ? new Date(new Date(eventRow.start_date + "T00:00:00").getTime() + 86400000).toISOString().split("T")[0]
            : eventRow.start_date;
          endTime = buildISODateTime(endDate, eventRow.end_time);
        } else {
          endTime = addHours(startTime, 1);
        }
        endTime = clampGhlEndTime(startTime, endTime);

        const notes = [
          eventRow.short_description || eventRow.full_description || "",
          "",
          `🔗 ${eventUrl}`,
          imageUrl ? `🖼️ ${imageUrl}` : "",
          eventRow.whatsapp_share_text ? `📱 WhatsApp: ${eventRow.whatsapp_share_text}` : "",
          eventRow.social_share_text ? `📣 Social: ${eventRow.social_share_text}` : "",
        ].filter(Boolean).join("\n");

        let calResult = { ok: true, appointmentId: undefined as string | undefined };
        if (ghlContactId) {
          calResult = await syncAppointment(supabase, {
            apiKey,
            calendarId,
            subaccountId: subaccountId!,
            connectionId: connection_id,
            eventId: event_id,
            contactId: ghlContactId,
            title: eventRow.title,
            startTime,
            endTime,
            address: addressStr,
            notes,
            appointmentStatus: event_type === "event.ended" ? "cancelled" : "confirmed",
            eventType: event_type,
            logEventType: "event.calendar_sync",
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

        // === 3. Recurring occurrences sync ===
        let occurrenceSyncCount = 0;
        let occurrenceFailCount = 0;
        const shouldSyncOccurrences = event_type === "event.published" || event_type === "event.ended";
        if (eventRow.is_recurring && ghlContactId && shouldSyncOccurrences) {
          const { data: occurrences } = await supabase
            .from("event_occurrences")
            .select("*")
            .eq("event_id", event_id)
            .eq("tenant_id", tenant_id)
            .eq("status", "active")
            .order("occurrence_date", { ascending: true });

          if (occurrences && occurrences.length > 0) {
            for (const occ of occurrences) {
              const occStart = buildISODateTime(occ.occurrence_date, occ.start_time || eventRow.start_time);
              const effEndTime = occ.end_time || eventRow.end_time;
              const effStartTime = occ.start_time || eventRow.start_time;
              let occEnd: string;
              if (effEndTime) {
                const occEndDate = effEndTime < effStartTime
                  ? new Date(new Date(occ.occurrence_date + "T00:00:00").getTime() + 86400000).toISOString().split("T")[0]
                  : occ.occurrence_date;
                occEnd = buildISODateTime(occEndDate, effEndTime);
              } else {
                occEnd = addHours(occStart, 1);
              }

              const overrides = occ.overrides as any;
              const occTitle = overrides?.title || `${eventRow.title} – ${occ.label || occ.occurrence_date}`;

              const occResult = await syncAppointment(supabase, {
                apiKey,
                calendarId,
                subaccountId: subaccountId!,
                connectionId: connection_id,
                eventId: event_id,
                contactId: ghlContactId,
                title: occTitle,
                startTime: occStart,
                endTime: occEnd,
                address: addressStr,
                notes: `${notes}\n\n📅 Occurrence: ${occ.occurrence_date}${occ.label ? ` (${occ.label})` : ""}`,
                appointmentStatus: event_type === "event.ended" ? "cancelled" : "confirmed",
                eventType: event_type,
                logEventType: "event.occurrence_sync",
                occurrenceId: occ.id,
              });

              if (occResult.ok) occurrenceSyncCount++;
              else occurrenceFailCount++;
            }
          }
        }

        // Update last_sync_at
        await supabase
          .from("integration_connections")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", connection_id);

        return new Response(JSON.stringify({
          success: contactResult.ok && calResult.ok,
          contact_status: contactResult.ok ? "success" : "failed",
          calendar_status: calResult.ok ? "success" : "failed",
          calendar_inactive: calResult.calendarInactive || false,
          ghl_contact_status: contactResult.status,
          occurrences_synced: occurrenceSyncCount,
          occurrences_failed: occurrenceFailCount,
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
