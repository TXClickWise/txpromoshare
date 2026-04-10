
Doel

Zeker maken dat de event-share oplossing klopt op het live domein: event-specifieke OG-tags server-side op de schone URL `https://txeventshare.nl/e/[slug]`, zonder zichtbare technische URL en zonder verwarring rond `/index.html`.

Wat ik nu in de code zie

- Ja: in de code is al expliciet ingebouwd dat per event een bestand wordt gegenereerd op `dist/e/[slug]/index.html` in `vite-plugin-og-pages.ts`.
- De React-app zelf gebruikt publiek de route `/e/:slug` in `src/App.tsx`.
- Op Lovable hosting hoort de publieke URL daarom normaal `https://txeventshare.nl/e/[slug]` te zijn. De `index.html` is de interne bestandsnaam achter die map-route.
- Daardoor is `https://txeventshare.nl/e/[slug]/index.html` niet de hoofd-URL die gedeeld moet worden. Dat pad mag dus nooit leidend zijn voor WhatsApp of voor gebruikers.

Plan van aanpak

1. Canonieke publieke event-URL afdwingen
- Alles blijft wijzen naar `https://txeventshare.nl/e/[slug]`
- Geen shares, canonical tags of UI-links meer naar een `index.html`-variant

2. `/index.html`-pad robuust maken
- Extra ondersteuning toevoegen zodat `/e/:slug/index.html` niet meer op een 404 eindigt als iemand die URL toch opent
- Daarbij altijd canonicaliseren naar `/e/[slug]`, zodat zoekmachines en WhatsApp maar één juiste event-URL zien

3. OG-output nalopen
- Bevestigen dat de build-output voor elke gepubliceerde eventslug echt een event-specifieke HTML oplevert
- Controleren dat die HTML de juiste `og:title`, `og:description`, `og:image` en `og:url` gebruikt voor het specifieke event

4. Publicatiegedrag meenemen
- Frontend-wijzigingen opnieuw publiceren, omdat juist deze statische eventpagina’s pas live zijn na een frontend update
- Daarna live verifiëren dat `https://txeventshare.nl/e/[slug]` de event-specifieke metadata serveert

5. Eindcontrole
- Testen dat:
  - `/e/[slug]` werkt als hoofd-URL
  - `/e/[slug]/index.html` niet meer fout loopt
  - de preview niet terugvalt op TX EventShare algemene info
  - WhatsApp alleen de schone event-URL gebruikt

Technische details

- Bestand dat nu de statische pagina’s maakt: `vite-plugin-og-pages.ts`
- Huidige publieke eventroute: `src/App.tsx` met `/e/:slug`
- Kernpunt: `dist/e/[slug]/index.html` is een build-artifact; de juiste publieke URL blijft `/e/[slug]`
- Dus: als `/e/[slug]/index.html` nu 404 geeft, betekent dat niet automatisch dat de hoofdoplossing fout is — maar ik ga het wel afvangen zodat beide paden netjes uitkomen

Concrete uitkomst na implementatie

- Schone publieke event-URL: `https://txeventshare.nl/e/[slug]`
- Event-specifieke OG-data op live domein
- Geen afhankelijkheid van zichtbare backend-URL’s
- Geen 404 meer wanneer iemand toch de `index.html`-variant opent
