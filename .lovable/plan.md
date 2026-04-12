

# Diagnose: Waarom de Retro Brothers preview geen afbeelding toont

## Bewijs uit het onderzoek

1. **Het event heeft WEL een featured image** — de database bevestigt `featured_image_id: 22f6497f-...` met een geldig `storage_path`.

2. **De og-proxy levert correcte HTML** met de juiste `og:image` tag, MAAR de Supabase Edge Runtime overschrijft de `Content-Type` naar `text/plain`. Dit is een platformbeperking die we niet kunnen omzeilen via code-aanpassingen in de functie zelf. WhatsApp negeert OG-tags in `text/plain` responses.

3. **De statische bestanden van de Vite plugin** worden WEL correct geserveerd wanneer ze bestaan (bewezen door jouw screenshot 3 met `/index.html`). Maar ze worden alleen gegenereerd bij een deploy/build. Als een event na de laatste deploy is gepubliceerd of gewijzigd, bestaat er geen statisch bestand voor dat event.

4. **Het Bierslenteren event** had wél een werkende preview omdat het statisch bestand bij de laatste deploy is gegenereerd. Het **Retro Brothers event** mist een actueel statisch bestand — waarschijnlijk is het na de laatste deploy gepubliceerd of is de featured image daarna toegevoegd.

## De drie openstaande punten

### A. Ontbrekende "Hey, ik zag dit event..." tekst
Dit is in de vorige ronde al gefixt in `ChannelBar.tsx` en `widget-embed`. Na deploy zou dit moeten werken.

### B. Geen afbeelding bij Retro Brothers
**Oorzaak:** Het statische OG-bestand (`/e/slug/index.html`) is niet actueel — het bevat de generieke site-metatags in plaats van event-specifieke OG-tags met de afbeelding. **Een nieuwe deploy/build lost dit op** omdat de Vite plugin dan alle gepubliceerde events opnieuw verwerkt.

### C. Zichtbare URL onderaan het bericht
WhatsApp toont altijd de URL in het berichtvenster als platte tekst. Dit is inherent aan hoe WhatsApp berichten weergeeft en kan niet verborgen worden. Wat we WEL kunnen doen is ervoor zorgen dat de URL schoon is (`txeventshare.nl/e/slug/index.html`) en er geen dubbele URLs verschijnen.

## Minimale fix

### Stap 1: Herbouwen en deployen
Een nieuwe deploy triggert de Vite plugin, die statische OG-bestanden genereert voor alle gepubliceerde events (inclusief Retro Brothers). Dit lost punt B direct op.

### Stap 2: Langetermijnoplossing — automatisch OG-bestanden regenereren
Om te voorkomen dat je na elke eventpublicatie handmatig moet deployen, kunnen we een Edge Function maken die bij het publiceren van een event automatisch een statisch HTML-bestand uploadt naar Supabase Storage. Maar dit is een grotere wijziging die apart kan worden opgepakt.

## Uit te voeren nu
1. **Niets wijzigen aan de code** — de huidige code is correct
2. **Een deploy triggeren** zodat de Vite plugin de statische bestanden regenereert
3. **Na deploy testen**: deel het Retro Brothers event via WhatsApp en controleer of de preview nu de afbeelding toont

## Verificatie na deploy
1. Open `https://txeventshare.nl/e/retro-night-de-ultieme-80s-90s-show-met-de-retro-brothers/index.html` — controleer dat de HTML OG-tags bevat met de juiste afbeelding-URL
2. Deel het event via WhatsApp — controleer dat de preview correct verschijnt
3. Controleer punt A: de tekst "Hey, ik zag dit event..." moet zichtbaar zijn

