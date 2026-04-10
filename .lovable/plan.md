

## Plan: WhatsApp OG-preview en berichttekst optimaliseren

### Analyse van de screenshot

De WhatsApp preview toont:
1. **Header/OG-preview**: Afbeelding, titel en beschrijving worden correct opgehaald — maar datum/tijd ontbreekt in de description
2. **Zichtbare URL**: De lange `ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/og-proxy?slug=...` URL staat als losse tekst in het bericht
3. **Redundante tekst**: Evenementnaam + datum staan zowel in de header als in de berichttekst

### Gewenst resultaat

De OG-preview header bevat alles (afbeelding, titel, beschrijving incl. datum/tijd), waardoor de berichttekst alleen de persoonlijke uitnodiging en CTA hoeft te bevatten. De lange URL mag niet zichtbaar zijn als tekst.

### Wijzigingen

#### 1. OG-proxy: datum/tijd toevoegen aan og:description (`supabase/functions/og-proxy/index.ts`)

De `og:description` moet altijd datum en tijd bevatten zodat die info in de header preview staat:

```
og:description = "10 april 2026 om 10:00 — Geniet van rust en lekker eten terwijl de kinderen spelen..."
```

- Datum/tijd formatteren en prependen aan de description
- `start_time` toevoegen aan de select query (zit er al in)

#### 2. Widget WhatsApp-tekst vereenvoudigen (`supabase/functions/widget-embed/index.ts`)

De `visitorLines` aanpassen — de OG-proxy URL blijft als eerste regel (nodig om de preview te triggeren), maar de redundante event-titel + datum regel vervalt:

```text
[OG-proxy URL]          ← niet zichtbaar voor gebruiker dankzij OG-preview
                        
Hey, ik zag dit event en het lijkt me echt leuk. Ga je mee?

Reserveer een tafel: https://eigeweis.guestplan.io
```

**Probleem met zichtbare URL**: WhatsApp toont de URL als klikbare tekst wanneer deze als eerste regel staat. Dit is inherent aan hoe WhatsApp werkt — de URL is nodig om de preview te genereren. **Oplossing**: de URL naar het einde van het bericht verplaatsen. WhatsApp genereert de OG-preview voor elke URL in het bericht, niet alleen de eerste.

Nieuw format:
```text
Hey, ik zag dit event en het lijkt me echt leuk. Ga je mee?

Reserveer een tafel: https://eigeweis.guestplan.io

https://[og-proxy-url]
```

De URL staat onderaan, na de CTA, waardoor de focus op de uitnodiging en actie ligt.

#### 3. PublicEventPage WhatsApp-tekst (`src/pages/PublicEventPage.tsx`)

Zelfde aanpassing: URL naar onderaan, event-titel+datum regel verwijderen.

### Technische details

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/og-proxy/index.ts` | `og:description` = datum/tijd + korte omschrijving |
| `supabase/functions/widget-embed/index.ts` | `visitorLines`: verwijder titel+datum regel, URL naar einde |
| `src/pages/PublicEventPage.tsx` | `visitorWhatsappText`: verwijder titel+datum regel, URL naar einde |

Beide edge functions worden opnieuw gedeployed na de wijzigingen.

