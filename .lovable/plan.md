# Verzendtijden instelbaar maken (herinneringen + weekoverzicht)

## Huidige situatie (geverifieerd)
- Herinneringen: vaste venster van ±2 uur vóór aanvang, hardgecodeerd in de `event-reminder-cron` functie (controle elke 15 minuten).
- Weekoverzicht: vaste cron `0 8 * * 2` = dinsdag 10:00 Nederlandse tijd, hardgecodeerd.
- Er is nergens in de app een instelling voor deze tijden.
- De notificatie-instellingen voor tenants staan op de Integratiepagina (tab "Verbinding"); het beheercentrum (`/admin`) heeft nog géén notificatie-sectie per tenant.

## Wat de gebruiker gaat zien
1. **Integratiepagina (tab Verbinding)** — in het bestaande notificatie-blok komen twee nieuwe instellingen:
   - "Herinnering versturen … uur voor aanvang" (keuze uit bijv. 1 / 2 / 3 / 6 / 12 / 24 uur, standaard 2).
   - "Weekoverzicht" — dag van de week (standaard dinsdag) en verzendtijd (standaard 10:00, Nederlandse tijd).
2. **Beheercentrum (`/admin`, tenantdetail)** — een nieuwe kaart "Notificaties" waarmee jij als platformbeheerder dezelfde twee tijden per tenant kunt instellen (en overschrijven), ook vóórdat de tenant er zelf iets mee doet.
3. **Nieuwe accounts** — krijgen automatisch de standaardwaarden (2 uur vóór aanvang, dinsdag 10:00) en werken dus direct, zonder extra instelling.

## Technische aanpak
- **Opslag**: in `integration_connections.sync_settings.timing` (bestaand jsonb-veld, geen migratie nodig):
  `reminder_hours_before` (number, standaard 2), `digest_day_of_week` (1–7, standaard 2 = dinsdag), `digest_time` ("HH:mm", standaard "10:00", Europe/Amsterdam).
  Afwezig = standaardwaarden → nieuwe accounts werken direct.
- **Herinneringen (`event-reminder-cron`)**: blijft elke 15 minuten draaien. Per kandidaat-evenement leest de functie de lead time van de tenant-verbinding en verstuurt wanneer de aanvang binnen [lead, lead − 15 min] ligt. Bestaande dedupe-logga blijft staan.
- **Weekoverzicht (`weekly-event-digest`)**: cron verandert van wekelijks naar elke 15 minuten (`*/15 * * * *`). De functie controleert per verbinding of de huidige dag+tijd (Amsterdam) overeenkomt met de ingestelde dag/tijd (venster van 15 min); de bestaande "already sent today"-dedupe voorkomt dubbele verzending.
- **UI**:
  - `src/pages/IntegrationsPage.tsx`: timingvelden in het notificatie-blok, opgeslagen via dezelfde persist-flow als de huidige instellingen.
  - `src/pages/admin/AdminTenantDetailPage.tsx`: nieuwe kaart "Notificaties" (zelfde velden) die de verbinding van die tenant leest/schrijft (platform admin omzeilt RLS via bestaande rechten).
  - Nederlandse vertaalsleutels in `src/lib/i18n/translations.ts`.
- **Database**: éénmalig de cron `weekly-event-digest` herschemauleren naar `*/15 * * * *` (via SQL-uitvoering, niet via migratiebestand).
- **Edge functions** `event-reminder-cron` en `weekly-event-digest` opnieuw deployen.

## Buiten scope
- Geen per-evenement afwijkende verzendtijd; de instelling geldt per account/verbinding.
- Geen wijziging aan templates, kanalen of de tag-logica.
