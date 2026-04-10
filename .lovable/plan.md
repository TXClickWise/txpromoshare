
## Analyse van de problemen

### 1. Er worden nu meerdere links in hetzelfde WhatsApp-bericht gedeeld
In de widget-tekst staat momenteel:
- eerst de persoonlijke uitnodiging
- daarna de CTA-link (`https://eigeweis.com`)
- daarna pas de og-proxy link

Dat veroorzaakt het kernprobleem: WhatsApp kiest niet altijd dezelfde link als bron voor de preview. Op mobiel en desktop lijkt WhatsApp daardoor verschillend gedrag te vertonen:
- op het ene apparaat wordt de CTA-link als “belangrijkste” link gebruikt
- op het andere apparaat de og-proxy link
- daardoor krijg je inconsistente previews en opmaak

### 2. De og-proxy link blijft zichtbaar als losse tekst
De huidige aanpak gebruikt een expliciete URL in de berichttekst om de preview te forceren. WhatsApp rendert zo’n URL vrijwel altijd ook zichtbaar in de chat. Dat is precies waarom je onderaan nog die lange backend-link ziet.

Belangrijk: dit is geen puur stylingprobleem. Zolang de og-proxy URL letterlijk in het bericht staat, heb je geen garantie dat WhatsApp die niet toont.

### 3. Mobiel en desktop gebruiken niet exact dezelfde share-flow
De widget gebruikt nu een simpele `wa.me/?text=...` aanpak. WhatsApp Web en WhatsApp mobiel verwerken multi-line tekst met meerdere links niet altijd identiek. Daardoor ontstaan verschillen in:
- welke link de preview opbouwt
- hoe de zichtbare tekst wordt geordend
- of een URL prominent als losse regel blijft staan

### 4. De preview-inhoud is inhoudelijk nog niet strak genoeg
Je gewenste header is:
- afbeelding bovenaan
- daaronder titel
- daaronder korte omschrijving
- bij voorkeur datum/tijd ook in die header
- geen zichtbare lange technische link
- geen dubbele eventinfo in de berichttekst

De og-proxy doet al een deel hiervan, maar de share-tekst en linkvolgorde ondermijnen het eindresultaat.

---

## Oplossing die dit structureel oplost

### Richting: nog maar één deel-link gebruiken in WhatsApp
De enige manier om dit echt consistent te maken tussen mobiel en desktop is:

1. In het WhatsApp-bericht nog maar één URL gebruiken
2. Die URL moet de publieke eventpagina zijn op je eigen domein (`txeventshare.nl/e/...`)
3. Die publieke eventpagina moet server-side de juiste OG-meta meegeven voor crawlers
4. De CTA-link (`eigeweis.com`) mag niet meer als losse URL in het WhatsApp-bericht staan

Met andere woorden: WhatsApp mag nog maar één link zien. Dan:
- kan het geen verkeerde bron kiezen
- krijg je mobiel en desktop hetzelfde gedrag
- verdwijnt de lange backend-link volledig uit beeld
- blijft de preview gekoppeld aan het event

### Waarom de huidige og-proxy aanpak alleen niet genoeg is
De og-proxy URL is technisch bruikbaar, maar functioneel ongeschikt als zichtbare deel-link in een WhatsApp-bericht. Zelfs als de preview klopt, blijft die URL vaak zichtbaar. Daarom is de echte eindoplossing:

```text
WhatsApp deelt alleen:
https://txeventshare.nl/e/[slug]
```

en niet meer:
```text
https://.../functions/v1/og-proxy?slug=...
```

### Wat daarvoor aangepast moet worden

#### 1. `src/pages/PublicEventPage.tsx`
De WhatsApp share-tekst moet worden teruggebracht naar een compacte versie zonder extra URL’s:
- geen CTA-link als losse URL
- geen og-proxy link in de tekst
- alleen korte uitnodigende tekst + publieke eventlink

Nieuwe logica:
```text
Hey, ik zag dit event en het lijkt me echt leuk. Ga je mee?

Meer info: https://txeventshare.nl/e/[slug]
```

Of nog strakker:
```text
Ga je mee naar dit event?

https://txeventshare.nl/e/[slug]
```

Daarmee krijgt WhatsApp maar één link.

#### 2. `supabase/functions/widget-embed/index.ts`
De widget moet exact dezelfde WhatsApp share-string gebruiken als de publieke eventpagina:
- geen CTA-link meer in visitor share text
- geen og-proxy URL meer in visitor share text
- alleen publieke eventlink op `txeventshare.nl`

Dat maakt mobiel en desktop gelijk.

#### 3. Open Graph voor `/e/:slug` moet crawler-proof worden
Nu is `PublicEventPage.tsx` een SPA en zet meta-tags client-side. Social crawlers lezen dat niet betrouwbaar. Daarom zijn er 2 echte opties:

