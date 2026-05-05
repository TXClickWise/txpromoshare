## Doel

Maak het demo-formulier op `/demo` functioneel én koppel het aan ClickWise via **External Event Tracking** zoals ClickWise/HighLevel het zelf voorschrijft: hun tracking-script op de pagina + een JavaScript-call met de event-naam direct na een succesvolle submit. Daarnaast slaan we de inzending op in TX EventShare zodat je een dashboard-overzicht hebt en niets verloren gaat als ClickWise even niet bereikbaar is.

---

## Hoe het straks werkt (volgens ClickWise-instructies)

```text
[Bezoeker vult /demo formulier in]
       │
       ▼
[Frontend submit handler]
       │
       ├─► 1. POST naar edge function `submit-demo-form`
       │       → INSERT in form_submissions  (always-on safety net)
       │       → Optioneel: stuur bevestigings-mail naar info@txeventshare.nl
       │
       └─► 2. Bij succes: trigger ClickWise External Event in de browser
               window.LeadConnector?.track("form_submitted_demo", {
                 email, name, phone, company, org_type, message,
                 source: "txeventshare.nl/demo"
               })
       ▼
[ClickWise tracking-script vangt het op → Workflow start]
```

De ClickWise-call gebeurt **client-side**, want hun tracking-script werkt alleen in de browser (cookies/sessie van de bezoeker worden meegestuurd, zodat hun systeem het event aan een lead kan koppelen). De server-side opslag is een vangnet.

---

## Wat we toevoegen

### 1. ClickWise tracking-script in de site
- Toevoegen aan `index.html` (in `<head>`): het algemene HighLevel/ClickWise tracking-script.
- Het script-snippet staat in jouw ClickWise-account onder **Sites → Tracking Code** (of vergelijkbaar). Jij geeft mij die snippet (of het tracking-ID), dan plak ik het in.

### 2. Demo-formulier functioneel maken (`src/pages/seo/DemoPage.tsx`)
- Velden gecontroleerd via `useState`.
- Validatie (naam + e-mail verplicht).
- Op submit:
  1. `supabase.functions.invoke("submit-demo-form", { body: ... })` — slaat op in DB en stuurt notificatie-mail.
  2. Bij succes: `window.LeadConnector?.track("form_submitted_demo", {...})` aanroepen (met null-check zodat de pagina nooit breekt als het script geblokkeerd is).
  3. Toast met bevestiging + reset van het formulier.
- Bij fout: nette foutmelding, formulier blijft ingevuld.

### 3. Database: tabel `form_submissions`
Generiek opgezet zodat het later ook event-aanmeldformulieren kan dragen.

Kolommen: `id`, `form_type` (`demo` | `event_signup`), `tenant_id` (nullable), `event_id` (nullable), `data` (jsonb met alle velden), `contact_name`, `contact_email`, `contact_phone`, `created_at`, `notified_at`, `source_url`, `user_agent`.

RLS:
- INSERT: alleen via service-role (de edge function), niet vanuit de browser.
- SELECT: alleen platform-admins (en later, voor `event_signup`-rijen, de tenant-leden van het bijbehorende event).

### 4. Edge function `submit-demo-form` (publiek, `verify_jwt = false`)
- Zod-validatie van payload (naam 1-100, e-mail valid, telefoon optioneel, etc.).
- Eenvoudige rate limit (5 inzendingen per IP per uur, in-memory).
- Insert in `form_submissions` met service-role.
- Stuurt notificatie-mail naar `info@txeventshare.nl` via de bestaande `send-transactional-email` pipeline (nieuwe template `demo-request-notification`).
- Returnt `{ ok: true, id }` of validatie-/rate-limit-fout.

### 5. Admin-overzicht (`/admin/form-submissions`)
- Nieuwe pagina onder Super Admin met tabel: datum, naam, e-mail, type organisatie, bericht, ClickWise-status (✓ als tracking-script geladen was — dat zien we niet 100% zeker; we tonen daarom alleen de submission zelf en laten ClickWise-zijde aan jou).
- Detail-paneel bij klik op rij.
- CSV-export knop.
- Link in admin-zijbalk.

---

## Wat ClickWise-zijde moet kloppen (jij doet dit eenmalig)

1. In ClickWise → **Automation → Workflows → New Workflow**.
2. Trigger: **External Event** met event-naam exact `form_submitted_demo`.
3. Optioneel: filters op de meegestuurde data (bv. `org_type = "festival"` voor een speciale follow-up).
4. Bouw de gewenste actie (notificatie, contact aanmaken, e-mailsequentie, taak voor jou, etc.).
5. **Tracking-script ophalen** uit jouw ClickWise sub-account (Sites/Tracking) en aan mij geven, óf bevestig dat ik je `CLICKWISE_OWN_SUBACCOUNT_ID` daarvoor mag gebruiken (dan zoek ik de standaard HL-tracking-snippet erbij).

---

## Wat we NIET doen in deze stap

- Geen server-side push naar ClickWise (dus geen contact aanmaken via GHL Contacts API vanuit deze form). Dat past beter bij event-aanmeldformulieren waar geen browser-tracking-context is. Voor het demo-formulier is de native External Event-flow exact wat ClickWise zelf aanraadt.
- Geen formulier-builder per event — komt later op dezelfde `form_submissions` tabel.

---

## Wat ik na approval van jou nodig heb

1. **Tracking-script snippet** uit ClickWise (Settings → Tracking, of vergelijkbaar). Ziet er meestal uit als:
   ```html
   <script src="https://app.clickwise.app/tracking.js?id=XXXX" async></script>
   ```
   óf een inline `<script>...LeadConnector.init(...)...</script>`.
2. Bevestiging dat de event-naam **`form_submitted_demo`** mag — die zet ik dan in de code en jij gebruikt exact dezelfde naam in je workflow-trigger.
3. (Optioneel) Het e-mailadres voor de notificatie als dat niet `info@txeventshare.nl` moet zijn.