

## Plan: WhatsApp bezoekersbericht corrigeren

### Analyse van de screenshot

De screenshot is van **vóór** de OG-proxy implementatie. Nu de OG-proxy live is, zouden punten 1 en 2 (verkeerde afbeelding/tekst in de header) opgelost moeten zijn — WhatsApp haalt nu de meta-tags op van de edge function die de juiste event-titel, beschrijving en afbeelding retourneert.

Wat nog wel aangepast moet worden:

| # | Probleem | Actie |
|---|---------|-------|
| 4 | Rauwe URL `https://txeventshare.nl/e/...` staat los in de tekst | Verwijderen uit berichttekst (de URL zit al in de OG-preview header) |
| 6 | "Zet in je agenda" staat er 2x met verschillende links | Gehele agenda-functionaliteit verwijderen |

### Wijzigingen

#### 1. `src/pages/PublicEventPage.tsx`
- **Regel 144-149**: Verwijder de Google Calendar URL-berekening
- **Regel 155-156**: Verwijder `shareUrl` uit de eerste regel van `visitorWhatsappText`
- **Regel 163**: Verwijder `Zet in je agenda: ${calendarUrl}`

Nieuw berichtformat:
```text
Hey, ik zag dit event en het lijkt me echt leuk. Ga je mee?

Retro Night — 29 mei 2026 om 21:00

Meer info: https://eigeweis.com
```

#### 2. `supabase/functions/widget-embed/index.ts`
- **Regels 166-172**: Verwijder Google Calendar URL-berekening
- **Regel 182**: Verwijder `eventPageUrl` uit eerste regel van `visitorLines`
- **Regel 192**: Verwijder `Zet in je agenda:` regel

#### 3. Verificatie
- Na de wijzigingen de OG-proxy testen om te bevestigen dat WhatsApp nu de juiste event-afbeelding en -titel toont als preview header