**Voorkeursoptie**
- de og-proxy behouden, maar gebruiken als interne crawler-oplossing achter het publieke eventpad
- public event links moeten voor crawlers OG HTML krijgen en voor gebruikers gewoon de eventpagina tonen

Praktisch betekent dit:
- of de public route `/e/:slug` moet via hosting rewrite/server logic OG HTML serveren
- of de og-proxy moet reageren op het publieke pad/domein in plaats van als losse function-URL

Zolang de preview alleen beschikbaar is via een aparte backend-URL, blijf je afhankelijk van een zichtbare technische link in WhatsApp.

### Conclusie: wat 100% nodig is
Er zijn dus eigenlijk 2 lagen nodig:

#### Laag A — direct oplossen van inconsistentie en zichtbare backend-link
In share-teksten van widget + publieke pagina:
- verwijder CTA-link uit WhatsApp bericht
- verwijder og-proxy URL uit WhatsApp bericht
- gebruik alleen publieke eventlink

Dat lost op:
- verschil tussen mobiel en desktop
- zichtbare lange backend-link
- dubbele/rommelige berichtopbouw

#### Laag B — preview op publieke eventlink zelf betrouwbaar maken
De publieke event URL moet zelf de juiste social meta opleveren voor crawlers. Anders krijg je wel een nette link, maar mogelijk geen correcte preview-afbeelding/omschrijving.

Dus de definitieve oplossing is:
- WhatsApp deelt alleen `https://txeventshare.nl/e/[slug]`
- die URL levert voor WhatsApp/Facebook server-side OG metadata met:
  - event image
  - event title
  - korte omschrijving
  - datum/tijd verwerkt in description

---

## Concreet implementatieplan

### Stap 1 — share-tekst uniform maken
Aanpassen in:
- `src/pages/PublicEventPage.tsx`
- `supabase/functions/widget-embed/index.ts`

Wijzigingen:
- verwijder CTA-link uit visitor WhatsApp text
- verwijder og-proxy link uit visitor WhatsApp text
- gebruik één publieke eventlink
- exact dezelfde tekst op mobiel en desktop

### Stap 2 — OG bron verplaatsen van technische function-link naar publieke eventlink
De OG-preview mag niet langer afhankelijk zijn van een zichtbare `functions/v1/og-proxy?...` URL in de tekst.

Benodigde aanpassing:
- publieke event URL moet crawler-vriendelijke OG output krijgen
- og-proxy logica hergebruiken achter het publieke eventpad of via rewrite/route-oplossing

### Stap 3 — OG inhoud optimaliseren
De preview-header moet bevatten:
- eventafbeelding bovenaan
- eventtitel
- korte omschrijving
- datum + tijd in description

In praktijk:
- `og:title = event title`
- `og:description = datum/tijd + korte omschrijving`
- `og:image = featured image of fallback`
- geen technische URL zichtbaar in berichttekst

### Stap 4 — oude ongewenste regels definitief verwijderen
Controleren dat nergens meer wordt meegestuurd:
- CTA-link als losse WhatsApp link
- agenda-links
- og-proxy backend-link
- dubbele eventtitel/datum in de berichtbody

---

## Verwacht eindresultaat

Na deze wijzigingen ziet het WhatsApp resultaat er functioneel zo uit:

**Header preview**
- afbeelding bovenaan
- titel
- korte omschrijving + datum/tijd
- geen technische backend-link zichtbaar

**Berichttekst**
- alleen korte uitnodigende tekst
- één nette eventlink op `txeventshare.nl`

**Gedrag**
- mobiel en desktop leveren hetzelfde resultaat op
- WhatsApp kiest altijd dezelfde previewbron
- geen verschil meer tussen widget-share op telefoon en desktop

---

## Technische details

### Bestanden die aangepast moeten worden
- `src/pages/PublicEventPage.tsx`
- `supabase/functions/widget-embed/index.ts`
- mogelijk ook de public OG-routing/hosting-opzet, zodat `/e/:slug` zelf crawler-proof wordt
- `supabase/functions/og-proxy/index.ts` waarschijnlijk hergebruiken, maar niet langer als zichtbare share-URL

### Belangrijkste ontwerpbeslissing
De zichtbare backend-link verdwijnt niet betrouwbaar zolang die letterlijk in het WhatsApp-bericht staat. Daarom is “og-proxy link verplaatsen” geen echte eindoplossing. De echte oplossing is:
- die link helemaal niet meer delen
- maar de publieke eventlink zelf OG-geschikt maken

### Risico / aandachtspunt
Als we alleen stap 1 doen en niet stap 2, dan wordt de tekst schoner maar kan de preview mogelijk weer terugvallen op generieke app-meta. Daarom moeten beide onderdelen samen worden uitgevoerd voor het door jou gewenste 100% resultaat.
