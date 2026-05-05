## Status check

Gecheckt: in `supabase/functions/clickwise-sync/fan-out-sms.ts` bevatten de templates `updated` en `ended` momenteel GEEN `{description}` placeholder (alleen `published` en `reminder` hebben varianten met extra info). De fix is dus nog niet doorgevoerd.

De bestaande filter-logica onderaan `buildSmsMessage` / `buildSmsMessageWithVenue` verwijdert al lege regels die niet tussen twee gevulde regels staan, dus lege `{description}` levert geen dubbele witregels op.

## Wijzigingen

Bestand: `supabase/functions/clickwise-sync/fan-out-sms.ts`

In zowel `buildSmsMessage` als `buildSmsMessageWithVenue` (beide bevatten dezelfde templates-object):

1. **`updated` template** — voeg `\n\n{description}` toe na de `📍 {location}` regel, vóór de "Bekijk de details / Details" regel, voor alle 4 talen (nl, fy, de, en).

2. **`ended` template** — voeg `\n\n{description}` toe na de `📅 {date}` regel, vóór de annuleringszin, voor alle 4 talen (nl, fy, de, en).

3. **Niet aanraken**: `published` template, `reminder` template, `formatDateLocalized`, alle replace/filter-logica, en de rest van het bestand.

4. **Niet aanraken**: `supabase/functions/event-reminder-cron/fan-out-sms.ts` (gebruiker vraagt expliciet alleen clickwise-sync).

## Deploy

Na de wijziging: deploy `clickwise-sync` edge function.
