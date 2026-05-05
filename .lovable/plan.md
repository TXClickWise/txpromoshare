## Probleem

In `src/components/MediaPicker.tsx` toont de bibliotheek een grote `CropHintGuide` "Crop preview" zodra je met de muis over een thumbnail beweegt (zie `hoveredItem` state, regels 51, 224-225, 384-396). Deze preview verschijnt onderaan binnen de scrollende tab, maar omdat hij groot is duwt hij de grid uit beeld en blijft hij hangen — daardoor lijkt het alsof er een enorme preview "over" de bibliotheek staat en kan de gebruiker geen afbeelding meer kiezen.

## Oplossing

Maak de crop preview compact en niet-blokkerend, en alleen zichtbaar wanneer er ook ruimte voor is.

Concrete wijzigingen in `src/components/MediaPicker.tsx`:

1. Verwijder de `onMouseEnter` / `onMouseLeave` handlers op de grid-knoppen (regels 224-225) en de bijbehorende `hoveredItem` state (regel 51).
2. Verwijder het volledige `hoveredItem &&` preview-blok onderaan de Library tab (regels 384-396).
3. Behoud de bestaande `CropHintGuide` import — die wordt nog gebruikt in de role-info badge en blijft beschikbaar voor toekomstig gebruik (geen verdere code-cleanup nodig als import niet ongebruikt wordt; anders verwijderen we de import).

Resultaat: hoveren over een afbeelding doet niets meer dan een subtiele border-highlight; klikken selecteert direct de afbeelding zoals voorheen. De bibliotheek-grid blijft volledig zichtbaar en bruikbaar.

## Bestanden

- `src/components/MediaPicker.tsx` — verwijder hover-preview logica.
