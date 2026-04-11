

# Bug analyse — WhatsApp preview werkt niet

## Fout
WhatsApp toont geen afbeelding, verkeerde tekst en een zichtbare technische URL in plaats van een schone previewkaart.

## Vermoedelijke root cause
De `og-proxy` Edge Function retourneert de HTML correct, maar de Supabase edge runtime overschrijft de `Content-Type` header naar `text/plain` en voegt `Content-Security-Policy: default-src 'none'; sandbox` toe. WhatsApp's crawler parseert geen OG-tags uit `text/plain` responses — het vereist `text/html`.

Bewijs uit mijn test:
```text
Response headers van og-proxy:
  Content-Type: text/plain          ← FOUT, moet text/html zijn
  Content-Security-Policy: default-src 'none'; sandbox  ← Blokkeert crawlers
```

De HTML-inhoud zelf is perfect (correcte og:title, og:image, og:description met datum/tijd/locatie), maar WhatsApp ziet het niet als HTML.

## Betrokken files
- `supabase/functions/og-proxy/index.ts` — de Response headers worden overschreven door de runtime

## Buiten scope
- `DistributionPage.tsx` — logica is correct (stuurt ogProxyUrl naar WhatsApp)
- `ChannelBar.tsx` — logica is correct (stuurt alleen URL)
- Alle andere componenten, styling, routes

## Minimale fix

De Supabase edge runtime overschrijft headers bij bepaalde response-patronen. De fix is om de Response te construeren op een manier die de runtime respecteert:

1. **Gebruik `new Response()` met een `Headers` object** in plaats van een plain object — sommige edge runtime versies behandelen dit anders
2. **Voeg een expliciete `X-Content-Type-Options: nosniff` header toe** om te voorkomen dat de runtime het content-type wijzigt
3. **Test na deploy** met `curl -I` om te verifiëren dat `Content-Type: text/html` daadwerkelijk wordt geretourneerd
4. **Als de runtime het blijft overschrijven**: migreer naar een `new Response(readable_stream, ...)` patroon, of gebruik een alternatieve serve-methode (`Deno.serve` i.p.v. de `std/http/server` `serve`)

## Verificatie
1. Deploy de aangepaste og-proxy
2. Test met `curl -I` dat `Content-Type: text/html` wordt geretourneerd
3. Test de og-proxy URL in de WhatsApp link preview debugger of door een nieuw bericht te sturen
4. Bevestig dat de previewkaart verschijnt met afbeelding, titel en beschrijving

