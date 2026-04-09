

## Plan: ClickWise Sync Verbeteringen

Vier verbeteringen aan de ClickWise-integratie om duplicaten te voorkomen, unieke contacten per event te maken, recurring events te ondersteunen, en sync-status zichtbaar te maken.

---

### 1. Appointment updates i.p.v. duplicaten

**Probleem**: Elke `event.updated` maakt een nieuwe appointment aan in de GHL kalender.

**Oplossing**:
- In de edge function: na succesvolle appointment-creatie, het GHL appointment ID opslaan in de `integration_events` payload
- Bij `event.updated`: eerst opzoeken of er al een eerdere succesvolle `event.calendar_sync` log bestaat voor dit event_id
- Zo ja: een `PUT` request doen naar `calendars/events/appointments/{appointmentId}` i.p.v. `POST`
- Bij `event.ended`: de bestaande appointment updaten naar `appointmentStatus: "cancelled"`

**Bestanden**:
- `supabase/functions/clickwise-sync/index.ts` — helper `callGHLPut()`, lookup van bestaand appointment ID, PUT bij update

---

### 2. Unieke contacten per event

**Probleem**: Alle events voor een tenant overschrijven dezelfde contact (`events@{tenant_id}...`), waardoor custom fields verloren gaan.

**Oplossing**:
- Contact email wijzigen van `events@{tenant_id}.txeventshare.local` naar `event-{slug}@{tenant_id}.txeventshare.local`
- Contact naam wijzigen van "TX EventShare Sync" naar de event titel
- Tag `tx-event-{slug}` toevoegen voor filtering in GHL workflows

**Bestanden**:
- `supabase/functions/clickwise-sync/index.ts` — contactBody email + name + tags aanpassen

---

### 3. Recurring events (occurrences) sync

**Probleem**: Bij recurring events worden alleen de hoofddatums gesynchroniseerd, niet de individuele occurrences.

**Oplossing**:
- Na de hoofdevent-sync: checken of `is_recurring = true`
- Zo ja: alle actieve `event_occurrences` ophalen voor dit event
- Per occurrence een aparte appointment aanmaken met de occurrence-specifieke datum/tijd (met overrides)
- Elke occurrence-appointment loggen als `event.occurrence_sync` in `integration_events`

**Bestanden**:
- `supabase/functions/clickwise-sync/index.ts` — occurrence loop na hoofdsync

---

### 4. Sync-status overzicht op integratiepagina

**Probleem**: In de UI is niet zichtbaar per event of de sync geslaagd is.

**Oplossing**:
- Op het "Overzicht" tab: een compact overzicht tonen met:
  - Aantal succesvolle syncs (laatste 7 dagen)
  - Aantal mislukte syncs
  - Laatste sync tijdstip
- Op het "Logs" tab: de event-titel tonen naast het event_type (door een join met events tabel of de titel uit de payload te halen)

**Bestanden**:
- `src/pages/IntegrationsPage.tsx` — stats-sectie op overview tab, event-titel in logs

---

### Technische details

**GHL API endpoints**:
- `POST /calendars/events/appointments` — nieuwe appointment
- `PUT /calendars/events/appointments/{id}` — bestaande appointment updaten

**Appointment ID opslag**: Wordt opgeslagen in de `payload` jsonb van `integration_events` als `ghl_appointment_id`. Bij een update wordt dit opgezocht via:
```sql
SELECT payload->>'ghl_appointment_id' FROM integration_events
WHERE event_id = ? AND event_type = 'event.calendar_sync' AND status = 'success'
ORDER BY attempted_at DESC LIMIT 1
```

**Geen database-migraties nodig** — alles past in bestaande structuren.

