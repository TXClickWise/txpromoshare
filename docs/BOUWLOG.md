<!-- documentatie — niet uitvoeren -->

# Bouwlog — TX EventShare

Doorlopend genummerd, nieuwste entry bovenaan. Tijden Europe/Amsterdam.

## #013 — 20-07-2026 — UI-UX
Fase 11.4: event-wizard en flows herzien.

- Publiceerknop uit de sticky header verwijderd. Publiceren gebeurt uitsluitend op stap 5, op basis van `validateStep(5).isValid`.
- Voortgangsvinkjes zijn niet langer afgeleid: een stap is voltooid wanneer hij bezocht én valide is.
- De wizard heeft altijd vijf vaste stappen. OccurrencesTab (Datums) en StepTranslations (Vertalingen) zijn verplaatst naar een tabstrook die alleen bij het bewerken van een bestaand evenement verschijnt.
- Stapnavigatie consistent gemaakt: terugspringen mag altijd, vooruitspringen alleen als alle voorgaande stappen valide zijn. Vergrendelde stappen tonen een uitleg.
- Dubbele opslagknop onderaan stap 5 verwijderd.
- Nagecorrigeerd: `visitedSteps` startte altijd op stap 1, waardoor een bestaand volledig ingevuld evenement alle stappen als onvoltooid toonde. Bij bewerken gelden nu alle stappen als bezocht; de validatie bepaalt het vinkje.

### Bevindingen
- Er stonden twee publiceerknoppen met verschillende voorwaarden. De knop in de header werd actief zodra titel en datum waren ingevuld, waardoor publiceren mogelijk was zonder de stappen Media en Promotie ooit te hebben geopend. De knop op stap 5 gebruikte wel de echte validatie.

## #012 — 20-07-2026 — UI-UX
Fase 11.3: dashboard, eventoverzicht en Delen & Posten mobile-first herzien.

- Dashboard van acht blokken naar vier: tipblok en quick actions verwijderd, verbruiksmeters en upgrade-prompt alleen zichtbaar wanneer een limiet in zicht komt, emoji's verwijderd.
- Plan-limieten stonden hardgecodeerd in het dashboardcomponent en zijn verplaatst naar de bestaande planbron.
- Eventoverzicht: event-ID met kopieerknop van elke kaart verwijderd en verplaatst naar het actiemenu; "Terugkerend" uit de statustabs gehaald omdat het een eigenschap is en geen status; filterbalk mobielvriendelijk gemaakt; selectie-checkbox niet meer permanent zichtbaar; datum ook zichtbaar in de lijstweergave op mobiel.
- Delen & Posten: van negen open tekstvelden naar drie lagen — link en snel delen bovenaan, kanaalteksten ingeklapt, kwaliteitscheck en statistieken onderaan.
- Technische fout hersteld: `setSelectedEvent` werd aangeroepen tijdens het renderen; verplaatst naar een effect.
- Twee regressies uit de fundamentronde hersteld: `gradient-hero` met gloed op de knop "Nieuw evenement", en staggered framer-motion-animaties op kaarten en lijstitems.
- Hardgecodeerde Nederlandse teksten in alle drie de schermen verplaatst naar de vertaalsleutels.

### Beslissingen
- De emoji's in de standaard WhatsApp-tekst blijven staan. De app is verder emoji-vrij, maar in een WhatsApp-bericht zijn ze gebruikelijk en helpen ze bij het scannen. Bewuste uitzondering.

## #011 — 20-07-2026 — UI-UX
Instellingen opnieuw ingedeeld en een UX-bug bij locaties opgelost.

- De groepen "Website", "Merk" en "Inhoud" zijn vervallen. Vervangen door vier kopjes met negen directe ingangen, zonder tussenpagina: Je bedrijf (Bedrijfsgegevens, Locaties, Huisstijl), Evenementen (Categorieën, Mediabibliotheek), Verspreiding (Agenda-widgets, WhatsApp & SMS), Account (Team, Abonnement).
- Bewerken van een locatie gaat naar een dialoog. Voorheen vulde de knop een formulier ver onder de lijst zonder zichtbare verandering; op mobiel stond dat volledig buiten beeld, waardoor de knop kapot leek.
- Hardgecodeerde teksten in de onboarding-checklist verplaatst naar de vertaalsleutels.

### Beslissingen
- De groep "Website" bundelde de agenda-widget met de ClickWise-koppeling op grond van "verbindingen met de buitenwereld". Dat is een systeemcategorie, geen gebruikerscategorie: een widget is de agenda op je eigen site, ClickWise stuurt berichten naar gasten. Labels beschrijven voortaan wat je er doet, niet tot welke categorie iets behoort.

## #010 — 20-07-2026 — UI-UX
Fase 11.2: navigatie van elf items naar vier.

