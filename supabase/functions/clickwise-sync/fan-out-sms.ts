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
    .replaceAll("{date}", event.date || "")
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
    .replaceAll("{date}", event.date || "")
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
  const limit = 100;
  for (let page = 0; page < 5; page++) {
    const offset = page * limit;
    const url = `${CLICKWISE_API_URL}/contacts/?locationId=${encodeURIComponent(locationId)}&limit=${limit}&offset=${offset}&query=&tag=${encodeURIComponent(tag)}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Version": "2021-07-28",
        },
      });
      if (!res.ok) {
        console.error("fetchSubscribers failed:", res.status, await res.text());
        break;
      }
      const json = await res.json();
      const contacts = json?.contacts || [];
      if (!Array.isArray(contacts) || contacts.length === 0) break;
      all.push(...contacts);
      if (contacts.length < limit) break;
    } catch (err) {
      console.error("fetchSubscribers error:", err);
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
): Promise<boolean> {
  try {
    const res = await fetch(`${CLICKWISE_API_URL}/conversations/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: channelType, contactId, message }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("sendMessage failed:", channelType, res.status, t);
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendMessage error:", err);
    return false;
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
      const ok = await sendMessage(config.apiKey, sub.id, message, channel);
      if (ok) {
        if (channel === "WhatsApp") result.whatsapp_sent++;
        else result.sms_sent++;
      } else {
        result.failed++;
        result.errors.push(`${sub.id}:${channel}`);
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
      status: result.failed === 0 ? "success" : (result.sms_sent + result.whatsapp_sent > 0 ? "success" : "failed"),
      payload: { action, ...result } as any,
      response_status: 200,
    });
  } catch (err) {
    console.error("fan-out logging error:", err);
  }

  return result;
}