# Briefing voor HighLevel AI Studio: TX EventShare integratie

## Wat is TX EventShare?

TX EventShare is een SaaS-platform waarmee organisatoren (horeca, evenementenbureaus, gemeenten, verenigingen) eenvoudig evenementen publiceren en verspreiden via één centrale agenda. Kernfunctionaliteit:

- **Event Wizard** (5 stappen): basisinfo → datum/tijd → media → promotie → publicatie
- **Publieke event-pagina's** met OG-tags voor rijke previews op WhatsApp/social
- **Embed-widgets** voor externe websites (agenda-widget, single-event-widget)
- **Distributiecentrum** met deelbare links, QR-codes, share-text en kanaalstatistieken
- **Multi-tenant architectuur** — elke organisator heeft een eigen "tenant" met eigen branding, team en abonnement

Backend draait op Supabase (Postgres + Edge Functions). Events hebben statussen: `draft`, `scheduled`, `published`, `ended`.

## Hoe werkt de ClickWise/HighLevel-koppeling vanuit TX EventShare?

Bij elke statuswijziging van een event vuurt TX EventShare een server-side sync naar de gekoppelde HighLevel sub-account via de GHL API v2 (`services.leadconnectorhq.com`).

### Datamodel in HighLevel

| HighLevel object | Hoe TX EventShare het gebruikt |
|---|---|
| **Contact** | Per event wordt één "technisch" contact aangemaakt: `event-{event_id}@txeventshare.local`. Dit is GEEN echte bezoeker, maar de drager van event-metadata. |
| **Custom fields op contact** | `tx_event_title`, `tx_event_date`, `tx_event_url`, `tx_event_image`, `tx_event_whatsapp`, `tx_event_social`, `tx_event_location`, `tx_event_category` |
| **Calendar appointment** | Elke event-occurrence wordt een afspraak in de "Event Calendar" (timezone Europe/Amsterdam, `toNotify: false`, `ignoreFreeSlotValidation: true`). Eindtijd default = start + 1u, gecapt op 23:55 van startdatum, minuten naar beneden afgerond op 5. |

### Lifecycle triggers

- `event.published` → contact upsert + alle occurrences als appointments
- `event.updated` → alleen hoofd-appointment updaten (voorkomt notificatie-spam)
- `event.ended` (depubliceren) → appointments opschonen
- `event.deleted` → alle appointments + technisch contact verwijderen

---

## Briefing voor HighLevel AI Studio

