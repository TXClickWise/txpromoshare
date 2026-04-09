

## Plan: Calendar Appointment Sync toevoegen aan ClickWise integratie

### Wat wordt er gebouwd

Naast de bestaande contact-sync wordt bij elke event-synchronisatie ook een **appointment** aangemaakt in de GHL Calendar. Dit maakt time-based workflow triggers mogelijk (zoals reminders 2 uur voor aanvang). Daarnaast wordt een **Calendar ID** veld toegevoegd aan de koppelings-UI.

---

### Stap 1: Edge function uitbreiden — `clickwise-sync/index.ts`

Bij `event.published` / `event.updated` / `event.ended`:

- **Behoud** de bestaande contact-upsert (custom fields blijven werken voor WhatsApp-templates)
- **Voeg toe**: een tweede API call naar `POST /calendars/events/appointments` met:
  - `calendarId` uit `credentials_encrypted.calendar_id` (fallback: hardcoded `TiR5CHmHCYXM16aZbq7g`)
  - `locationId`: subaccount ID
  - `title`: event titel
  - `startTime` / `endTime`: ISO datetime samengesteld uit `start_date + start_time` en `end_date + end_time`
  - `address`: venue adres + stad
  - `notes`: bevat event URL, beschrijving, WhatsApp-tekst, social-tekst en afbeeldings-URL
  - `assignedUserId`: leeg (Event Calendar heeft geen host)
- Bij `event.ended`: optioneel de appointment status updaten of markeren

De appointment-sync wordt gelogd als apart `integration_events` record met `event_type: "event.calendar_sync"`.

### Stap 2: Hook aanpassen — `useClickWiseIntegration.ts`

De `connect()` functie uitbreiden zodat `calendarId` wordt meegegeven en opgeslagen in `credentials_encrypted`:
```json
{ "api_key": "pit-...", "calendar_id": "TiR5CHmHCYXM16aZbq7g" }
```

### Stap 3: UI aanpassen — `IntegrationsPage.tsx`

- **Connect formulier**: een derde input veld "Calendar ID" toevoegen onder API Key
- **Verbindingsdetails**: Calendar ID tonen naast Subaccount ID
- **"Kalender integratie" teaser** verwijderen (is nu geïmplementeerd)
- Default waarde voor Calendar ID: `TiR5CHmHCYXM16aZbq7g`

---

### Technische details

**GHL Appointment API call**:
```text
POST https://services.leadconnectorhq.com/calendars/events/appointments
Headers: Authorization: Bearer {api_key}, Version: 2021-07-28
Body: {
  calendarId: "TiR5CHmHCYXM16aZbq7g",
  locationId: "sub_...",
  title: "Event titel",
  startTime: "2026-04-15T20:00:00+02:00",
  endTime: "2026-04-15T23:00:00+02:00",
  address: "Venue, Stad",
  notes: "Beschrijving + URL + WhatsApp tekst + afbeelding",
  status: "confirmed"
}
```

**Datetime constructie**: `start_date` (date) + `start_time` (time) → ISO string. Indien geen `end_date`/`end_time`, wordt `start_date + 3 uur` als fallback gebruikt.

**Geen database-migraties nodig** — alles past in de bestaande `credentials_encrypted` jsonb kolom.

