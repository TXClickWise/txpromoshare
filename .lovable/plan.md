

## Plan: OG-proxy Edge Function voor social media previews

### Probleem
WhatsApp, Facebook, en andere platforms voeren geen JavaScript uit. De SPA rendert meta-tags client-side, dus crawlers zien alleen de standaard TX EventShare meta-tags in `index.html` — niet de event-specifieke afbeelding, titel en beschrijving.

### Oplossing
Een Edge Function `og-proxy` die:
1. Een event-slug ontvangt via query parameter
2. Event-data + afbeelding ophaalt uit de database
3. Een minimale HTML-pagina retourneert met correcte OG meta-tags
4. Een JavaScript-redirect bevat zodat echte gebruikers doorgestuurd worden naar de SPA

### Architectuur

```text
WhatsApp/Facebook crawler
  → https://txeventshare.nl/e/{slug}
  → Vercel/hosting rewrite rule stuurt /e/* naar Edge Function
  → Edge Function detecteert crawler User-Agent
  → Retourneert HTML met og:image, og:title, og:description
  → Crawler toont preview

Echte gebruiker
  → Zelfde URL → SPA laadt normaal (geen redirect nodig)
```

**Alternatief (eenvoudiger, geen hosting-rewrite nodig):**
De share-links wijzen naar de Edge Function URL met redirect naar de SPA. Dit werkt zonder aanpassingen aan de hosting.

### Wijzigingen

#### 1. Nieuwe Edge Function: `supabase/functions/og-proxy/index.ts`
- Accepteert `?slug={event-slug}` als query parameter
- Haalt event op uit `events` tabel (titel, short_description, slug, start_date, featured_image_id)
- Haalt afbeelding-URL op uit `media` tabel
- Retourneert HTML met:
  - `og:title` = event titel
  - `og:description` = korte omschrijving + datum
  - `og:image` = featured image URL
  - `og:url` = `https://txeventshare.nl/e/{slug}`
  - `twitter:card` = `summary_large_image`
  - Een `<meta http-equiv="refresh">` redirect naar de echte SPA-pagina
  - Een JavaScript `window.location.replace()` als fallback redirect
- CORS headers voor cross-origin requests
- Cache-Control header (5 minuten) voor performance

#### 2. Share-URLs aanpassen
In de volgende bestanden de share-URL wijzigen van `https://txeventshare.nl/e/{slug}` naar de Edge Function URL `https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/og-proxy?slug={slug}`:

- **`src/pages/PublicEventPage.tsx`**: `shareUrl` en `visitorWhatsappText`
- **`src/pages/DistributionPage.tsx`**: WhatsApp organisator-tekst en share links
- **`supabase/functions/widget-embed/index.ts`**: `eventPageUrl` in share-knoppen
- **`src/components/distribution/ChannelBar.tsx`**: share URL constructie

#### 3. Config
- Geen `config.toml` wijziging nodig (standaard `verify_jwt = false` voor Lovable-managed functions)

### Hoe het werkt voor de gebruiker
- Alle gedeelde event-links gaan via de OG-proxy
- WhatsApp/Facebook tonen de juiste afbeelding, titel en beschrijving als preview
- Echte gebruikers worden automatisch doorgestuurd naar de volledige eventpagina
- Geen zichtbaar verschil voor de eindgebruiker

