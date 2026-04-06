

## Plan: Publieke Evenementen Ontdekkingspagina + Boost Verdienmodel

### Overzicht

We bouwen drie dingen: (1) database-uitbreidingen voor discovery en boost, (2) een publieke ontdekkingspagina `/evenementen`, (3) een boost-betaalflow via Stripe, en (4) zichtbaarheidsinstellingen in de app.

---

### Stap 1 — Stripe producten aanmaken

Twee Stripe producten + prijzen (one-time payment):
- **Event Boost 7 dagen** — €6,95 (695 cent)
- **Event Boost 14 dagen** — €12,95 (1295 cent)

---

### Stap 2 — Database migratie

Toevoegen aan `tenants`:
- `show_on_discovery` boolean NOT NULL DEFAULT true

Toevoegen aan `events`:
- `show_on_discovery` boolean DEFAULT NULL (NULL = volg tenant)
- `is_featured` boolean NOT NULL DEFAULT false
- `featured_until` timestamptz DEFAULT NULL

Nieuwe tabel `boost_credits`:
- `id`, `tenant_id`, `remaining`, `granted_at`, `expires_at`

RLS: anon SELECT op events bestaat al. Venues krijgt anon SELECT voor published events. `boost_credits` tenant-member SELECT + platform admin ALL.

Database function `get_discoverable_events(...)` (SECURITY DEFINER) die published events joint met tenant discovery-vlaggen, venues en media, en featured events bovenaan sorteert.

---

### Stap 3 — Edge Function `create-boost-checkout`

- Ontvangt `{ eventId, boostDays: 7 | 14 }`
- Controleert of Pro-klant nog gratis boost-credits heeft → zo ja, activeer direct zonder betaling
- Anders: maakt Stripe Checkout session (mode: "payment") met juiste price ID
- `success_url` = `/app/events/{id}?boosted=true`
- Na betaling: webhook of success-page logica zet `is_featured = true` en `featured_until = now() + boostDays` (of tot event eindigt, wat eerder is)

---

### Stap 4 — Publieke ontdekkingspagina `/evenementen`

Nieuwe pagina `src/pages/DiscoverEventsPage.tsx`:
- Route binnen `PublicLayout`
- Roept `get_discoverable_events()` aan via RPC
- **Filters**: zoekbalk, categorie, stad, datum (vandaag / dit weekend / deze week / deze maand)
- **Sortering**: featured events eerst (met badge), dan vandaag, dan chronologisch
- **Event cards**: thumbnail (100px), titel, datum/tijd, locatie, categorie-badge, organisator
- SEO meta tags
- Link in PublicLayout navigatie

---

### Stap 5 — Zichtbaarheidsinstellingen

**SettingsPage.tsx** — nieuwe sectie "Zichtbaarheid":
- Toggle: "Toon evenementen op de publieke evenementenpagina"

**CreateEventPage.tsx** — nieuw veld:
- Driewaardige select: "Volg organisatie-instelling" / "Altijd tonen" / "Altijd verbergen"
- "Uitlichten" knop → opent boost-betaaldialoog met 7/14 dagen keuze

---

### Stap 6 — Pro-plan gratis boosts

- Bij start van elke maand: cron job of on-demand check geeft Pro-tenants 2 boost-credits
- CreateEventPage toont "Je hebt X gratis boosts over" als tenant Pro is
- Bij gebruik gratis boost: `is_featured` direct activeren, credit aftrekken

---

### Bestanden

| Actie | Bestand |
|-------|---------|
| Nieuw | `src/pages/DiscoverEventsPage.tsx` |
| Nieuw | `supabase/functions/create-boost-checkout/index.ts` |
| Edit | `src/App.tsx` — route `/evenementen` |
| Edit | `src/components/PublicLayout.tsx` — nav-link |
| Edit | `src/pages/CreateEventPage.tsx` — discovery toggle + boost knop |
| Edit | `src/pages/SettingsPage.tsx` — discovery toggle |
| Edit | `src/lib/plans.ts` — `freeBoostsPerMonth` in PlanLimits |
| Migration | Kolommen + tabel + RPC function + RLS |

### Technische details

- Discovery-filter logica: `WHERE status = 'published' AND (e.show_on_discovery IS TRUE OR (e.show_on_discovery IS NULL AND t.show_on_discovery IS TRUE))`
- Featured sortering: `ORDER BY (is_featured AND featured_until > now()) DESC, start_date ASC`
- Boost activatie na Stripe: via success URL parameter + edge function verificatie (geen webhook nodig)
- Anon RLS op venues: nodig voor stad-filter op ontdekkingspagina

