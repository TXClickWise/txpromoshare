
## Plan: Pricing-update + Stripe sync + BTW-vermelding

### Wijziging t.o.v. vorig plan
Alle prijzen op de pricing page worden duidelijk gemarkeerd als **excl. 21% btw**. Stripe-prijzen blijven netto bedragen (€24 / €69 / add-ons) — Stripe hanteert standaard exclusief btw, btw-berekening regelen we via Stripe Tax of handmatig op de factuur (los van deze opdracht).

### Concrete copy-aanpassingen pricing page
- **Plan cards**: onder elke prijs `excl. btw` als kleine muted tekst naast `/maand`.
- **Hero**: subtiele zin: "Alle prijzen zijn exclusief 21% btw."
- **Comparison table header**: dezelfde disclaimer onder de tabel-header.
- **Add-ons sectie**: per add-on prijs ook `excl. btw`.
- **FAQ**: nieuwe vraag toevoegen: *"Zijn de prijzen inclusief btw?"* → "Nee, alle prijzen op deze pagina zijn exclusief 21% btw. Op je factuur wordt de btw apart vermeld."

### Stripe sync (ongewijzigd t.o.v. vorig plan)
1. **Inventarisatie** bestaande products/prices (Basic + Pro)
2. **Nieuwe prices** aanmaken op bestaande products:
   - Basic: €24,00 / maand (2400 cent EUR)
   - Pro: €69,00 / maand (6900 cent EUR)
3. **Oude prices archiveren** (€29 / €79) — bestaande abonnees blijven via grandfathering op oude prijs
4. **4 nieuwe add-on producten + recurring prices**:
   - AI Plus — €15/mnd
   - Extra teamlid — €7/mnd (per seat)
   - White Label voor Basic — €12/mnd
   - Extra widget/website — €7/mnd

### Code wijzigingen
- `src/lib/i18n.ts` — `t.plans.{free,basic,pro}` updaten (prijs €24/€69, nieuwe pitch + features, "excl. btw" suffix)
- `src/lib/upgradeCopy.ts` (nieuw) — herbruikbare upgrade-teksten (free→basic, basic→pro, addon)
- `src/lib/stripePrices.ts` (nieuw) — centrale registry van alle nieuwe Stripe price IDs (Basic, Pro, 4 add-ons)
- `src/pages/PricingPage.tsx` — volledige herstructurering: hero, 3 cards (Basic highlighted), comparison table (desktop grid + mobile accordion), add-ons grid (4 + ticketing teaser), uitgebreide FAQ (incl. btw-vraag), final CTA. JSON-LD Product/Offer per plan toevoegen.
- `src/components/UpgradeBanner.tsx` — `variant` prop ("free-to-basic" | "basic-to-pro" | "addon"), backwards-compatible
- `src/pages/BillingPage.tsx` + `supabase/functions/create-checkout/index.ts` — nieuwe Basic/Pro price IDs gebruiken via `stripePrices.ts`

### DB-migratie
- `plans` tabel: `price_basic_cents = 2400`, `price_pro_cents = 6900` zodat `/admin/plans` consistent blijft

### Out of scope (bewust)
- Checkout-flow voor add-ons bouwen (alleen positionering op pricing page)
- Bestaande abonnees migreren naar nieuwe prijs (grandfathering — veiligst)
- Stripe Tax instellen voor automatische btw-berekening (apart traject)

### Risico's
- Stripe-prijzen wijken nu af van wat lopende klanten betalen → bewuste grandfathering, vermelden in chat na implementatie
- Prijzen op landingspagina (`LandingPage.tsx`) worden uit `t.plans` gelezen → automatisch consistent

### Stappenplan
1. Stripe inventarisatie (list products + prices)
2. Stripe wijzigingen (2 nieuwe prices + 4 add-on producten/prices + 2 archiveringen)
3. DB-migratie `plans` tabel
4. Code: `stripePrices.ts`, `upgradeCopy.ts`, i18n, PricingPage, UpgradeBanner, BillingPage, create-checkout
5. QA desktop (1336px) + mobile (375px) op `/pricing` en `/billing`
6. Bevestiging met overzicht van alle nieuwe price IDs + grandfathering-notitie
