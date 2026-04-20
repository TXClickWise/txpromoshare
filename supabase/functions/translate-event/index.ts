// Translate event content (basis + promo + SEO) into target language using Lovable AI.
// Returns structured JSON via tool calling. NL is always the source.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANGUAGE_NAMES: Record<string, string> = {
  fy: "Frisian (Frysk)",
  de: "German (Deutsch)",
  en: "English",
  nl: "Dutch (Nederlands)",
};

interface RequestBody {
  targetLanguage: "fy" | "de" | "en";
  source: {
    title?: string | null;
    subtitle?: string | null;
    short_description?: string | null;
    full_description?: string | null;
    cta_button_text?: string | null;
    whatsapp_share_text?: string | null;
    social_share_text?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const body = (await req.json()) as RequestBody;
    if (!body?.targetLanguage || !["fy", "de", "en"].includes(body.targetLanguage)) {
      return new Response(JSON.stringify({ error: "Invalid targetLanguage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.source) {
      return new Response(JSON.stringify({ error: "Missing source" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetName = LANGUAGE_NAMES[body.targetLanguage];

    const systemPrompt = `You translate Dutch event marketing copy for TX EventShare into ${targetName}.
Rules:
- Keep tone warm, professional, hospitality-friendly.
- Do NOT add new information that is not in the source.
- Maximum 1-2 emojis per text — only if they exist in the source or clearly fit.
- Keep CTA button short (1-3 words).
- SEO title max 60 chars, SEO description max 160 chars.
- WhatsApp text: short, punchy, conversational.
- Social text: catchy, can include 1 hashtag if natural.
- Return null for fields that are empty in the source.
- Preserve URLs, prices, dates, and proper names exactly.`;

    const userPrompt = `Translate the following Dutch event content to ${targetName}. Return structured output only.\n\n${JSON.stringify(body.source, null, 2)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_translation",
              description: "Return the translated event content fields.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: ["string", "null"] },
                  subtitle: { type: ["string", "null"] },
                  short_description: { type: ["string", "null"] },
                  full_description: { type: ["string", "null"] },
                  cta_button_text: { type: ["string", "null"] },
                  whatsapp_share_text: { type: ["string", "null"] },
                  social_share_text: { type: ["string", "null"] },
                  seo_title: { type: ["string", "null"] },
                  seo_description: { type: ["string", "null"] },
                },
                required: [
                  "title",
                  "subtitle",
                  "short_description",
                  "full_description",
                  "cta_button_text",
                  "whatsapp_share_text",
                  "social_share_text",
                  "seo_title",
                  "seo_description",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_translation" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "AI rate limit reached. Probeer het over een minuut opnieuw." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI-tegoed op. Voeg credits toe in je workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ error: "No translation returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = typeof args === "string" ? JSON.parse(args) : args;

    return new Response(JSON.stringify({ translation: parsed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-event error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
