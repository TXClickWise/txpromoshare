
User wil een korte aanvulling op de bestaande AI Studio briefing (`docs/clickwise-ai-studio-briefing.md`) zodat de AI Studio agent weet:
1. Dat de Public Events API bestaat
2. Dat het detail-endpoint een `gallery` array bevat met extra foto's
3. Hoe deze te gebruiken voor een evenementen-detailpagina met klikbare lightbox-galerij

## Plan

**Eén bestandswijziging**: `docs/clickwise-ai-studio-briefing.md` uitbreiden met een nieuwe sectie **"Eventdata ophalen via de Public Events API"** die het volgende bevat:

1. **Korte intro** — naast de automatische CRM-sync (contacts/appointments) kan de website ook direct events ophalen via de publieke read-API. Geen auth nodig, CORS open, 5 min cache.

2. **Endpoints**:
   - Lijst: `GET https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/public-events-api/v1/tenants/{tenant_slug}/events`
   - Detail (incl. galerij): `.../events/{event_slug}`
   - Verwijzing naar `docs/public-events-api.md` voor volledige spec

3. **Gallery-veld uitleg** — alleen aanwezig in detail-response:
   ```json
   "gallery": [
     { "url": "https://.../foto-1.jpg", "alt": "Sfeerbeeld" },
     { "url": "https://.../foto-2.jpg", "alt": null }
   ]
   ```

4. **Aanbevolen UI-implementatie voor AI Studio**:
   - Op de eventoverzicht-widget (sectie B): toon `featured_image_url` als thumbnail
   - Op een event-detailpagina: toon hero met `featured_image_url`, plus klikbare gallery-grid die een lightbox opent (prev/next, ESC, klik buiten = sluiten)
   - Gebruik `alt` voor toegankelijkheid; fallback naar event-titel als `alt` null is

5. **Do's & don'ts toevoegen**:
   - ✅ Cache responses minimaal 5 min client-side (matcht server cache)
   - ✅ Gebruik `featured_image_url` voor lijst, `gallery` alleen op detailpagina
   - ❌ Niet pollen — gebruik `Cache-Control` header

6. **Update sectie B** ("Eventoverzicht-widget") met optie: in plaats van de TX EventShare embed-widget kan AI Studio ook een **eigen native HighLevel-pagina** bouwen die de Public API consumeert voor volledige stijlvrijheid.

Geen andere bestanden wijzigen. Geen code/DB-changes.
