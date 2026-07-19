<!-- documentatie — niet uitvoeren -->

# Bouwlog — TX EventShare

Doorlopend genummerd, nieuwste entry bovenaan. Tijden Europe/Amsterdam.

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
