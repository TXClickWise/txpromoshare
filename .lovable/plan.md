

## Plan: Social media kanalen bijwerken + WhatsApp berichtformat + minimaal emoji-gebruik

### Overzicht van alle wijzigingen

Dit plan omvat alles wat besproken is: kanalen aanpassen, twee WhatsApp-perspectieven, gestructureerde berichtformats, en menselijk klinkende teksten met minimaal emoji-gebruik.

---

### 1. `supabase/functions/ai-assist/index.ts` — AI-prompts aanpassen

**`distribution_content` prompt herschrijven:**
- WhatsApp = organisator-perspectief: "Geschreven vanuit de organisator, gericht aan nieuwe en bestaande relaties"
- Nieuw veld `tiktok`: kort, energiek, casual toon voor 18-30 jaar, trending hashtags, max 2200 tekens
- Nieuw veld `gbp`: zakelijk, lokaal, zonder emoji's, met locatie-info, max 1500 tekens
- Instagram verfijnen: visueel-gericht, hashtags, engaging voor 25-45 jaar
- **Alle velden**: instructie "Gebruik maximaal 1-2 emoji's per tekst. Schrijf menselijk, niet AI-achtig. Geen opsommingen van emoji's."

**Nieuw prompt-type `visitor_whatsapp`:**
- Instructie: "Schrijf een kort WhatsApp bericht vanuit een bezoeker die een vriend uitnodigt om samen naar het event te gaan. Persoonlijk, informeel, alsof een echte vriend het stuurt. Max 1 emoji. Max 200 tekens exclusief link."

**Alle prompts**: regel toevoegen "Beperk emoji-gebruik tot maximaal 1-2 per tekst. De tekst moet menselijk en natuurlijk overkomen."

---

### 2. `src/pages/DistributionPage.tsx` — Organisator WhatsApp-format + nieuwe kanalen

**WhatsApp default tekst wijzigen naar gestructureerd organisator-format (A):**
```text
{titel}

{korte omschrijving}

{datum} om {tijd}

{CTA tekst}: {event link}

Zet in je agenda: {google calendar link}

txeventshare.nl
```
Maximaal 1 emoji (alleen bij titel, optioneel).

**Nieuwe ShareTextCards toevoegen:**
- TikTok kaart (charLimit 2200, beschrijving "Korte, pakkende tekst voor TikTok")
- Google GBP kaart (charLimit 1500, beschrijving "Zakelijke post voor Google Bedrijfsprofiel")

**Teaser beschrijving:** "X/Twitter" verwijzing verwijderen → "Voor stories of advertenties"

**`handleGenerateAll`:** verwacht nu ook `tiktok` en `gbp` van AI-response.

**Imports:** TikTok icoon → `Music` of `Video` van lucide. GBP → `MapPin`.

---

### 3. `src/components/distribution/ChannelBar.tsx` — Kanalen vervangen

- **Verwijderen:** X/Twitter
- **Toevoegen:** Instagram, TikTok, Google GBP
- **Nieuwe prop:** `eventImageUrl`
- **Instagram/TikTok/GBP actie:** `navigator.share({ text, files: [imageFile] })` via Web Share API (mobiel). Fallback desktop: tekst kopiëren + toast.
- **Grid:** `sm:grid-cols-4` (8 items → 2 rijen van 4)

---

### 4. `src/pages/PublicEventPage.tsx` — Bezoeker WhatsApp-format + kanalen

**X/Twitter share-knop verwijderen** (regel 394-398).

**WhatsApp share-tekst wijzigen naar bezoeker-perspectief (B):**
```text
Hey, ik zag dit event en het lijkt me echt leuk. Ga je mee?

{CTA tekst}: {event link}

Zet in je agenda: {google calendar link}

Via txeventshare.nl
```
De event-link genereert automatisch een OG-preview in WhatsApp (de "header" met afbeelding, titel, beschrijving).

**Google Calendar link genereren:**
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text={titel}&dates={startISO}/{endISO}&location={locatie}
```

---

### 5. `supabase/functions/widget-embed/index.ts` — Widget share-knoppen

- **X/Twitter knop verwijderen** (regel 169)
- **WhatsApp share-tekst** wijzigen naar bezoeker-perspectief (zelfde format als PublicEventPage)

---

### 6. `src/components/distribution/ShareTextCard.tsx` — AI-acties uitbreiden

Toevoegen aan `AI_ACTIONS`:
- `{ id: "tiktok", label: "Optimaliseer voor TikTok", icon: "🎵" }`
- `{ id: "gbp", label: "Optimaliseer voor Google", icon: "📍" }`

---

### Samenvatting platformregels

| Platform | Max | Perspectief | Stijl | Emoji's |
|---|---|---|---|---|
| WhatsApp (organisator) | 500 | Organisator | Informatief, uitnodigend | Max 1 |
| WhatsApp (bezoeker) | 300 | Vriend/gast | Persoonlijk, "ga je mee?" | Max 1 |
| Instagram | 2200 | Organisator | Visueel, hashtags | Max 2 |
| TikTok | 2200 | Organisator | Kort, energiek, casual | Max 2 |
| Facebook | 2200 | Organisator | Community, informatief | Max 2 |
| Google GBP | 1500 | Organisator | Zakelijk, lokaal | Geen |

