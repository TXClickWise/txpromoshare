
# Bug analyse

## Fout
WhatsApp-preview blijft ongewijzigd omdat de flow die waarschijnlijk getest wordt nog steeds niet via de OG-proxy loopt. Daardoor krijgt WhatsApp nog altijd de SPA/fallback-route of de oude `/s/...`-route te zien, met verkeerde afbeelding/tekst en zichtbare URL.

## Vermoedelijke root cause
De recente fix zit maar op 1 plek goed:

- `src/pages/DistributionPage.tsx` gebruikt al de `og-proxy`
- maar `src/pages/PublicEventPage.tsx` gebruikt nog steeds `https://txeventshare.nl/s/${slug}.html`
- en `supabase/functions/widget-embed/index.ts` deelt nog steeds direct `https://txeventshare.nl/e/${slug}`

Dat is nu de echte inconsistentie.

Belangrijk bewijs uit de code:
- `src/pages/PublicEventPage.tsx:110` → oude `/s/...` URL
- `src/App.tsx:86` → `/s/*` rendert gewoon `PublicEventPage`, dus geen echte crawler-specifieke HTML
- `supabase/functions/widget-embed/index.ts:164` → widget deelt direct `/e/...`, niet de `og-proxy`
- `src/pages/DistributionPage.tsx:123` → hier staat de proxy al wel goed

Conclusie: er is waarschijnlijk “niets veranderd” in de flow die jij testte, omdat juist de publieke pagina/widget nog op de oude of verkeerde share-URL zit.

## Betrokken files / componenten
Alleen deze files zijn functioneel betrokken bij deze bug:
- `src/pages/PublicEventPage.tsx`
- `supabase/functions/widget-embed/index.ts`

Ter referentie voor verificatie, maar niet per se wijzigen:
- `src/pages/DistributionPage.tsx`
- `src/App.tsx`
- `supabase/functions/og-proxy/index.ts`

## Buiten scope
Deze files/onderdelen niet aanpassen:
- `src/components/distribution/ChannelBar.tsx`
- shared layouts / styling
- event wizard / forms
- SEO landing pages
- database schema / policies
- andere share-kanalen die niet direct deze preview-bug veroorzaken

## Minimale fix
1. In `src/pages/PublicEventPage.tsx` de oude `previewShareUrl` vervangen door dezelfde `og-proxy` URL als in de distributiepagina.
2. In `supabase/functions/widget-embed/index.ts` de WhatsApp/Facebook/share-links ook laten verwijzen naar de `og-proxy` URL in plaats van `/e/...`.
3. Verder niets wijzigen.

Dus: één gedeelde bron voor crawler-preview-URL’s, op alle publieke share-ingangen.

## Verificatie
Na de minimale fix alleen dit controleren:
1. Deel vanaf de publieke eventpagina via WhatsApp.
2. Deel vanuit een widget via WhatsApp.
3. Bevestig dat beide nu dezelfde proxy-URL gebruiken voor preview-opbouw.
4. Bevestig dat `DistributionPage` ongewijzigd blijft werken.
5. Geen andere UI- of layout-wijzigingen uitvoeren.

## Uitvoering
In deze read-only modus voer ik de codewijziging nog niet uit, maar dit is de gerichte minimale fix die ik daarna zou toepassen:

- `src/pages/PublicEventPage.tsx`
  - vervang `/s/${slug}.html` door de `og-proxy` URL

- `supabase/functions/widget-embed/index.ts`
  - vervang publieke share-links voor preview-kanalen van `/e/${slug}` naar de `og-proxy` URL
  - canonical klikdoel blijft de eventpagina `/e/${slug}` via redirect in de proxy

Rollback is op dit moment niet nodig: de codebase oogt niet fundamenteel instabiel, maar wel inconsistent op precies deze twee share-ingangen. De beste volgende stap is dus geen brede reset, maar alleen deze 2 gerichte correcties.
