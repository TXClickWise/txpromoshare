// Fan-out SMS/WhatsApp notifications via GHL/ClickWise.
// Sends event notifications to all subscribers in their preferred language.

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const rawApiUrl = Deno.env.get("CLICKWISE_API_URL");
const CLICKWISE_API_URL = (rawApiUrl && rawApiUrl.startsWith("http")) ? rawApiUrl : GHL_BASE_URL;

export interface FanOutConfig {
  apiKey: string;
  locationId: string;
  subscriberTag: string;
  languageFieldKey: string;
  channelFieldKey: string;
  venueName: string;
}

export interface FanOutEventData {
  title: string;
  date: string;
  location: string;
  description: string;
  url: string;
}

export type FanOutAction = "published" | "updated" | "ended";
export type Lang = "nl" | "fy" | "de" | "en";
export type ChannelType = "SMS" | "WhatsApp";

export interface FanOutResult {
  enabled: boolean;
  subscribers_found: number;
  sms_sent: number;
  whatsapp_sent: number;
  failed: number;
  errors: string[];
}

/**
 * Format a date string ("YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss") to
 * "weekday DD-MM-YYYY" in the given language. Time is omitted.
 */
function formatDateLocalized(dateStr: string, lang: Lang): string {
  if (!dateStr) return "";
  const datePart = dateStr.split(" ")[0].split("T")[0];
  const parts = datePart.split("-");
  if (parts.length !== 3) return datePart;
  const [year, month, day] = parts;
  const date = new Date(`${year}-${month}-${day}T12:00:00`);
  const dayOfWeek = date.getDay();
  const dayNames: Record<Lang, string[]> = {
    nl: ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
    fy: ["snein", "moandei", "tiisdei", "woansdei", "tongersdei", "freed", "sneon"],
    de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  };
  const dayName = dayNames[lang]?.[dayOfWeek] || dayNames.nl[dayOfWeek];
  return `${dayName} ${day}-${month}-${year}`;
}

export function buildSmsMessage(
  action: FanOutAction,
  lang: Lang,
  event: FanOutEventData,
  _subscriberName?: string,
): string {
  const v = { ...event, venueName: "" };
  const templates: Record<FanOutAction, Record<Lang, string>> = {
    published: {
      nl: `🎉 Nieuw evenement bij {venueName}!\n\n{title}\n📅 {date}\n📍 {location}\n\n{description}\n\nMeer info: {url}`,
      fy: `🎉 Nij evenemint by {venueName}!\n\n{title}\n📅 {date}\n📍 {location}\n\n{description}\n\nMear ynfo: {url}`,
      de: `🎉 Neue Veranstaltung im {venueName}!\n\n{title}\n📅 {date}\n📍 {location}\n\n{description}\n\nMehr Infos: {url}`,
      en: `🎉 New event at {venueName}!\n\n{title}\n📅 {date}\n📍 {location}\n\n{description}\n\nMore info: {url}`,
    },
    updated: {
      nl: `ℹ️ Evenement gewijzigd bij {venueName}:\n\n{title}\n📅 {date}\n📍 {location}\n\nBekijk de details: {url}`,
      fy: `ℹ️ Evenemint wizige by {venueName}:\n\n{title}\n📅 {date}\n📍 {location}\n\nSjoch de details: {url}`,
      de: `ℹ️ Veranstaltung geändert im {venueName}:\n\n{title}\n📅 {date}\n📍 {location}\n\nDetails: {url}`,
      en: `ℹ️ Event updated at {venueName}:\n\n{title}\n📅 {date}\n📍 {location}\n\nDetails: {url}`,
    },
    ended: {
      nl: `❌ Evenement geannuleerd bij {venueName}:\n\n{title}\n📅 {date}\n\nDit evenement gaat helaas niet door.\nBekijk de agenda voor andere evenementen: {url}`,
      fy: `❌ Evenemint ôfsein by {venueName}:\n\n{title}\n📅 {date}\n\nDit evenemint giet spitigernôch net troch.\nSjoch de aginda foar oare eveneminten: {url}`,
      de: `❌ Veranstaltung abgesagt im {venueName}:\n\n{title}\n📅 {date}\n\nDiese Veranstaltung findet leider nicht statt.\nWeitere Veranstaltungen: {url}`,
      en: `❌ Event cancelled at {venueName}:\n\n{title}\n📅 {date}\n\nUnfortunately this event has been cancelled.\nCheck the agenda for other events: {url}`,
    },
  };
  void v;
  let tpl = templates[action][lang] ?? templates[action].nl;
  tpl = tpl
    .replaceAll("{venueName}", event.location ? event.location : "")
    .replaceAll("{title}", event.title || "")
    .replaceAll("{date}", formatDateLocalized(event.date || "", lang))
    .replaceAll("{location}", event.location || "")
    .replaceAll("{description}", event.description || "")
    .replaceAll("{url}", event.url || "");
  // Filter out empty lines (e.g., when description is empty)
  return tpl
    .split("\n")
    .filter((line, idx, arr) => {
      if (line.trim() !== "") return true;
      // Keep blank line only if surrounded by non-blank lines and not duplicate
      const prev = arr[idx - 1]?.trim();
      const next = arr[idx + 1]?.trim();
      return prev && next;
    })
    .join("\n");
}