- Hoofdnavigatie is nu Dashboard, Evenementen, Delen & Posten en Instellingen.
- Sjablonen verplaatst naar een tabblad binnen Evenementen.
- Categorieën, Media, Team, Integraties en Abonnement verhuisd naar Instellingen.
- Widgets in een tweede ronde eveneens naar Instellingen verplaatst; een widget wordt eenmalig aangemaakt en daarna zelden aangepast.
- Alle oude routes werken via redirects. Interne links in dashboard, onboarding-checklist, lege staten, PlanGate-componenten en Delen & Posten bijgewerkt.

### Beslissingen
- Widgets is uit de hoofdnavigatie gehaald maar blijft kort bereikbaar via de onboarding-checklist en via Delen & Posten, omdat het de belangrijkste belofte naar nieuwe klanten is.

## #009 — 20-07-2026 — UI-UX
Publieke navigatie herzien en beeld toegevoegd aan de landingspagina.

- Publieke navigatie van zeven naar vier items. Twee dode of misleidende links verwijderd: "Prijzen" wees naar een anker op de homepage in plaats van naar de prijzenpagina, en "Voordelen" wees naar een SEO-pagina. "Inloggen" is een herkenbare knop geworden in plaats van de zwakste tekst op de pagina. Op mobiel zijn alle items minimaal 44px en staan Inloggen en Start gratis als volledig brede knoppen. Header van ruim 100px naar 64px.
- Hero-mockup was verborgen onder 1024px, waardoor de landingspagina op mobiel geen enkel beeld toonde. Nu responsive en ook op telefoon zichtbaar.
- Live agenda-widget van Café De Jutter toegevoegd bij "Zet het op je site", ingesloten met dezelfde methode die klanten zelf krijgen.
- "Bekijk een voorbeeld" verwijst naar een echte gepubliceerde eventpagina.
- Referentiestrook voorbereid op logobestanden: vaste hoogte, grijstinten met kleur bij hover, klikbaar naar de eigen website.

### Bevindingen
- De widget werd eerst als iframe met de `widget-embed`-URL als bron ingesloten. Die functie kent geen `format=html` en levert JavaScript, waardoor de browser de broncode als platte tekst toonde. De controle bestond uit een curl die 200 teruggaf, wat niets zegt: JavaScript geeft ook 200. In een tweede ronde hersteld met de officiële script-embed.

### Openstaande punten
- De website-URL's in de referentiestrook zijn ingevuld zonder verificatie en moeten gecontroleerd worden.
- De logobestanden van de drie referenties moeten nog worden aangeleverd.
- De landingspagina-copy is afgekeurd door de eigenaar: verkeerd register ("volle zaal" is geen horecataal), beweringen zonder mechanisme, en een prijsbelofte die het product niet waarmaakt. Copy wordt opnieuw geschreven op basis van de eigen woorden van de eigenaar in plaats van generieke formuleringen.


## #008 — 20-07-2026 — UI-UX
Goudcorrectie en typografisch logo als tussenoplossing.

- Nieuwe token `--accent-strong` (light 40 60% 32%, dark 40 55% 62%) toegevoegd in index.css en gemapt in tailwind.config.ts. Bedoeld voor kleine goudkleurige tekst op lichte achtergronden, die met het heldere `--accent` slechts ~2.4:1 haalde.
- Toegepast op de drie sectiekopjes van de landingspagina en op het scorepercentage in QualityCheck.
- Nieuw component `src/components/brand/Logo.tsx`: typografisch woordmerk in Plus Jakarta Sans met varianten light/dark, drie maten en optionele tagline. Vervangt het PNG-logo in AppLayout, PublicLayout, LoginPage, RegisterPage, ResetPasswordPage en UnsubscribePage. Het bestand logo-tx-eventshare.png blijft staan voor e-mail en OG-afbeeldingen.

### Beslissingen
- Twee goudtinten in plaats van één: het heldere ClickWise-goud blijft voor grote display-tekst, iconen, lijnen en alles op navy; de donkere tint is uitsluitend voor kleine tekst op licht. ClickWise zelf gebruikt klein goud op licht, maar dat haalt de WCAG AA-norm niet; leesbaarheid gaat hier voor exacte merkgelijkheid.
- Het logo is expliciet een tussenoplossing in code. Een professioneel hertekend logo in navy/goud, met een variant voor donkere achtergronden, blijft openstaan.

## #007 — 20-07-2026 — UI-UX
Landingspagina volledig herbouwd op nieuwe copy.

Verwijderd: de zes frustratiekaartjes met emoji's, de feature-grid van twaalf tegels, de vijf use-case-kaartjes, de vergelijkingstabel "Handmatig vs Generiek vs TX", de volledige prijstabel en de FAQ van zeven vragen.

