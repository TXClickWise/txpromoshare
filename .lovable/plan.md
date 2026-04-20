
## Plan: Galerij voor evenementen (beheer + lightbox + API)

### 1. Database
- **Migratie**: RLS-policies op `event_gallery` toevoegen voor INSERT/UPDATE/DELETE door `editor+`. Nu bestaan alleen SELECT-policies, terwijl ik in de wizard gallery-rijen wil aanmaken/verwijderen.
  - INSERT/UPDATE/DELETE: WHERE event behoort tot tenant en gebruiker is owner/admin/editor.

### 2. Form state (`useEventForm.ts`)
- Nieuw veld `gallery: { mediaId: string; url: string }[]` in `EventFormState`.
- **Laden** (bij edit): `event_gallery` joinen met `media` op sort_order, zetten in form.
- **Opslaan**: nieuwe helper `saveGallery(eventId)` die alle bestaande rijen verwijdert en in volgorde herinvoegt — analoog aan `saveSponsors`. Aanroepen vanuit `handleSave` en `handlePublish` (waar `saveSponsors` ook wordt aangeroepen).

### 3. Wizard UI (`StepMedia.tsx`)
Nieuw blok "Galerij (extra foto's)" onder de Featured Image, boven Sponsors:
- Grid met thumbnails + verwijder-knop per foto.
- "Foto toevoegen" knop opent `MediaPicker` in een **multi-select** mode (of per foto één).
- Eenvoudige "verplaats omhoog/omlaag" pijltjes voor sort_order (geen drag-drop voor scope).
- Limit: max 12 foto's (UI-validatie).

**MediaPicker uitbreiding**: optionele `mode="multi"` prop. Bij multi: selecties verzamelen en met "Toevoegen" callback geven `(items: {id, url}[]) => void`. Eenvoudige toevoeging — bestaande single-select gedrag blijft default.

### 4. Lightbox op publieke pagina (`PublicEventPage.tsx`)
- Vervang de huidige `<a target="_blank">` door klikbare thumbnails die een **lightbox dialog** openen (shadcn `Dialog`).
- Lightbox features: grote weergave, links/rechts navigatie (knoppen + pijltjestoetsen), Esc om te sluiten, foto-counter (3/8), backdrop-click sluit.
- Behoud het huidige aspect-square grid; voeg subtle hover-zoom + "vergroot" icoon toe.

### 5. Public Events API
- Voeg `gallery: [{ url, alt }]` toe aan de event-detail response (en optioneel ook aan list response — beter alleen detail om payload klein te houden). Update `docs/public-events-api.md`.

### Niet in scope
- Drag-and-drop sorteren (pijltjes volstaan).
- Bulk upload direct vanuit de wizard (gaat via bestaande MediaPicker upload-tab).
- Captions per foto (kan later via `event_gallery.alt` of `media.alt_text`).