// Override venueName interpolation properly
export function buildSmsMessageWithVenue(
  action: FanOutAction,
  lang: Lang,
  event: FanOutEventData,
  venueName: string,
): string {
  const templates: Record<FanOutAction, Record<Lang, string>> = {
    published: {
      nl: `🎉 Nieuw evenement bij {venueName}!\n\n{title}\n📅 {date}\n📍 {location}\n\n{description}\n\nMeer info: {url}`,
      fy: `🎉 Nij evenemint by {venueName}!\n\n{title}\n📅 {date}\n📍 {location}\n\n{description}\n\nMear ynfo: {url}`,
      de: `🎉 Neue Veranstaltung im {venueName}!\n\n{title}\n📅 {date}\n📍 {location}\n\n{description}\n\nMehr Infos: {url}`,
      en: `🎉 New event at {venueName}!\n\n{title}\n📅 {date}\n📍 {location}\n\n{description}\n\nMore info: {url}`,
    },
    updated: {
      nl: `ℹ️ Evenement gewijzigd bij {venueName}:\n\n{title}\n📅 {date}\n📍 {location}\n\nBekijk de details: {url}`,
      fy: `ℹ️ Evenemint wizige by {venueName}:\n\n{title}\n📅 {date}\n📍 {location}\n\nSjoch de details: {url}`,
      de: `ℹ️ Veranstaltung geändert im {venueName}:\n\n{title}\n📅 {date}\n📍 {location}\n\nDetails: {url}`,
      en: `ℹ️ Event updated at {venueName}:\n\n{title}\n📅 {date}\n📍 {location}\n\nDetails: {url}`,
    },
    ended: {
      nl: `❌ Evenement geannuleerd bij {venueName}:\n\n{title}\n📅 {date}\n\nDit evenement gaat helaas niet door.\nBekijk de agenda voor andere evenementen: {url}`,
      fy: `❌ Evenemint ôfsein by {venueName}:\n\n{title}\n📅 {date}\n\nDit evenemint giet spitigernôch net troch.\nSjoch de aginda foar oare eveneminten: {url}`,
      de: `❌ Veranstaltung abgesagt im {venueName}:\n\n{title}\n📅 {date}\n\nDiese Veranstaltung findet leider nicht statt.\nWeitere Veranstaltungen: {url}`,
      en: `❌ Event cancelled at {venueName}:\n\n{title}\n📅 {date}\n\nUnfortunately this event has been cancelled.\nCheck the agenda for other events: {url}`,
    },
  };
  let tpl = templates[action][lang] ?? templates[action].nl;
  tpl = tpl
    .replaceAll("{venueName}", venueName || "")
    .replaceAll("{title}", event.title || "")
    .replaceAll("{date}", formatDateLocalized(event.date || "", lang))
    .replaceAll("{location}", event.location || "")
    .replaceAll("{description}", event.description || "")
    .replaceAll("{url}", event.url || "");
  return tpl
    .split("\n")
    .filter((line, idx, arr) => {
      if (line.trim() !== "") return true;
      const prev = arr[idx - 1]?.trim();
      const next = arr[idx + 1]?.trim();
      return Boolean(prev && next);
    })
    .join("\n");
}

