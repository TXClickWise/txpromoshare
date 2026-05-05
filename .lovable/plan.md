## Wekelijks evenementen-overzicht (dinsdag 10:00 NL)

### 1. `supabase/functions/clickwise-sync/fan-out-sms.ts`
- Voeg `export` toe aan `formatDateLocalized` (nu intern).
- Nieuwe export `interface DigestEvent { title; date; startTime; location; url }`.
- Nieuwe export `buildDigestMessage(lang, events, venueName)`:
  - Headers/intro/closing/no-events strings in nl/fy/de/en.
  - Per event: `▸ {title}\n  {datum}{ om HH:mm}\n  📍 {location}` (taal-specifiek "om/at/um").
  - Lege events-lijst → korte "geen events deze week" tekst (function returnt deze; caller beslist of die wordt verstuurd).
- `fetchSubscribers`, `detectLanguage`, `detectChannel`, `sendMessage` zijn al geëxporteerd — niet wijzigen.
- Bestaande templates en logica niet aanraken.

### 2. Nieuwe Edge Function `supabase/functions/weekly-event-digest/index.ts`
Volgt patroon van `event-reminder-cron`:
- Service-role Supabase client.
- Tijdvenster: vandaag (Europe/Amsterdam, via `toAmsterdamParts`) t/m +7 dagen.
- Haal `integration_connections` (provider=clickwise, status=connected); filter op `credentials_encrypted.fan_out_enabled === true` en aanwezige `api_key`.
- Per tenant:
  - Skip als er vandaag al een `integration_events` row met `event_type='fan_out.weekly_digest'` bestaat (idempotent bij meerdere triggers).
  - Query `events` (status=published, is_recurring=false, start_date in venster) + `event_occurrences` (status=active, occurrence_date in venster), join `venues`.
  - Combineer + sorteer op datum/tijd.
  - Skip als 0 events (geen bericht versturen).
  - `fetchSubscribers` met `subaccount_id` + `subscriber_tag` (default "events").
  - Per subscriber: `detectLanguage` + `detectChannel`, bouw URLs met `credentials.event_page_url_template` (fallback `https://txeventshare.nl/e/{slug}`), `buildDigestMessage`, `sendMessage` (100ms throttle).
  - Schrijf `integration_events` log rij met counts en errors (max 10).
- Geen JWT vereist (publieke trigger via cron) → `verify_jwt = false` toevoegen aan `supabase/config.toml` voor `weekly-event-digest`.
- CORS headers in alle responses.

### 3. Cron job (database)
Aanpak gelijk aan bestaande reminder cron — gebruik directe project URL + anon key (geen `current_setting`), via `supabase--read_query`/insert tooling (niet via migrate-tool, want bevat project-specifieke waarden):

```sql
select cron.schedule(
  'weekly-event-digest',
  '0 8 * * 2',  -- dinsdag 08:00 UTC = 10:00 Amsterdam (zomer)
  $$
  select net.http_post(
    url := 'https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/weekly-event-digest',
    headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Opmerking over wintertijd: `0 8 * * 2` = 10:00 NL in zomer, 09:00 NL in winter. Dit accepteren we (zoals in de prompt aangegeven), of als alternatief twee schedules met datumranges. Standaard: één schedule op 08:00 UTC.

### 4. Deploy & verificatie
- Deploy `weekly-event-digest` (en `clickwise-sync` voor de gewijzigde exports in `fan-out-sms.ts`).
- Test via `curl_edge_functions` POST `/weekly-event-digest` → controleer JSON-respons en `integration_events` log.
- Bevestig cron-registratie via `supabase--read_query` op `cron.job`.

### Niet-aanraken
- Bestaande `buildSmsMessage`, `buildSmsMessageWithVenue`, `fanOutNotification` templates.
- `event-reminder-cron`, `clickwise-sync/index.ts`.
- `event_page_url_template` per-tenant configuratie blijft zoals deze is.
