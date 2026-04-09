

## Plan: Fix "Slot not available" voor Retro Brothers event

### Diagnose

De `calendarId` is nu correct (`TiRSCHmHCYXM16aZbq7g`). Het probleem is een **andere GHL-fout**: `"The slot you have selected is no longer available."` Dit treedt op omdat GHL Event Calendars werken met **beschikbare slots** — je kunt alleen appointments boeken op tijden die de kalender als beschikbaar markeert.

Het Retro Brothers event (29 mei 2026, 21:00-02:00) valt waarschijnlijk buiten de beschikbare uren van de kalender.

### Twee-sporige oplossing

**Spoor 1: ClickWise/GHL kalender-instellingen (handmatig)**
- De "Evenementen Kalender" in GHL moet zo worden ingesteld dat **avond-/nachtslots** beschikbaar zijn (bijv. 00:00-23:59 of 24/7)
- Controleer: Calendar Settings → Availability → zorg dat de uren alle dagdelen dekken, inclusief avond en nacht
- Dit verklaart ook waarom events overdag (12:00-13:00) wél syncen maar avondevents falen

**Spoor 2: Code-aanpassing — gebruik `ignoreFreeSlotValidation` flag**
- GHL ondersteunt een `ignoreFreeSlotValidation: true` parameter bij het aanmaken van appointments, waarmee slot-beschikbaarheid wordt overgeslagen
- Dit is precies wat nodig is: TX EventShare pusht events naar de kalender ongeacht de slot-configuratie

### Bestanden

| Bestand | Wijziging |
|---|---|
| `supabase/functions/clickwise-sync/index.ts` | Voeg `ignoreFreeSlotValidation: true` toe aan het appointment request body in de `syncAppointment` functie |

Dit is een kleine wijziging (1 regel) in de `appointmentBody` object rond lijn 121-135.