export async function fetchSubscribers(
  apiKey: string,
  locationId: string,
  tag: string,
): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  const pageLimit = 100;
  const maxPages = 5; // max 500 subscribers

  for (let p = 0; p < maxPages; p++) {
    try {
      const searchBody = {
        locationId,
        page,
        pageLimit,
        filters: [
          {
            group: "AND",
            filters: [
              {
                field: "tags",
                operator: "contains",
                value: tag,
              },
            ],
          },
        ],
      };

      console.log(`[fan-out] Searching subscribers page ${page}, tag="${tag}", location=${locationId}`);

      const res = await fetch(`${CLICKWISE_API_URL}/contacts/search`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Version": "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[fan-out] Search failed (page ${page}):`, res.status, errorText);

        // Fallback: probeer GET /contacts/ met handmatige tag-filtering
        if (page === 1) {
          console.log("[fan-out] Trying fallback: GET /contacts/ with client-side tag filtering");
          return await fetchSubscribersFallback(apiKey, locationId, tag);
        }
        break;
      }

      const data = await res.json();
      const contacts: any[] = data?.contacts || [];
      console.log(`[fan-out] Page ${page}: found ${contacts.length} contacts`);
      all.push(...contacts);

      if (contacts.length < pageLimit) break;
      page++;
    } catch (err) {
      console.error(`[fan-out] Search error (page ${page}):`, err);

      if (page === 1) {
        console.log("[fan-out] Trying fallback after error");
        return await fetchSubscribersFallback(apiKey, locationId, tag);
      }
      break;
    }
  }

  return all.filter((c) => !(c?.email || "").includes("@txeventshare.local"));
}

/**
 * Fallback: haal alle contacten op via GET en filter op tag in code.
 * Wordt alleen gebruikt als POST /contacts/search niet werkt.
 */
async function fetchSubscribersFallback(
  apiKey: string,
  locationId: string,
  tag: string,
): Promise<any[]> {
  const all: any[] = [];
  let startAfterId = "";
  const limit = 100;
  const maxPages = 5;

  for (let page = 0; page < maxPages; page++) {
    try {
      let url = `${CLICKWISE_API_URL}/contacts/?locationId=${encodeURIComponent(locationId)}&limit=${limit}`;
      if (startAfterId) {
        url += `&startAfterId=${encodeURIComponent(startAfterId)}`;
      }

      console.log(`[fan-out fallback] Fetching contacts page ${page}`);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Version": "2021-07-28",
        },
      });

      if (!res.ok) {
        console.error(`[fan-out fallback] Failed (page ${page}):`, res.status);
        break;
      }

      const data = await res.json();
      const contacts: any[] = data?.contacts || [];
      console.log(`[fan-out fallback] Page ${page}: fetched ${contacts.length} contacts`);

      const tagged = contacts.filter((c) =>
        Array.isArray(c?.tags) && c.tags.some((t: any) => String(t).toLowerCase() === tag.toLowerCase())
      );
      all.push(...tagged);

      if (contacts.length < limit) break;

      const lastContact = contacts[contacts.length - 1];
      startAfterId = lastContact?.id || "";
      if (!startAfterId) break;
    } catch (err) {
      console.error(`[fan-out fallback] Error (page ${page}):`, err);
      break;
    }
  }

  return all.filter((c) => !(c?.email || "").includes("@txeventshare.local"));
}

function getCustomFieldValue(contact: any, key: string): string | null {
  const fields = contact?.customFields || contact?.customField || [];
  if (!Array.isArray(fields)) return null;
  for (const f of fields) {
    const k = f?.key || f?.field_key || f?.fieldKey || f?.name;
    if (typeof k === "string" && k.toLowerCase() === key.toLowerCase()) {
      const v = f?.value ?? f?.field_value ?? f?.fieldValue;
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return null;
}

export function detectChannel(contact: any, channelFieldKey: string): ChannelType {
  const cf = getCustomFieldValue(contact, channelFieldKey);
  if (cf) {
    const v = cf.toLowerCase();
    if (v === "whatsapp" || v === "beide" || v === "both") return "WhatsApp";
    if (v === "sms") return "SMS";
  }
  const tags: string[] = (contact?.tags || []).map((t: any) => String(t).toLowerCase());
  if (tags.includes("channel-whatsapp")) return "WhatsApp";
  if (tags.includes("channel-sms")) return "SMS";
  return "SMS";
}

export function detectLanguage(contact: any, languageFieldKey: string): Lang {
  const v = getCustomFieldValue(contact, languageFieldKey)
    || getCustomFieldValue(contact, "preferred_language");
  if (!v) return "nl";
  const lower = v.toLowerCase();
  if (["nl", "nederlands", "dutch"].includes(lower)) return "nl";
  if (["fy", "frysk", "fries", "frisian"].includes(lower)) return "fy";
  if (["de", "deutsch", "duits", "german"].includes(lower)) return "de";
  if (["en", "english", "engels"].includes(lower)) return "en";
  return "nl";
}

export async function sendMessage(
  apiKey: string,
  contactId: string,
  message: string,
  channelType: ChannelType,
): Promise<{ ok: boolean; status: number; body: string; errorDetail: string }> {
  try {
    const requestBody = { type: channelType, contactId, message };
    console.log(`[fan-out] Sending ${channelType} to contact ${contactId}`);
    console.log(`[fan-out] Request body:`, JSON.stringify(requestBody));

    const res = await fetch(`${CLICKWISE_API_URL}/conversations/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    console.log(`[fan-out] Response for ${contactId}: status=${res.status}, body=${responseText.substring(0, 500)}`);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        body: responseText,
        errorDetail: `HTTP ${res.status}: ${responseText.substring(0, 300)}`,
      };
    }
    return { ok: true, status: res.status, body: responseText, errorDetail: "" };
  } catch (err) {
    const errMsg = String(err);
    console.error(`[fan-out] Send error for ${contactId}:`, errMsg);
    return { ok: false, status: 0, body: errMsg, errorDetail: `Exception: ${errMsg.substring(0, 300)}` };
  }
}