Nieuw: hero met gouden cursieve tweede regel, kort probleemblok, drie-staps uitleg, referentiestrook, drie opbrengstblokken, doelgroepblok, prijzen-teaser met link naar /prijzen, FAQ met vier vragen in een accordion, en een navy slot-CTA. 43 nieuwe vertaalsleutels onder `landing.*` in nl en en; geen hardgecodeerde strings.

### Beslissingen
- Copy is geschreven op resultaat in plaats van functie, zonder emoji's en zonder jargon ("distributiecentrum", "fan-out", "embed", "multi-location"). De AI-schrijfhulp wordt aangeduid als "de ingebouwde assistent", niet als AI.
- Referenties (Café De Jutter, Texels Specialiteiten Restaurant Eigeweis, De Retro Brothers) staan als tekst-wordmarks met een `data-ref-slot`-haakje, zodat er later logo's in kunnen zonder structuurwijziging.
- Claims zijn geverifieerd bij de eigenaar: evenement aanmaken duurt circa twee minuten met de assistent; widget-installatie duurt circa vijf minuten via de WordPress-plugin of via één regel code.

### Openstaande punten
- De knop "Bekijk een voorbeeld" scrolt naar de uitleg in plaats van naar een echte eventpagina. Moet gaan verwijzen naar een gepubliceerd evenement of naar /evenementen.

## #006 — 20-07-2026 — Bugfix
Acht bugs opgelost die zichtbaar werden na de fundamentronde.

- Taalmix EN/NL: oorzaak was tweeledig. De UI-taal in het profiel stond op Engels, terwijl de event-wizard volledig hardgecodeerde Nederlandse strings bevatte en de taalinstelling negeerde. Alle wizardteksten lopen nu via vertaalsleutels (`wizard.*`), in nl en en.
- Statusbadges werden afgekapt op mobiel; lijstitems op het dashboard zijn omgebouwd zodat titel en tijd boven staan en badges eronder afbreken.
- Tijden toonden seconden; gedeelde helper `formatTime()` toegevoegd in src/lib/utils.ts.
- Branding-defaults stonden op felgroen en roze; gewijzigd naar navy en goud. Bestaande tenantkleuren zijn niet overschreven.
- UsageMeter toonde een volle balk bij nul verbruik op onbeperkte plannen; vulberekening en kleuren gecorrigeerd, label toont nu "x van y gebruikt".
- Dashboardcijfers waren tegenstrijdig; nu drie eerlijke tellingen (Gepubliceerd, Gepland, Concepten), waarbij concepten niet meer als aankomend meetellen.
- Formulierlabels in kapitalen omgezet naar normale schrijfwijze door de hele app.
- Statkaarten op mobiel compact gemaakt.

## #005 — 20-07-2026 — UI-UX
Fundamentronde van de UI-herziening (fase 0 en 1), in twee rondes uitgevoerd.

- Scroll-naar-boven bij elke routewisseling (ScrollToTop in App.tsx) en bij stapwisselingen in de event-wizard.
- ClickWise-palet doorgevoerd in index.css en tailwind.config.ts: navy als drager, goud als accent. Oranje en teal volledig vervallen. Nieuwe tokens voor surface-dark, on-dark, success en warning.
- Sidebar navy met gouden indicatorstreep bij het actieve item, in zowel AppLayout als AdminLayout.
- Plus Jakarta Sans als enige lettertype; Space Grotesk en DM Sans vervallen.
- Alle `text-[10px]` en `text-[11px]` vervangen door `text-xs`.
- Onleesbaar felgeel (`--highlight`) vervangen door donker amber (`--warning`); goud als kleine tekst op licht vervangen door navy, grijs of groen.
- Gradient-icoontegels vervangen door neutrale containers, schaduwen subtieler, staggered framer-motion-animaties verwijderd.
- Dubbele "Nieuw evenement"-knoppen en de misleidende quick action "Dupliceren" verwijderd; tapdoelen op mobiel naar minimaal 44px; instellingen-tabs horizontaal scrollbaar op mobiel.

### Beslissingen
- Navy wordt gebruikt als chrome (sidebar, headers, donkere secties op publieke pagina's), niet als werkvlak. De app zelf blijft licht, omdat een werkomgeving anders te zwaar wordt bij langdurig gebruik.
- Harde regel vastgelegd: goud nooit als knop, link, badge of kleine tekst op een lichte achtergrond. Wel voor iconen, randen, lijnen, bullets, grote display-tekst en alle tekst op navy.

### Bevindingen
- De eerste ronde liet twee zaken half af: de sidebar gebruikte nog `bg-card` waardoor de nieuwe sidebar-tokens nergens landden, en goud stond nog op diverse plekken als kleine tekst op licht. Beide in een tweede ronde gecorrigeerd.

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
