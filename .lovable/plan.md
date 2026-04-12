
# Bug analyse

## Fout
De huidige WhatsApp-shareflow gebruikt op de verkeerde plekken de verkeerde URL:

- publieke pagina deelt nu een backend-proxy URL
- widget deelt ook die backend-proxy URL én voegt daar extra tekst omheen
- de gewone publieke URL `/e/[slug]` geeft op WhatsApp nog de generieke site-preview

Daardoor zie je precies wat in je screenshots staat:
1. publieke pagina via WhatsApp: onhandige/openende backend-shareflow
2. widget via WhatsApp: `supabase.co` zichtbaar onder de preview én als losse link
3. handmatig `/index.html` toevoegen: juiste event-preview op schoon domein
4. gewone publieke link: generieke site-preview

## Vermoedelijke root cause
De echte werkende preview-URL is niet de huidige proxy-link, maar de statisch gegenereerde pagina:

`https://txeventshare.nl/e/[slug]/index.html`

Dat pad is al bewezen door jouw 3e screenshot:
- juiste event-preview
- schoon `txeventshare.nl` domein
- geen backend-domein zichtbaar onder de kaart

De code gebruikt nu op de verkeerde plekken nog:
- `https://...supabase.co/functions/v1/og-proxy?...`
- of de gewone `/e/[slug]` route

Dus het probleem zit niet in de widget-layout zelf, maar in de gekozen share-URL-strategie.

## Betrokken files / componenten
Alleen deze files hoeven aangepast te worden:

- `src/pages/PublicEventPage.tsx`
- `supabase/functions/widget-embed/index.ts`

Ter referentie, maar niet aanpassen in deze fix:
- `vite-plugin-og-pages.ts`
- `src/App.tsx`
- `supabase/functions/og-proxy/index.ts`
- `src/components/distribution/ChannelBar.tsx`
- `src/pages/DistributionPage.tsx`

## Buiten scope
Deze onderdelen blijven expliciet ongemoeid:

- shared components
- globale styling
- routing/config buiten de bestaande publieke event-routes
- og-proxy implementatie
- distributiecentrum-flow
- database / backend schema

## Minimale fix
Ik zou alleen dit doen:

### 1. Publieke eventpagina
In `src/pages/PublicEventPage.tsx`:
- `previewShareUrl` wijzigen van de backend-proxy naar:
  `https://txeventshare.nl/e/${slug}/index.html`

### 2. Widget-share
In `supabase/functions/widget-embed/index.ts`:
- de gedeelde preview-URL wijzigen van de backend-proxy naar:
  `https://txeventshare.nl/e/${slug}/index.html`
- WhatsApp in de widget alleen die ene schone URL laten delen
- dus geen backend-URL meer en geen proxy-domein meer in het bericht

Belangrijk: geen refactor, geen andere share-kanalen opnieuw ontwerpen, geen extra fallback-logica toevoegen.

## Waarom dit de beste werkwijze is
Dit is de kleinste fix met het sterkste bewijs:

- jouw 3e screenshot bewijst dat `/e/[slug]/index.html` al werkt
- we hoeven dus niet opnieuw te gokken met extra proxy-fixes
- we hoeven geen brede wijzigingen te doen
- we vervangen alleen de URL-bron op de 2 flows die aantoonbaar fout zijn

Kortom: niet opnieuw “meer techniek toevoegen”, maar simpelweg dezelfde bewezen werkende URL op de juiste plekken gebruiken.

## Verificatie
Na implementatie verifieer ik alleen deze punten:

1. **Publieke eventpagina → WhatsApp**
   - gedeelde URL moet `txeventshare.nl/e/.../index.html` zijn
   - geen `supabase.co` meer zichtbaar
   - preview moet event-specifiek zijn

2. **Widget → WhatsApp**
   - gedeelde URL moet `txeventshare.nl/e/.../index.html` zijn
   - geen `supabase.co` meer onder de preview
   - geen backend-link meer als losse zichtbare URL

3. **Geen regressie buiten scope**
   - geen wijzigingen aan layout, styling of andere routes
   - geen wijziging aan og-proxy nodig voor deze fix

## Uitvoering
Na jouw akkoord voer ik alleen deze gerichte aanpassing uit in exact 2 files:
- `src/pages/PublicEventPage.tsx`
- `supabase/functions/widget-embed/index.ts`

Geen rollback-advies nodig op dit moment: de codebase lijkt niet fundamenteel instabiel, maar de share-URL-keuze is op deze 2 entry points gewoon aantoonbaar verkeerd.