export async function fanOutNotification(
  config: FanOutConfig,
  action: FanOutAction,
  eventData: FanOutEventData,
  supabase: any,
  connectionId: string,
  eventId: string,
): Promise<FanOutResult> {
  const result: FanOutResult = {
    enabled: true,
    subscribers_found: 0,
    sms_sent: 0,
    whatsapp_sent: 0,
    failed: 0,
    errors: [],
  };

  try {
    const subscribers = await fetchSubscribers(config.apiKey, config.locationId, config.subscriberTag);
    result.subscribers_found = subscribers.length;

    for (const sub of subscribers) {
      const phone = sub?.phone;
      if (!phone) continue;
      const lang = detectLanguage(sub, config.languageFieldKey);
      const channel = detectChannel(sub, config.channelFieldKey);
      const message = buildSmsMessageWithVenue(action, lang, eventData, config.venueName);
      const sendResult = await sendMessage(config.apiKey, sub.id, message, channel);
      if (sendResult.ok) {
        if (channel === "WhatsApp") result.whatsapp_sent++;
        else result.sms_sent++;
      } else {
        result.failed++;
        result.errors.push(`${sub.id}:${channel}:${sendResult.errorDetail}`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch (err) {
    console.error("fanOutNotification error:", err);
    result.errors.push(String(err));
  }

  try {
    await supabase.from("integration_events").insert({
      connection_id: connectionId,
      event_id: eventId,
      event_type: "fan_out.notification",
      status: result.failed === 0 ? "success" : (result.sms_sent > 0 || result.whatsapp_sent > 0 ? "partial" : "failed"),
      payload: {
        action,
        enabled: true,
        subscribers_found: result.subscribers_found,
        sms_sent: result.sms_sent,
        whatsapp_sent: result.whatsapp_sent,
        failed: result.failed,
        errors: result.errors.slice(0, 10),
      } as any,
      response_status: result.failed === 0 ? 200 : 207,
    });
  } catch (err) {
    console.error("fan-out logging error:", err);
  }

  return result;
}