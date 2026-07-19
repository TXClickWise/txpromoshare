<!-- documentatie — niet uitvoeren -->

# Masterplan — TX EventShare

Nulmeting opgesteld 20-07-2026, gereconstrueerd uit de volledige Lovable-edit-historie (06-04-2026 t/m 06-05-2026). Fasenummering volgt de nummering die tijdens de bouw is gebruikt.

## Fase 1: Fundament — done
- [x] Multi-tenant schema (20+ tabellen, RLS, tenant-isolatie)
- [x] Auth (register/login/logout/reset), auto tenant-creatie bij signup
- [x] Platform-admin omgeving (/admin: tenants, users, subscriptions, audit)

## Fase 2: Kern-eventbeheer — done
- [x] Event-CRUD via wizard (autosave, inline validatie, unsaved-guard)
- [x] Recurring events (recurrence-tool, occurrences-tab, edit-scope dialog)
- [x] Categorieën (drag-n-drop), team, templates (system seeds), settings

## Fase 3: Publieke laag & sharing — done
- [x] Publieke eventpagina /e/:slug (hero, galerij, JSON-LD, add-to-calendar)
- [x] Share-flow WhatsApp/Facebook/X incl. og-proxy en statische OG-pagina's
- [x] Landing, pricing, 5 NL SEO-pagina's, /evenementen (discover), /demo
- [x] Publieke Events API (public-events-api)

## Fase 4: Widgets & distributie — done
- [x] Widget-wizard (config, preview, quality check, HTML/WordPress embed)
- [x] widget-embed edge function, v1/v2 versionering, ?lang= support
- [x] Distributiecentrum (kanaalspecifieke shareteksten, QR, autosave, stats)

## Fase 5: Branding & media — done
- [x] Branding-tab (logo-uploader, preview-grid, review-flow, crop hints)
- [x] Medialibrary + stock-image search (search-based toevoegen)

## Fase 6: Meertaligheid — done
- [x] UI-vertalingen nl/fy/de/en incl. language switchers
- [x] Event-vertalingen (translate-event, ContentLanguageTabs)

## Fase 7: Commerciële laag (Stripe) — done
- [x] Plans, add-ons, boost-checkout, customer portal, check-subscription
- [ ] Validatie met echte betalingen niet verifieerbaar uit de historie — controleren vóór lancering

## Fase 8: Superadmin-verfijning — done
- [x] Plans/overrides/form submissions/usage panels, audit

## Fase 9: ClickWise/HighLevel-integratie — done
- [x] Per-tenant koppeling (API key, subaccount), event→kalender-sync incl. delete/depublish
- [x] Fan-out SMS/WhatsApp naar subscribers (taal- en kanaaldetectie)
- [x] Event-reminder-cron en weekly-event-digest (di 08:00 UTC)
- [x] Fan-out-instellingen per tenant (laatste edit 06-05-2026)

## Fase 10: Validatie & lancering — todo
- [ ] End-to-end tenanttest: registratie → publiceren → widget → automatische notificaties
- [ ] Stripe-betaalflow valideren (echte checkout, portal, add-ons)
- [ ] Besluit custom domein: code verwijst naar txeventshare.nl, publicatie staat op txeventshare.lovable.app
- [ ] Onboarding eerste echte tenants
