<!-- documentatie — niet uitvoeren -->

# Bouwlog — TX EventShare

Doorlopend genummerd, nieuwste entry bovenaan. Tijden Europe/Amsterdam.

## #004 — 20-07-2026 — Bugfix
Vastgelopen unsubscribe-afhandeling in de fan-out opgelost. Afgemelde contacten werden elke run opnieuw benaderd omdat de afmelding alleen in HighLevel stond en niet aan onze kant werd vastgelegd; elke run eindigde daardoor permanent op status "partial", wat echte fouten maskeerde.

Wijzigingen (identiek toegepast in de drie kopieën van fan-out-sms.ts: clickwise-sync, event-reminder-cron, weekly-event-digest):
- `sendMessage` geeft nu een veld `unsubscribed` terug, herkend aan de HighLevel-responsbody.
- Nieuwe functie `markUnsubscribed` zet de tag `sms-unsubscribed` op het contact in HighLevel.
- Nieuwe helper `keepContact` filtert in `fetchSubscribers` en `fetchSubscribersFallback` op: de tag `sms-unsubscribed`, `dnd === true`, en `dndSettings.SMS.status === "active"` (defensief, met optional chaining en per-skip logregel).
- Afmeldingen tellen als `skipped_unsubscribed` in plaats van `failed`; een run met uitsluitend afmeldingen logt weer als "success".
- Ook meegelogd in de payload van event-reminder-cron en weekly-event-digest.

Templates, cron-registraties, kanaal- en taaldetectie, RLS en migraties zijn niet aangeraakt.

### Beslissingen
- Gekozen voor een niet-destructieve markering (tag `sms-unsubscribed` toevoegen) in plaats van het verwijderen van de `events`-tag, omdat tenants die tag mogelijk in eigen HighLevel-workflows gebruiken.
- De DND-check is bewust defensief geschreven: bij ontbrekende velden gedraagt de code zich exact als voorheen, en blijft de tag het vangnet.

### Bevindingen
- Geverifieerd in HighLevel op het betrokken contact (7HmNzy0s8kz5JgnItuaj): de opt-out staat als "Text Messages" onder DND, terwijl "DND All Channels" uit staat. Een controle op alleen `dnd === true` zou dit geval dus gemist hebben; de kanaalspecifieke check is doorslaggevend.
- HighLevel verwijdert bij een opt-out de `events`-tag niet, waardoor het contact zonder deze fix in de subscriberlijst bleef staan.

### Openstaande punten
- Nog te verifiëren in de functielogs van de eerstvolgende cron-run: of `POST /contacts/search` het `dndSettings`-object daadwerkelijk meestuurt. Zo niet, dan vangt de tag het op vanaf de tweede run.

## #003 — 20-07-2026 — Beslissing
Correctie op #001/#002: custom domein txeventshare.nl blijkt al gekoppeld (DNS A-record wijst naar Lovable custom-domain-IP 185.158.133.1, bevestigd door eigenaar). Het "domeinbesluit" vervalt als blocker en als openstaand punt; de Lovable-API toont custom domeinen niet en rapporteert alleen de lovable.app-URL — daardoor ontstond de verkeerde aanname.

## #002 — 20-07-2026 — Overig
Nulmeting: docs/MASTERPLAN.md, docs/BOUWLOG.md en docs/STATUS.json aangemaakt als afgeleide van de Lovable-edit-historie. Geen functionele wijzigingen.

## #001 — 20-07-2026 — Overig (reconstructie 06-04 t/m 06-05-2026)
Samenvatting van de volledige bouwperiode, per categorie:

- **Feature:** multi-tenant fundament met RLS en /admin; event-wizard met autosave, recurring occurrences en AI-assist; publieke eventpagina's met share/OG-flow en statische OG-pagina's; 5 SEO-pagina's, discover en demo-aanvraag; publieke Events API; widget-wizard met v1/v2-embed en quality checks; distributiecentrum; branding-tab en medialibrary met stock-image search; meertaligheid nl/fy/de/en (UI + events); Stripe-laag (plans, add-ons, boost, portal); ClickWise/HighLevel-integratie: per-tenant koppeling, kalender-sync, fan-out SMS/WhatsApp, event-reminder-cron, weekly-event-digest, fan-out-instellingen.
- **Bugfix:** intensieve stabilisatie ClickWise-sync (09-04 en 05-05): duplicate appointments, calendar_id, cross-midnight eindtijden, slot-validatie, sync-spam, GHL-errorlogging; share-URL-canonicalisatie naar /e/.
- **UI-UX:** mobiele polish (widgets, publieke eventpagina, wizard), hero-redesign, logo/favicon-iteraties, NL-microcopy.
- **Config:** weekly-digest cron geregistreerd op 08:00 UTC di; verify_jwt uit voor cron-functies; publicatie op txeventshare.lovable.app.

### Beslissingen
- Weekly digest bewust op één cron-schedule 08:00 UTC: 10:00 NL in zomertijd, 09:00 NL in wintertijd — geaccepteerd compromis.
- Canonieke publieke event-URL is /e/:slug; per-tenant event_page_url_template met fallback txeventshare.nl/e/{slug}.
- Fan-out-templates (buildSmsMessage e.d.) en cron-registraties gelden als bevroren kernlogica.

### Blokkades
- Geen harde blokkades. Wel besluit nodig: custom domein txeventshare.nl koppelen (code verwijst ernaar, publicatie staat op lovable.app).

### Openstaande punten
- Geen bouwactiviteit sinds 06-05-2026 (~2,5 maand); geen actieve fase gekozen.
- .lovable/audit-report.md (06-04) is sterk verouderd — niet als statusbron gebruiken; dit bouwlog en MASTERPLAN.md zijn leidend.
- Fase 10 (validatie & lancering) volledig open: E2E-tenanttest, Stripe-validatie, domeinbesluit, eerste echte tenants.
