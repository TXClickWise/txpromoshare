

## Plan: Cap ClickWise eindtijd op 23:55 en rond af op 5 minuten

### Wat wordt er gedaan

Een helper-functie `clampGhlEndTime(startTime, endTime)` toevoegen aan `supabase/functions/clickwise-sync/index.ts` die:

1. **Dag-overschrijding voorkomt**: als de eindtijd op een latere datum valt dan de starttijd → cap op 23:55 van de startdatum
2. **Afrondt op 5 minuten**: minuten naar beneden afronden naar het dichtstbijzijnde veelvoud van 5 (bijv. 23:57 → 23:55, 21:13 → 21:10)

Deze functie wordt aangeroepen op **3 plekken**:
- Hoofdevent eindtijd (regel ~437, vóór `syncAppointment`)
- Occurrence eindtijd (regel ~500-503, vóór occurrence `syncAppointment`)

### Bestand

| Bestand | Wijziging |
|---|---|
| `supabase/functions/clickwise-sync/index.ts` | Nieuwe `clampGhlEndTime()` helper + aanroepen bij beide eindtijd-berekeningen |

### Logica (pseudo)

```text
function clampGhlEndTime(startISO, endISO):
  startDate = date-part(startISO)
  endDate   = date-part(endISO)
  
  if endDate > startDate:
    endISO = startDate + "T23:55:00"
  
  // rond minuten af naar veelvoud van 5
  minutes = getMinutes(endISO)
  endISO.setMinutes(floor(minutes / 5) * 5)
  
  return endISO
```

**Alleen voor ClickWise sync** — de TX EventShare app blijft de originele tijden tonen.

