import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  company: z.string().trim().max(200).optional().default(""),
  org_type: z.string().trim().max(60).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  source_url: z.string().trim().max(500).optional().default(""),
  // Honeypot: must be empty
  website: z.string().max(0).optional().default(""),
});

// Simple in-memory rate limit (best-effort; resets per function instance)
const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + "|tx-eventshare-salt");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!checkRate(ip)) {
    return new Response(
      JSON.stringify({ error: "Te veel inzendingen. Probeer het later opnieuw." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let parsed;
  try {
    const json = await req.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return new Response(JSON.stringify({ error: "Ongeldige aanvraag" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validatiefout", details: parsed.error.flatten().fieldErrors }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const data = parsed.data;
  // Honeypot triggered → pretend success
  if (data.website && data.website.length > 0) {
    return new Response(JSON.stringify({ ok: true, id: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ip_hash = await hashIp(ip);
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const { data: row, error } = await supabase
    .from("form_submissions")
    .insert({
      form_type: "demo",
      contact_name: data.name,
      contact_email: data.email,
      contact_phone: data.phone || null,
      data: {
        company: data.company,
        org_type: data.org_type,
        message: data.message,
      },
      source_url: data.source_url || null,
      user_agent: userAgent,
      ip_hash,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submit-demo-form] insert error", error);
    return new Response(JSON.stringify({ error: "Opslaan mislukt" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, id: row.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
