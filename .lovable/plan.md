

## Plan: WhatsApp bezoeker-bericht corrigeren

### Analyse van het probleem

Het huidige bezoeker WhatsApp-bericht uit de widget bevat meerdere fouten:

**Wat er mis is:**

1. **Header toont website-info i.p.v. event-info** — De widget gebruikt `e.cta_link` (eigeweis.com) als primaire URL. WhatsApp toont daarom de OG-preview van de website, niet van het event.
2. **Geen event-specifieke details in de tekst** — Titel, datum/tijd en korte omschrijving ontbreken volledig in het bericht.
3. **Geen CTA-link** — Er is geen duidelijke call-to-action met link naar de eventpagina.
4. **Geen agenda-link** — "Zet in je agenda" ontbreekt in de widget-versie.
5. **Link gaat naar eigeweis.com** — Moet naar `txeventshare.nl/e/{slug}` gaan zodat de OG-preview het event toont.
6. **OG-preview werkt niet voor txeventshare.nl** — De SPA rendert meta-tags client-side; WhatsApp-crawlers voeren geen JavaScript uit. Er is een server-side OG-proxy nodig (apart punt, bestaand bekend issue).

### Gewenst berichtformat (Bezoeker/B)

De link naar de eventpagina staat bovenaan zodat WhatsApp daar de OG-preview van maakt (de "header"). Daaronder de persoonlijke tekst en compacte links:

```text
https://txeventshare.nl/e/{slug}

Hey, ik zag dit event en het lijkt me echt leuk. Ga je mee?

{titel} — {datum} om {tijd}

{CTA tekst}: {cta_link}
Zet in je agenda: {calendar_link}
```

De `txeventshare.nl` backlink kan vervallen omdat de eventpagina-link al naar txeventshare.nl wijst.

### Wijzigingen

#### 1. `supabase/functions/widget-embed/index.ts` (regel 163-164)
- Event-URL altijd `https://txeventshare.nl/e/{slug}` maken (niet `cta_link`)
- Bezoeker-tekst uitbreiden met: event titel, datum/tijd, CTA-link en agenda-link
- Google Calendar URL genereren in de edge function
- "Via txeventshare.nl" verwijderen (redundant)

#### 2. `src/pages/PublicEventPage.tsx` (regel 151)
- `visitorWhatsappText` herschrijven: eventpagina-link bovenaan (voor OG-header), dan persoonlijke tekst, dan event titel + datum, dan compacte CTA + agenda-link
- `shareUrl` altijd als eerste link (niet `cta_link`)
- "Via txeventshare.nl" verwijderen

#### 3. OG-proxy (vermelding)
- Voor een werkende OG-preview "header" in WhatsApp is een server-side OG-proxy edge function nodig die de juiste meta-tags rendert voor crawlers. Dit is een apart, al bekend issue. Zonder deze proxy toont WhatsApp geen preview-header voor txeventshare.nl links.

### Samenvatting berichtstructuur

| Element | Organisator (A) | Bezoeker (B) |
|---|---|---|
| Event-afbeelding | Via OG-preview van link | Via OG-preview van link (bovenaan) |
| Titel + omschrijving | In tekst | In OG-preview + korte vermelding |
| Datum/tijd | In tekst | Compact in tekst |
| CTA-link | Prominent | Compact, 1 regel |
| Agenda-link | Eigen regel | Compact, 1 regel |
| Persoonlijke tekst | — | "Hey, ga je mee?" |
| txeventshare.nl | Onderaan | Niet nodig (zit in event-link) |

