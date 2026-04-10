

## Plan: Instagram, TikTok en Google iconen toevoegen aan PublicEventPage en Widget

### Probleem
De `ChannelBar` component (gebruikt op de DistributionPage) bevat al Instagram, TikTok en GBP. Maar de **PublicEventPage** en de **widget-embed** edge function gebruiken hun eigen handmatige share-knoppen waar deze drie kanalen ontbreken.

### Wijzigingen

#### 1. `src/pages/PublicEventPage.tsx` (regels 405-425)
- **Instagram knop toevoegen**: Native share via `navigator.share()` met afbeelding + tekst (fallback: tekst kopiëren)
- **TikTok knop toevoegen**: Zelfde native share logica
- **Google GBP knop toevoegen**: Zelfde native share logica
- Grid aanpassen van `grid-cols-2` naar `grid-cols-3` of `grid-cols-4` zodat alle 7 knoppen passen
- Imports toevoegen: `Instagram`, `Music`, `MapPin` van lucide-react

#### 2. `supabase/functions/widget-embed/index.ts` (regels 195-199)
- Drie nieuwe cirkel-iconen toevoegen in de `shareHtml`:
  - **Instagram** (roze/paars, IG-icoon via Unicode camera of SVG inline)
  - **TikTok** (donker, muzieknoot-icoon)
  - **Google** (blauw, pin-icoon)
- Alle drie openen een `javascript:` handler die tekst naar clipboard kopieert met instructie, aangezien native share niet beschikbaar is in een embedded iframe