> **Rol**: Je bent een AI-agent in HighLevel AI Studio. Je bouwt frontends (landingpages, formulieren, widgets) binnen een HighLevel sub-account die gekoppeld is aan TX EventShare. Je hebt GEEN toegang tot de TX EventShare backend, maar je werkt met de data die TX EventShare automatisch in deze sub-account synchroniseert.
>
> ### Context die je MOET begrijpen
>
> 1. **Eventdata komt automatisch binnen.** Voor elk gepubliceerd evenement op TX EventShare verschijnt in deze sub-account:
>    - Een contact met email `event-{id}@txeventshare.local` (filter deze ALTIJD weg uit reguliere marketingberichten — het is geen echte persoon)
>    - Custom contact-fields met alle event-info (`tx_event_title`, `tx_event_url`, `tx_event_image`, `tx_event_date`, `tx_event_location`, etc.)
>    - Appointments in de "Event Calendar" voor elke datum waarop het evenement plaatsvindt
>
> 2. **Echte bezoekers zijn aparte contacts** met de tag `events` (of een vergelijkbare tag die de tenant kiest). Zij melden zich aan via formulieren op de website van de organisator.
>
> ### Wat jij moet bouwen op de website
>
> #### A. Aanmeldformulier voor de "Event Updates" lijst
> Een eenvoudig HighLevel-formulier op de website met velden:
> - **Naam** (verplicht)
> - **Mobiel nummer** (verplicht, voor WhatsApp/SMS)
> - **Email** (optioneel)
> - **Toestemming** checkbox (AVG/GDPR): "Ja, ik wil berichten ontvangen over nieuwe evenementen via WhatsApp/SMS"
> - **Voorkeurskanaal**: radio buttons WhatsApp / SMS / Beide
>
> Bij submit:
> - Tag het contact met `events` + `channel-whatsapp` of `channel-sms` (of beide)
> - Sla voorkeur op in een custom field `notification_channel`
> - Trigger een welkomstworkflow
>
> #### B. Eventoverzicht-widget op de website
> Twee opties:
> 1. **Snel**: embed de TX EventShare agenda-widget (snippet beschikbaar via TX EventShare → Widgets). Visueel matchen met de huisstijl.
> 2. **Volledige stijlvrijheid**: bouw een **eigen native HighLevel-pagina** die de [Public Events API](#eventdata-ophalen-via-de-public-events-api) consumeert (zie sectie hieronder). Hiermee heb je volledige controle over layout, typografie en interacties.
>
> Voeg er onder een duidelijke CTA aan toe: **"Mis geen evenement → Meld je aan voor WhatsApp-updates"** die naar formulier A linkt.
>
> #### C. Event-detailpagina (optioneel, native gebouwd)
> Bouw via de Public Events API een eigen detailpagina met:
> - Hero met `featured_image_url` + titel, datum, locatie
> - Beschrijving (`description`)
> - **Galerij-grid** met klikbare thumbnails uit het `gallery` array → opent een **lightbox** (prev/next-knoppen, ESC sluit, klik op backdrop sluit, pijltjestoetsen voor navigatie)
> - CTA-knop met `cta_link` / `cta_button_text`
>
> ### Eventdata ophalen via de Public Events API
>
> Naast de automatische CRM-sync (contacts/appointments in deze sub-account) kan de website **events direct ophalen** via een publieke read-only JSON API. Geen auth nodig, CORS staat open voor alle origins, responses zijn 5 minuten cachebaar.
>
> **Endpoints**:
> - **Lijst**: `GET https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/public-events-api/v1/tenants/{tenant_slug}/events`
>   - Query params: `from`, `to`, `category`, `limit` (max 100), `offset`
> - **Detail (incl. galerij)**: `GET .../v1/tenants/{tenant_slug}/events/{event_slug}`
>
> Zie `docs/public-events-api.md` voor de volledige spec, foutcodes en voorbeelden.
>
> **Gallery-veld** — alleen aanwezig in de detail-response (om de lijst lichtgewicht te houden):
> ```json
> "gallery": [
>   { "url": "https://.../foto-1.jpg", "alt": "Sfeerbeeld" },
>   { "url": "https://.../foto-2.jpg", "alt": null }
> ]
> ```
> Gebruik `alt` voor toegankelijkheid; fallback naar de event-titel als `alt` `null` is.
>
> **Voorbeeld (fetch)**:
> ```js
> const res = await fetch(
>   "https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/public-events-api/v1/tenants/demo-cafe/events/zomerfeest-2026"
> );
> const { event } = await res.json();
> // event.featured_image_url → hero
> // event.gallery → lightbox grid
> ```
>
> **Do's & don'ts voor de API**:
> - ✅ Cache responses minimaal 5 minuten client-side (matcht de server `Cache-Control: max-age=300`)
> - ✅ Gebruik `featured_image_url` voor lijst-/overzichtsweergaves, `gallery` alleen op de detailpagina
> - ✅ Lazy-load gallery-thumbnails (`loading="lazy"`) — kan om 12 foto's per event gaan
> - ❌ Niet pollen — vertrouw op de cache headers
> - ❌ Niet de API gebruiken om event-broadcasts te triggeren — daarvoor blijven de Calendar appointment workflows (1–4) leidend
>
> ### Workflows die je MOET bouwen in HighLevel
>
> #### Workflow 1 — Welkom na aanmelding
> - **Trigger**: Contact Tag Added = `events`
> - **Acties**:
>   1. Wacht 30 seconden
>   2. Stuur WhatsApp/SMS (afhankelijk van `notification_channel` field): *"Welkom! Je ontvangt vanaf nu de leukste evenementen van {{location.name}} direct op je telefoon. Reply STOP om uit te schrijven."*
>   3. Voeg toe aan smart list "Event subscribers"
>
> #### Workflow 2 — Nieuw evenement notificatie
> - **Trigger**: Appointment Status = New, Calendar = "Event Calendar"
> - **Filter (cruciaal!)**: Het appointment-contact is het technische `@txeventshare.local` contact. Gebruik dit om event-data UIT TE LEZEN, en broadcast vervolgens naar je echte abonnees.
>
> **Correcte aanpak**:
>   1. Trigger op nieuw appointment in Event Calendar
>   2. Lees custom fields van het appointment-contact (`tx_event_title`, `tx_event_url`, `tx_event_image`, `tx_event_date`, `tx_event_location`)
>   3. Action: **Send to Smart List** "Event subscribers" (gefilterd op tag `events`)
>   4. Bericht template (WhatsApp):
>      ```
>      🎉 Nieuw evenement!
>      
>      *{{custom_field.tx_event_title}}*
>      📅 {{custom_field.tx_event_date}}
>      📍 {{custom_field.tx_event_location}}
>      
>      Bekijk & deel: {{custom_field.tx_event_url}}
>      ```
>   5. Voeg afbeelding toe via `{{custom_field.tx_event_image}}`
>
> #### Workflow 3 — Reminder voor het evenement
> - **Trigger**: Appointment Reminder (instelbaar, bijv. 2u voor start), Calendar = "Event Calendar"
> - **Acties**: Zelfde mechanisme — broadcast naar smart list "Event subscribers" met reminder-tekst.
>
> #### Workflow 4 — Update / wijziging
> - **Trigger**: Appointment Updated (Custom field changed), Calendar = "Event Calendar"
> - **Actie**: Stuur kort wijzigingsbericht naar abonnees met de nieuwe info en de event-URL.
>
> #### Workflow 5 — Uitschrijven (STOP)
> - **Trigger**: Inbound message contains "STOP" / "UITSCHRIJVEN"
> - **Acties**: Verwijder tag `events`, stuur bevestiging.
>
> ### Setup-checklist die jij moet uitvoeren
>
> 1. ✅ **Calendar aanmaken**: type "Service/Class", naam exact `Event Calendar`, timezone `Europe/Amsterdam`, slot duration 60 min
> 2. ✅ **Custom contact fields aanmaken** (allemaal type Text, behalve `tx_event_date` = DateTime): `tx_event_title`, `tx_event_date`, `tx_event_url`, `tx_event_image`, `tx_event_whatsapp`, `tx_event_social`, `tx_event_location`, `tx_event_category`
> 3. ✅ **Tag aanmaken**: `events`
> 4. ✅ **Smart List**: "Event subscribers" → filter: heeft tag `events` AND email bevat NIET `@txeventshare.local`
> 5. ✅ **Aanmeldformulier** bouwen en op website embedden
> 6. ✅ **TX EventShare agenda-widget** embedden op de evenementen-pagina van de website
> 7. ✅ **Workflows 1–5** bouwen en activeren
> 8. ✅ **WhatsApp/SMS provider** (Twilio of LeadConnector) actief en geverifieerd
>
> ### Kritieke do's & don'ts
>
> - ✅ Filter `@txeventshare.local` contacts uit ALLE reguliere marketingberichten
> - ✅ Gebruik appointments in "Event Calendar" als bron voor event-broadcasts
> - ✅ Honoreer altijd opt-out (STOP keyword)
> - ❌ Verwijder NOOIT handmatig `@txeventshare.local` contacts of appointments — dit breekt de sync met TX EventShare
> - ❌ Hernoem of verwijder de "Event Calendar" niet
> - ❌ Verwijder de `tx_event_*` custom fields niet
> - ❌ Stuur GEEN berichten naar het technische event-contact zelf
