

## Analyse

**Doel**: Automatisch ClickWise synchroniseren wanneer events gepubliceerd, gewijzigd of beëindigd worden, zonder handmatige actie.

**Aannames**: De `clickwise-sync` edge function en `useClickWiseIntegration` hook werken correct. We hoeven alleen de trigger-logica toe te voegen op de juiste plekken.

**Scope**: Een herbruikbare helper-functie + integratie in 3 plekken waar event-statuswijzigingen plaatsvinden.

**Betrokken bestanden**:
- `src/lib/clickwise-sync.ts` (nieuw) — helper functie
- `src/components/event-wizard/useEventForm.ts` — publish & save
- `src/components/EventActionMenu.tsx` — archiveren, republish, beëindigen
- `src/pages/admin/AdminTenantsPage.tsx` — niet nodig (cron-jobs)

**Risico's**: Sync mag nooit de event-flow blokkeren. Fouten worden getoast maar blokkeren niet.

---

## Stappenplan

### Stap 1: Maak `src/lib/clickwise-sync.ts`

Een fire-and-forget helper die:
1. De `integration_connections` tabel checkt voor een actieve ClickWise-koppeling voor de tenant
2. De `sync_settings.rules` checkt of de betreffende event_type aan staat
3. De `clickwise-sync` edge function aanroept
4. Bij fout alleen console.error logt (geen blokkerende fout)

Mapping van regels:
- `event.published` → `rules.event_published`
- `event.updated` → `rules.event_updated`
- `event.ended` → `rules.event_ended`

### Stap 2: Integreer in `useEventForm.ts`

- Na succesvolle `handlePublish`: roep `triggerClickWiseSync("event.published", eventId, eventData)` aan
- Na succesvolle `handleSave` (als event al published is): roep `triggerClickWiseSync("event.updated", eventId, eventData)` aan

### Stap 3: Integreer in `EventActionMenu.tsx`

- Na `archiveEvent`: trigger `event.ended`
- Na `republishEvent`: trigger `event.published`

---

## Technische details

De helper `triggerClickWiseSync` is volledig async/fire-and-forget:

```typescript
// src/lib/clickwise-sync.ts
export async function triggerClickWiseSync(
  tenantId: string,
  eventType: "event.published" | "event.updated" | "event.ended",
  eventId: string,
  eventData?: Record<string, unknown>
) {
  // 1. Check connection exists & is active
  // 2. Check sync rule is enabled
  // 3. Call edge function
  // All wrapped in try/catch — never throws
}
```

Geen nieuwe database-migraties nodig. Geen nieuwe edge functions. Alleen client-side trigger-logica.

