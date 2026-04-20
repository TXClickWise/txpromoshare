# TX EventShare — Publieke Events Read API

Een publieke, read-only JSON API om gepubliceerde evenementen van een organisatie (tenant) op te halen voor weergave op een externe website.

> Naast deze API blijft de bestaande `widget-embed` JSON-functionaliteit gewoon werken (niet deprecated). Gebruik **deze** API wanneer je een nette feed wilt zonder een widget te hoeven aanmaken.

## Base URL

```
https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/public-events-api
```

Geen authenticatie vereist. CORS staat open voor alle origins. Responses zijn 5 minuten cachebaar (`Cache-Control: public, max-age=300`).

## Endpoints

### 1. Lijst van events

```
GET /v1/tenants/{tenant_slug}/events
```

**Query parameters**

| Param      | Type    | Default       | Beschrijving                                       |
|------------|---------|---------------|----------------------------------------------------|
| `from`     | `YYYY-MM-DD` | vandaag  | Filter: events vanaf deze datum                    |
| `to`       | `YYYY-MM-DD` | —        | Filter: events tot en met deze datum               |
| `category` | string  | —             | Filter op category-slug                            |
| `limit`    | int     | 20 (max 100)  | Max aantal events per response                     |
| `offset`   | int     | 0             | Pagination offset                                  |

**Response 200**

```json
{
  "tenant": {
    "slug": "demo-cafe",
    "name": "Demo Café",
    "logo_url": "https://...",
    "primary_color": "#E86C2C",
    "secondary_color": null
  },
  "events": [
    {
      "id": "uuid",
      "slug": "zomerfeest-2026",
      "title": "Zomerfeest 2026",
      "subtitle": "Live muziek en BBQ",
      "short_description": "...",
      "description": "...",
      "start_date": "2026-07-12",
      "start_time": "20:00:00",
      "end_date": null,
      "end_time": "23:30:00",
      "is_featured": false,
      "featured_until": null,
      "organizer_name": "Demo Café",
      "cta_link": "https://...",
      "cta_button_text": "Aanmelden",
      "tags": ["live-muziek", "zomer"],
      "category": { "slug": "live-muziek", "name": "Live muziek", "color": "#E86C2C" },
      "venue": { "name": "Demo Café", "address": "Hoofdstraat 1", "city": "Den Burg", "postal_code": "1791AA" },
      "featured_image_url": "https://.../storage/v1/object/public/media/...",
      "public_url": "https://txeventshare.nl/e/zomerfeest-2026"
    }
  ],
  "pagination": { "total": 42, "limit": 20, "offset": 0 }
}
```

### 2. Een enkel event

```
GET /v1/tenants/{tenant_slug}/events/{event_slug}
```

Bevat — naast alle velden uit de lijst — ook een `gallery` array met extra foto's bij het evenement (alleen aanwezig in de detail-response om de lijst lichtgewicht te houden).

**Response 200**

```json
{
  "tenant": { "...": "..." },
  "event": {
    "...": "...",
    "featured_image_url": "https://.../storage/v1/object/public/media/...",
    "gallery": [
      { "url": "https://.../storage/v1/object/public/media/foto-1.jpg", "alt": "Sfeerbeeld" },
      { "url": "https://.../storage/v1/object/public/media/foto-2.jpg", "alt": null }
    ]
  }
}
```

## Foutcodes

| Status | Betekenis                                                  |
|--------|------------------------------------------------------------|
| 400    | Ongeldige query parameters                                 |
| 403    | Publieke API is uitgeschakeld voor deze tenant             |
| 404    | Tenant of event niet gevonden                              |
| 405    | Verkeerde HTTP-methode (alleen `GET`)                      |
| 500    | Serverfout                                                 |

## Voorbeelden

### curl

```bash
curl "https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/public-events-api/v1/tenants/demo-cafe/events?limit=10"
```

### JavaScript (fetch)

```js
const res = await fetch(
  "https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/public-events-api/v1/tenants/demo-cafe/events?from=2026-04-01&limit=20"
);
const { events, pagination } = await res.json();
```

### React voorbeeld

```tsx
const [events, setEvents] = useState([]);
useEffect(() => {
  fetch("https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/public-events-api/v1/tenants/demo-cafe/events")
    .then((r) => r.json())
    .then((d) => setEvents(d.events));
}, []);
```

## API aan-/uitzetten

In de TX EventShare app → **Integraties → Publieke Events API** kun je per organisatie de API in/uitschakelen via een toggle. Standaard staat deze **aan**.

## Verschil met `widget-embed` (legacy)

| Feature                    | `public-events-api` (nieuw) | `widget-embed?format=json` (bestaand) |
|----------------------------|-----------------------------|----------------------------------------|
| Vereist widget aanmaken    | Nee                         | Ja                                     |
| Filtering (datum/categorie)| Ja                          | Nee                                    |
| Pagination                 | Ja                          | Nee (max 20)                           |
| Volledige venue-data       | Ja                          | Beperkt                                |
| Per-tenant aan/uit         | Ja                          | Nee                                    |
| Cache headers              | 5 min                       | n.v.t.                                 |

Beide endpoints blijven beschikbaar.

## Rate limiting

Geen harde limiet, maar respecteer de cache (`max-age=300`). Voor zware integraties: cache aan jouw kant op de `public_url` of `id`.
