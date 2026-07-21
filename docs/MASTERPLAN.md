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
- [x] Custom domein txeventshare.nl gekoppeld (gecorrigeerd 20-07-2026, zie BOUWLOG #003)
- [ ] Onboarding eerste echte tenants

## Fase 11: UI/UX-herziening — done
Aanleiding: de app was op veel plekken druk en onoverzichtelijk, met contrastfouten en onlogische flows. Doel is een rustige, premium uitstraling in de ClickWise-huisstijl, die zowel op desktop als op mobiel klopt.

- [x] 11.0 Quick fixes: scroll-naar-boven, dubbele knoppen, tapdoelen
- [x] 11.1 Fundament: ClickWise-palet, contrast naar WCAG AA, typografische schaal, minder gradient en motion
- [x] 11.1b Bugronde: taalmix, afgekapte badges, seconden in tijden, branding-defaults, usage-meters, dashboardcijfers, labels, statkaarten
- [x] 11.1c Landingspagina herbouwd op nieuwe copy
- [x] 11.1d Goudcorrectie (accent-strong) en typografisch logo als tussenoplossing
- [x] 11.2 Navigatie en instellingen: van elf menu-items naar vijf, instellingen als echte laag
- [x] 11.3 Kernschermen mobile-first: dashboard, distributiepagina, eventoverzicht
- [x] 11.4 Wizard en flows: vaste stappenstructuur, eerlijke voortgang, één publiceeractie
- [ ] 11.5 Landingspagina-copy opnieuw schrijven op basis van de eigen woorden van de eigenaar (afgekeurd: verkeerd register, beweringen zonder mechanisme, prijsbelofte die niet klopt)


## Fase 12: Omslachtige procedures wegwerken — todo
- [ ] Media-upload herzien: meerdere bestanden tegelijk, geüploade afbeelding automatisch in het veld van herkomst, terugkeer in de galerij met de nieuwe afbeelding geselecteerd
- [ ] Inventarisatie van alle flows: per taak het aantal kliks, contextwissels en doodlopende einden vaststellen
- [ ] De gevonden knelpunten oplossen

## Fase 13: AI-assistent herzien — todo
- [ ] Datum en tijd uit vrije tekst herkennen en in de juiste velden zetten, met bevestigingsstap
- [ ] Bronnen kiezen via een zoekfunctie in plaats van handmatig ingevoerde URL's; gekozen bron krijgt voorrang bij het schrijven van de content
- [ ] Afbeeldingen kiezen uit zoekresultaten, waar mogelijk gefilterd op vrij te gebruiken materiaal, met een korte melding aan de gebruiker over eigen verantwoordelijkheid voor rechten

## Fase 14: Helpsectie — todo
Bewust als laatste, omdat screenshots van schermen die nog wijzigen direct verouderen.
- [ ] Widget-installatie per platform: WordPress-plugin, Wix, Squarespace, handmatig in HTML
- [ ] Stap-voor-stap instructies: account aanmaken, evenement maken, widget plaatsen
- [ ] Voorzien van echte screenshots uit de afgeronde app
