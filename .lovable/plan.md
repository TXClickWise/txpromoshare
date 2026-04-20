

## Delta-plan: pricing page verfijning

### Wat al klaar is
Volledige PricingPage redesign, Stripe sync (€24/€69 + 4 add-ons), btw-vermelding, upgradeCopy registry, JSON-LD. **Geen rework nodig** — alleen drie kleine puntjes aanscherpen.

### Wijziging 1 — Plan-pitches scherper conform prompt-positionering
De nieuwe prompt geeft expliciete positioneringszinnen per plan. Huidige `t.plans.*.description` benadert dit, maar kan letterlijker:

- **Free**: "Perfect om je eerste events professioneel online te zetten."
- **Basic**: "Alles wat je nodig hebt om events sneller te beheren, mooier te presenteren en slimmer te verspreiden."
- **Pro**: "De complete event operating system-laag voor organisaties die professioneel willen publiceren, distribueren en opschalen."

→ Aanpassen in `src/lib/i18n.ts` (t.plans.free/basic/pro.description). Werkt automatisch door op LandingPage + PricingPage.

### Wijziging 2 — Hero subheadline exact matchen
Prompt: *"Kies het plan dat past bij jouw events, team en ambities."*
Huidig: "Kies het plan dat past bij jouw events, team en ambities. Geen verborgen kosten, geen verrassingen."

→ De toevoeging "Geen verborgen kosten…" verzwakt de focus. Splitsen: korte subheadline + losse, kleinere reassurance-regel eronder. Aanpassen in `src/pages/PricingPage.tsx` hero-blok.

### Wijziging 3 — Secundaire CTA in hero toevoegen
Prompt vraagt expliciet **twee CTA's in de hero**: primair "Start gratis" + secundair "Bekijk hoe het werkt". Huidige hero heeft géén CTA's (alleen badge + headline + sub). Toevoegen onder de subheadline:
- Primair → `/register` ("Start gratis")
- Secundair → `/demo` ("Bekijk hoe het werkt")

Aanpassen in `src/pages/PricingPage.tsx`.

### Out of scope (bewust)
- Stripe-prijzen ongewijzigd (zijn correct)
- Add-ons sectie ongewijzigd (matcht prompt exact)
- Vergelijkingstabel ongewijzigd (matcht prompt exact)
- FAQ ongewijzigd (alle 7 verplichte vragen + bonus btw-vraag aanwezig)
- Final CTA ongewijzigd (matcht prompt exact)
- Upgrade copy ongewijzigd (matcht prompt exact)

### Bestanden
1. `src/lib/i18n.ts` — 3 description-strings
2. `src/pages/PricingPage.tsx` — hero-blok (subheadline split + 2 CTA-buttons)

### Risico's
Minimaal — alleen copy + 2 button-elementen in een bestaande, werkende pagina. Geen DB, geen Stripe, geen routing, geen breaking changes.

### QA na afloop
- `/pricing` desktop (1336px) + mobiel (375px): hero CTA's tonen, descriptions kloppen
- `/` (LandingPage): controleer dat plan-descriptions daar ook netjes renderen (gebruikt zelfde i18n-bron)

