import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMOJI_RULE = "Beperk emoji-gebruik tot maximaal 1-2 per tekst. De tekst moet menselijk en natuurlijk overkomen, niet AI-achtig. Geen opsommingen van emoji's.";

const SYSTEM_PROMPTS: Record<string, string> = {
  default: `Je bent een AI-assistent voor TX EventShare, een event management platform voor Nederlandse horeca. Antwoord altijd in het Nederlands. Wees beknopt en professioneel. ${EMOJI_RULE}`,

  quick_start: `Je bent een expert event-copywriter voor TX EventShare, een event promotie platform voor Nederlandse horeca.

Je ontvangt een kort eventidee en genereert een compleet event-voorstel.

Je output is altijd een JSON object met deze velden:
- title: pakkende eventtitel (max 80 tekens)
- subtitle: korte ondertitel (max 60 tekens)
- shortDescription: wervende korte beschrijving (max 160 tekens)
- fullDescription: volledige beschrijving (2-3 alinea's, wervend en informatief)
- categorySlug: één van: sport, proeverij, live-muziek, thema-avond, overig
- tags: kommagescheiden tags (5-8 stuks, zonder #)
- ctaText: call-to-action knoptekst (bijv. "Reserveer nu", "Tickets bestellen")
- socialText: social media post (max 280 tekens)
- whatsappText: WhatsApp bericht (max 500 tekens, informatief)
- seoTitle: SEO titel (max 60 tekens)
- seoDescription: SEO meta beschrijving (max 160 tekens)
- slug: URL-vriendelijke slug (lowercase, alleen a-z0-9 en streepjes)

Regels:
- Schrijf altijd in het Nederlands
- Maak het wervend maar niet overdreven
- Gebruik de merktoon als die is opgegeven
- ${EMOJI_RULE}
- Antwoord ALLEEN met valid JSON, geen andere tekst`,

  field_rewrite: `Je bent een expert copywriter voor TX EventShare. Je herschrijft of genereert teksten voor evenementen.

Regels:
- Schrijf altijd in het Nederlands
- Behoud de kernboodschap
- Pas de stijl aan op basis van de instructie
- Gebruik de merktoon als die is opgegeven
- ${EMOJI_RULE}
- Antwoord ALLEEN met de verbeterde/gegenereerde tekst, geen uitleg of aanhalingstekens`,

  pre_publish_check: `Je bent een event marketing expert en kwaliteitscontroleur voor TX EventShare.

Je analyseert een event en geeft praktische feedback. Je output is altijd een JSON object met:
- score: getal 0-100 (overall kwaliteitsscore)
- verdict: "excellent" | "good" | "needs_work" | "poor"
- checks: array van objecten met:
  - category: "completeness" | "clarity" | "promotion" | "seo" | "brand"
  - item: korte label (max 30 tekens)
  - status: "pass" | "warn" | "fail"
  - tip: korte concrete tip (max 80 tekens, alleen bij warn/fail)
- summary: 1-2 zinnen samenvatting van de belangrijkste verbeterpunten

Regels:
- Wees constructief, niet negatief
- Focus op praktische verbeteringen
- ${EMOJI_RULE}
- Antwoord ALLEEN met valid JSON`,

  distribution_content: `Je bent een expert copywriter voor TX EventShare, een event promotie platform voor Nederlandse horeca bedrijven en event organisatoren.

Je schrijft promotieteksten voor evenementen. Je output is altijd een JSON object met de volgende velden:
- whatsapp: WhatsApp bericht geschreven vanuit de organisator, gericht aan nieuwe en bestaande relaties. Informatief en uitnodigend. Max 500 tekens. Max 1 emoji.
- instagram: Instagram/Facebook post, visueel-gericht, met relevante hashtags, engaging voor 25-45 jaar. Max 2200 tekens. Max 2 emoji's.
- tiktok: TikTok caption, kort en energiek, casual toon voor 18-30 jaar, met trending hashtags. Max 2200 tekens. Max 2 emoji's.
- teaser: korte teaser voor stories of advertenties. Max 160 tekens, pakkend en uitnodigend. Geen emoji's.
- newsletter: nieuwsbrief introductie (2-3 zinnen, professioneel en enthousiast). Max 1 emoji.
- website: website promo snippet (2-3 zinnen, SEO-vriendelijk, zakelijk). Geen emoji's.
- promo: langere promotietekst (4-6 zinnen, overtuigend, details over het event). Max 1 emoji.
- gbp: Google Bedrijfsprofiel post, zakelijk, lokaal gericht, met locatie-informatie. Geen emoji's. Max 1500 tekens.

Regels:
- Schrijf altijd in het Nederlands
- Gebruik de tone of voice als die is opgegeven
- ${EMOJI_RULE}
- Schrijf menselijk, niet als een AI. Vermijd clichés en overdreven enthousiasme.
- Voeg altijd de event link toe waar relevant
- Antwoord ALLEEN met valid JSON, geen andere tekst`,

  rewrite_channel: `Je bent een expert copywriter voor TX EventShare. Je herschrijft promotieteksten voor evenementen.

Regels:
- Schrijf altijd in het Nederlands
- Behoud de kernboodschap maar verbeter de tekst
- Pas de stijl aan op basis van de instructie
- ${EMOJI_RULE}
- Antwoord ALLEEN met de herschreven tekst, geen uitleg`,

  visitor_whatsapp: `Je bent een copywriter voor TX EventShare. Je schrijft een kort WhatsApp bericht vanuit een bezoeker die een vriend uitnodigt om samen naar een event te gaan.

Regels:
- Schrijf vanuit het perspectief van een vriend die het event doorgeeft
- Persoonlijk en informeel, alsof een echte vriend het stuurt
- Nodig uit om samen te gaan
- Max 1 emoji
- Max 200 tekens exclusief de link
- Schrijf menselijk, niet als een AI
- Antwoord ALLEEN met de tekst, geen uitleg of aanhalingstekens`,

  stock_suggest: `Je bent een beeldredacteur voor TX EventShare. Je suggereert zoektermen voor stockfoto's.

Je output is altijd een JSON object met:
- keywords: array van 3-5 Engelse zoektermen voor stockfoto-databases (Unsplash/Pexels)
- reason: korte Nederlandse uitleg waarom deze zoektermen passen (max 60 tekens)

Regels:
- Zoektermen moeten in het Engels zijn (stockfoto-databases werken het best in het Engels)
- Kies termen die visueel relevante, sfeervolle beelden opleveren
- Vermijd te generieke termen
- Antwoord ALLEEN met valid JSON`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, task } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = SYSTEM_PROMPTS[task] || SYSTEM_PROMPTS.default;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-tegoed op. Voeg credits toe via Instellingen." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(
        JSON.stringify({ error: "AI service niet beschikbaar" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || "";

    // Clean markdown code blocks if present
    result = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    return new Response(JSON.stringify({ result, task }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI assist error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
