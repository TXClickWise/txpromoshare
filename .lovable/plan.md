

## Kernprobleem

Lovable hosting gebruikt een SPA-fallback: alle routes (`/e/[slug]`, `/s/[slug].html`) serveren altijd de generieke `index.html`. De statische HTML-bestanden die het Vite-plugin genereert worden nooit door WhatsApp-crawlers gezien. Dit is een platformbeperking die niet te omzeilen is met build-time bestanden.

## Definitieve oplossing: Edge Function als share-URL

De `og-proxy` Edge Function bestaat al in de code maar is **niet gedeployed** (404). Deze functie doet precies wat nodig is: event ophalen uit de database, HTML met correcte OG-tags retourneren, en de gebruiker doorsturen naar de schone URL.

### Stappen

**1. Deploy og-proxy Edge Function**
- Deployen van `supabase/functions/og-proxy/index.ts`
- Testen met curl dat de functie correcte HTML met OG-tags retourneert

**2. WhatsApp share-URL wijzigen naar Edge Function**
- In `DistributionPage.tsx`: `previewShareUrl` wijzigen van `https://txeventshare.nl/s/[slug].html` naar de edge function URL: `https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/og-proxy?slug=[slug]`
- In `ChannelBar.tsx`: WhatsApp stuurt alleen de `previewShareUrl` (de edge function URL). De crawler ziet de OG-tags; de gebruiker wordt automatisch geredirect naar `https://txeventshare.nl/e/[slug]`
- **Geen zichtbare URL in het WhatsApp-bericht**: alleen de link, geen tekst erboven

**3. WhatsApp-berichttekst opschonen**
- WhatsApp stuurt alleen de edge function URL als bericht (geen tekst erbij)
- WhatsApp toont automatisch een preview-kaart met titel, afbeelding en beschrijving uit de OG-tags
- De gebruiker ziet alleen de preview-kaart, geen technische URL of extra tekst

**4. Vite-plugin kan blijven** als SEO-bonus voor zoekmachines, maar is niet meer de primaire share-methode

### Resultaat na implementatie

- WhatsApp toont: event-afbeelding (1200x630), event-titel, event-beschrijving met datum/tijd/locatie
- Geen zichtbare URL in het bericht
- Klikken op de preview opent `https://txeventshare.nl/e/[slug]`
- Werkt direct na deploy (geen frontend-publish nodig)

### Technische details

- Edge Function URL-formaat: `https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/og-proxy?slug={slug}`
- De functie retourneert HTML met `<meta http-equiv="refresh">` en JS redirect naar canonical URL
- Afbeelding wordt via storage transforms geoptimaliseerd naar 1200x630
- Bestanden die gewijzigd worden: `src/pages/DistributionPage.tsx`, `src/components/distribution/ChannelBar.tsx`, `supabase/functions/og-proxy/index.ts` (minor fix)

