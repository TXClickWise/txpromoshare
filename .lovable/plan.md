

## Plan: ClickWise-teksten herschrijven — oplossings-gericht, met abonnementsinfo en DFY-service

### Kernboodschap-wijzigingen

Drie inhoudelijke verschuivingen in alle ClickWise-gerelateerde teksten:

1. **Benefit-first copywriting** — geen technische opsommingen ("sync", "API", "PUT requests"), maar wat het de klant oplevert: automatische reminders, minder handwerk, betere opvolging
2. **Separaat ClickWise abonnement** — duidelijk maken dat de koppeling niet in de TX EventShare plannen zit. Er is een apart ClickWise abonnement nodig. Heb je al ClickWise? Dan is de koppeling gratis.
3. **DFY-service** — op tactische plekken vermelden: "Wij regelen de volledige setup, inrichting en koppeling voor je. Eenmalig v.a. €89,- excl. btw."

---

### 1. ClickWiseIntegratiePage.tsx (volledige herschrijving teksten)

**Hero**:
- Subtitle: focus op resultaat ("Automatische reminders voor je gasten, slimmere opvolging na afloop en je events altijd zichtbaar in je marketing — zonder extra werk.")
- CTA: "Pro plan starten" → "Meer weten over ClickWise" of "Bekijk de mogelijkheden"

**Pricing-blok toevoegen** (nieuw, onder de hero):
- Klein info-blok dat uitlegt:
  - "De ClickWise koppeling is niet inbegrepen in de TX EventShare plannen."
  - "Je hebt een apart ClickWise abonnement nodig."
  - "Heb je al een ClickWise account? Dan is de koppeling met TX EventShare gratis."
  - DFY-aanbod: "Liever dat wij alles voor je inrichten? Onze Done For You service regelt de volledige setup, inrichting en koppeling. Eenmalig v.a. €89,- excl. btw."

**Benefits cards**: herschrijven van technisch naar oplossings-gericht:
- "Automatische sync" → "Nooit meer handmatig kopiëren" — "Publiceer een event en het verschijnt automatisch in je marketing. Geen knip-en-plakwerk meer."
- "Workflow triggers" → "Reminders die zichzelf versturen" — "Je gasten krijgen automatisch een WhatsApp of e-mail voor aanvang. Jij hoeft niks te doen."
- "Slimmere opvolging" → "Na het event blijf je top-of-mind" — "Automatische follow-up na afloop. Bedank bezoekers, deel foto's of promoot je volgende event."
- Etc.

**"Zo werkt de koppeling"**: vereenvoudigen, minder technisch
- Stap 1: "Kies je ClickWise abonnement of koppel je bestaande account"
- Stap 2: "Wij richten alles voor je in (of je doet het zelf)"
- Stap 3: "Publiceer een event — de rest gaat automatisch"

**Praktische toepassingen**: herschrijven als herkenbare scenario's
- "Je publiceert een live muziek avond → je vaste gasten krijgen automatisch een WhatsApp-herinnering"
- "Een proeverij is afgelopen → bezoekers ontvangen een bedankmail met je volgende event"
- Etc.

**FAQ updaten**:
- Nieuwe vraag: "Zit de ClickWise koppeling in de prijs van TX EventShare?" → "Nee, je hebt een apart ClickWise abonnement nodig. Heb je al ClickWise? Dan is de koppeling gratis."
- Nieuwe vraag: "Kan ik de setup laten doen?" → "Ja! Onze Done For You service regelt de volledige inrichting. Eenmalig v.a. €89,- excl. btw."
- Bestaande FAQ's herschrijven: minder technisch, meer resultaat-gericht

**Eind-CTA**: aanpassen met DFY-optie
- "Klaar om te starten? Kies je ClickWise abonnement of laat ons alles voor je inrichten."

---

### 2. LandingPage.tsx

**Feature card** (regel 59, ClickWise):
- Desc: "Automatische reminders naar je gasten, slimmere opvolging na events en je promotie volledig op de automatische piloot."

**ClickWise sectie** (regel 460-518):
- Beschrijving herschrijven: benefit-first, geen "native integratie" jargon
- Bulletpoints:
  - "Gasten krijgen automatisch een herinnering voor aanvang"
  - "Na afloop start je follow-up vanzelf"
  - "Wijzig een event — alles wordt automatisch bijgewerkt"
  - "Eén ecosysteem in plaats van vijf losse tools"
- Toevoegen: korte note over separaat abonnement + DFY
- Link: "Ontdek de integratie" → linken naar /clickwise-integratie

**Comparison table** (regel 81):
- "CRM integratie" → "ClickWise koppeling (separaat abo)"

**FAQ** (regel 97):
- Antwoord updaten: vermelden dat apart ClickWise abonnement nodig is, gratis bij bestaand account

---

### 3. PricingPage.tsx

**Comparison table** (regel 27):
- "ClickWise CRM integratie" → "ClickWise koppeling (apart abo)" met toelichting
- Eventueel een footnote/tooltip: "Separaat ClickWise abonnement vereist. Gratis koppeling bij bestaand account."

---

### 4. src/lib/i18n.ts

**Pro plan features**:
- "ClickWise CRM integratie" → "ClickWise koppeling (apart abo)"

**ClickWise integration beschrijving**:
- "Verbind je CRM en marketing automation" → "Automatische reminders, opvolging en promotie op de automatische piloot"

---

### Bestanden die worden aangepast

| Bestand | Wat |
|---|---|
| `src/pages/seo/ClickWiseIntegratiePage.tsx` | Volledige tekst-herschrijving + pricing-blok + DFY-sectie |
| `src/pages/LandingPage.tsx` | Feature card, ClickWise sectie, comparison row, FAQ |
| `src/pages/PricingPage.tsx` | Comparison row + footnote |
| `src/lib/i18n.ts` | Pro features + integratie beschrijving |

