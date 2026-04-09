

## Analyse

**Doel**: De `clickwise-sync` edge function aanpassen zodat bij event-synchronisatie de volledige event-data als gestructureerde Custom Fields naar het GHL Contacts API wordt gestuurd — bruikbaar voor WhatsApp-berichten en Social Planner in ClickWise.

**Aannames**:
- `CLICKWISE_API_URL` moet `https://services.leadconnectorhq.com` zijn (GHL v2)
- Custom Fields (`tx_event_*`) zijn al aangemaakt in het ClickWise sub-account, of worden door de gebruiker aangemaakt
- De edge function haalt zelf de volledige event-data op uit de database (in plaats van te vertrouwen op de beperkte data die de client meestuurt)

**Scope**: Alleen de edge function + de client-side trigger (meer data meesturen is niet nodig — de function fetcht zelf)

**Risico's**:
- Custom Fields moeten in GHL exact matchen op `key` — gebruiker moet deze aanmaken in ClickWise
- De `CLICKWISE_API_URL` secret moet correct zijn (`https://services.leadconnectorhq.com`)

---

## Stappenplan

### Stap 1: Update `clickwise-sync` edge function

Wijzig de event-sync logica (cases `event.published`, `event.updated`, `event.ended`):

1. **Fetch volledige event-data** uit de database met service role client — inclusief joins op `media` (voor image URL), `venues` (voor locatie), `categories` (voor categorie)
2. **Bouw een publieke event-URL** op basis van tenant slug + event slug
3. **Bouw een publieke image-URL** op basis van `media.original_url` of `storage_path`
4. **Map naar Custom Fields**:
   - `tx_event_title` → event title
   - `tx_event_date` → geformateerde datum + tijd
   - `tx_event_whatsapp` → `whatsapp_share_text` (of fallback: korte beschrijving + URL)
   - `tx_event_url` → publieke event URL
   - `tx_event_image` → publieke afbeelding URL
   - `tx_event_social` → `social_share_text` (of fallback)
   - `tx_event_type` → het event_type (`published`/`updated`/`ended`)
   - `tx_event_location` → venue naam + stad
   - `tx_event_category` → categorie naam
5. **Fix het GHL endpoint**: Gebruik `POST /contacts/` met `locationId` en `customFields` array
6. **Fix de API URL**: Gebruik `https://services.leadconnectorhq.com` als base (validatie in code)

### Stap 2: Deploy en test

- Deploy de edge function
- Test met `curl_edge_functions`

---

## Technische details

**Custom Fields mapping** in de GHL API call:

```typescript
customFields: [
  { key: "tx_event_type",     value: event_type },
  { key: "tx_event_title",    value: event.title },
  { key: "tx_event_date",     value: `${event.start_date} ${event.start_time || ""}`.trim() },
  { key: "tx_event_location", value: `${venue?.name || ""}, ${venue?.city || ""}` },
  { key: "tx_event_category", value: category?.name || "" },
  { key: "tx_event_url",      value: `https://txpromoshare.lovable.app/e/${event.slug}` },
  { key: "tx_event_image",    value: media?.original_url || "" },
  { key: "tx_event_whatsapp", value: event.whatsapp_share_text || shortFallback },
  { key: "tx_event_social",   value: event.social_share_text || shortFallback },
]
```

**Event data query** (server-side met service role):
```sql
SELECT e.*, m.original_url, m.storage_path, 
       v.name as venue_name, v.city as venue_city,
       c.name as category_name
FROM events e
LEFT JOIN media m ON m.id = e.featured_image_id
LEFT JOIN venues v ON v.id = e.venue_id  
LEFT JOIN categories c ON c.id = e.category_id
WHERE e.id = $event_id AND e.tenant_id = $tenant_id
```

**Geen migraties nodig.** Geen client-side wijzigingen nodig — de edge function fetcht zelf de data.

