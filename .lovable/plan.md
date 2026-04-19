
User wil een nieuwe publieke Read API toevoegen, naast de bestaande `widget-embed` JSON-functionaliteit (die blijft ongemoeid).

## Plan: Publieke Events Read API

### 1. Database wijziging
Nieuwe migratie:
- Kolom `public_api_enabled boolean NOT NULL DEFAULT true` op `tenants`
- Geen RLS-wijzigingen nodig — Edge Function gebruikt service role key

### 2. Nieuwe Edge Function: `public-events-api`
Locatie: `supabase/functions/public-events-api/index.ts`
- `verify_jwt = false` (publiek)
- CORS open (`Access-Control-Allow-Origin: *`)
- Cache-Control: `public, max-age=300`
- Service role client voor data-toegang
- Routes via URL parsing:
  - `GET /public-events-api/v1/tenants/{slug}/events`
  - `GET /public-events-api/v1/tenants/{slug}/events/{event_slug}`
- Query params: `from`, `to`, `category`, `limit` (default 20, max 100), `offset`
- Filters: alleen `status='published'`, alleen tenants met `public_api_enabled=true`
- Response includeert: tenant (slug, name, logo_url, primary_color), events met venue + category + featured image (via storage public URL) + `public_url`, en `pagination` object
- Input validatie met Zod

### 3. UI uitbreiding op `IntegrationsPage`
Nieuw card-blok "Publieke Events API" boven het Ticketing-blok:
- Toggle om API aan/uit te zetten (update `tenants.public_api_enabled` — owners/admins)
- Read-only veld met de exacte endpoint-URL voor de huidige tenant
- Copy-buttons voor curl + JS fetch voorbeeld
- Link naar de docs

### 4. Documentatie
Nieuw bestand `docs/public-events-api.md` met:
- Endpoints, query params, response schema
- Voorbeelden (curl, fetch, React)
- CORS/caching info, rate limit notitie
- Verschil met legacy widget-embed JSON (blijft bestaan, niet deprecated)

### Geen wijzigingen aan
- `widget-embed` Edge Function (blijft 1-op-1 werken)
- Bestaande RLS policies
- Auth flow

### Technisch
- Edge Function is read-only, gebruikt service role enkel om publieke data op te halen (geen geheime data wordt geretourneerd)
- Featured image URL wordt opgebouwd via Supabase storage public URL voor `media` bucket
- Pagination: `total` via `count: 'exact'` op de query
