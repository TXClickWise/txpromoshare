

## Analyse

**Doel**: De `CLICKWISE_API_KEY` secret bijwerken naar de sub-account API key in plaats van de agency-level key, zodat de sync correct werkt op sub-account niveau met de juiste scopes.

**Aanname**: De huidige edge function gebruikt `Bearer ${CLICKWISE_API_KEY}` in de Authorization header — dit blijft werken met een sub-account key, maar de API calls worden dan uitgevoerd binnen de context van dat specifieke sub-account.

**Impact op code**: De `clickwise-sync` edge function stuurt nu een `locationId` (subaccount_id) mee in de API calls. Met een sub-account key is dit correct — de key hoort bij dat sub-account. Geen code-wijzigingen nodig.

---

## Stappenplan

### Stap 1: Update CLICKWISE_API_KEY secret
Vervang de huidige agency-level key door de sub-account key: `pit-dcc8b68f-9a87-4005-ba14-57f3b9a61d00`

### Stap 2: Verificatie
Test de sync door een event te updaten en controleer of de GHL API correct reageert.

---

## Technische details

- Geen code-wijzigingen nodig — de edge function werkt identiek met een sub-account key
- De scopes uit de screenshot (contacts.write, customFields.write, socialplanner/post.write, etc.) dekken precies wat nodig is voor de event-sync en toekomstige social planner integratie

