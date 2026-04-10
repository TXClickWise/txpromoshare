

## Plan: Custom locatie opslaan bij evenementen

### Probleem
De `events` tabel heeft alleen een `venue_id` kolom. Als een gebruiker "Andere locatie invoeren..." kiest en een locatienaam + adres invoert, wordt die data niet opgeslagen — alleen `venue_id` (die leeg is bij custom input) wordt naar de database geschreven.

### Oplossing
Bij het opslaan van een event: als er een custom locatienaam is ingevuld maar geen `venueId`, automatisch een nieuwe venue aanmaken in de `venues` tabel en die koppelen aan het event.

### Stappen

1. **`src/components/event-wizard/useEventForm.ts`** — Wijzig `buildEventData` / `handleSave` / `handlePublish`:
   - Vóór het opslaan van het event: als `form.venue` gevuld is maar `form.venueId` leeg, maak een nieuw venue record aan via `supabase.from("venues").insert(...)` met de ingevoerde naam en adres
   - Gebruik het nieuwe venue-ID als `venue_id` in de event data
   - Parse het `address` veld: splits op komma voor `address` en `city` velden in de venues tabel

2. **Geen database-migratie nodig** — de `venues` tabel heeft al alle benodigde kolommen (name, address, city, tenant_id)

### Technisch detail

```text
In handleSave / handlePublish, vóór buildEventData:

  if (form.venue.trim() && !form.venueId && tenantId) {
    // Parse "Straat 1, Stad" → address="Straat 1", city="Stad"
    const parts = form.address.split(",").map(s => s.trim());
    const { data: newVenue } = await supabase.from("venues").insert({
      tenant_id: tenantId,
      name: form.venue.trim(),
      address: parts[0] || null,
      city: parts[1] || null,
    }).select("id").single();
    
    if (newVenue) {
      updateForm({ venueId: newVenue.id });
      form.venueId = newVenue.id;  // ensure buildEventData picks it up
    }
  }
```

Dit zorgt ervoor dat:
- Custom locaties automatisch worden opgeslagen als venue
- Het event correct wordt gekoppeld aan de nieuwe venue
- De locatie bij volgende bewerkingen gewoon in de dropdown verschijnt

