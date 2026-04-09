

## Plan: Fix "Calendar is inactive" voor events in de toekomst

### Probleem-analyse

Het is geen kalender-ID probleem. De fout is `"Calendar is inactive"` van GHL, en het treedt **alleen** op bij het Retro Brothers event (29 mei 2026). Andere events op korte termijn (april 2026) syncen prima met exact dezelfde kalender-ID en credentials.

De meest waarschijnlijke oorzaak: de GHL Event Calendar heeft een actieve datumrange die niet ver genoeg in de toekomst reikt. GHL ignoreert `ignoreDateRange: true` bij bepaalde kalendertypen of versies.

### Stappen

1. **Directe workaround in de Edge Function**
   - Wanneer GHL 400 retourneert met "Calendar is inactive", probeer de request opnieuw **zonder** `ignoreDateRange` (sommige GHL-versies interpreteren dit veld verkeerd)
   - Als dat ook faalt, log een duidelijke foutmelding: "De ClickWise kalender accepteert geen afspraken op deze datum. Controleer het datumbereik van je kalender in ClickWise."

2. **Verbeterde foutmelding naar de gebruiker**
   - In plaats van een generieke "Sync mislukt" toast, toon de specifieke reden: "Kalender inactief voor deze datum — pas het datumbereik aan in ClickWise"

3. **Handmatige actie nodig in ClickWise**
   - Je moet in de ClickWise/GHL sub-account de kalender-instellingen controleren en het datumbereik verruimen zodat mei 2026 en verder geaccepteerd worden
   - Dit is een instelling in het ClickWise/GHL dashboard, niet iets dat via de API aangepast kan worden

### Bestanden

| Bestand | Wijziging |
|---|---|
| `supabase/functions/clickwise-sync/index.ts` | Retry zonder `ignoreDateRange`, betere foutmelding |
| `src/hooks/useClickWiseIntegration.ts` | Specifiekere error toast bij "inactive" fout |

