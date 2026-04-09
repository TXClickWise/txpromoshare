

## Analyse

**Doel**: Elke tenant slaat zijn eigen ClickWise sub-account API key op in de database, in plaats van één globale secret te gebruiken.

**Aannames**:
- Het `credentials_encrypted` veld in `integration_connections` is al beschikbaar (jsonb, nullable)
- De globale `CLICKWISE_API_KEY` secret kan als fallback blijven bestaan (bijv. voor platform-eigen sync via `CLICKWISE_OWN_SUBACCOUNT_ID`)
- API keys worden opgeslagen als `{ "api_key": "pit-xxx..." }` in `credentials_encrypted`

**Scope**:
- Edge function: `clickwise-sync` — lees API key per connection
- Hook: `useClickWiseIntegration` — stuur API key mee bij connect
- UI: Integrations page — voeg API key invoerveld toe bij koppeling

**Risico's**:
- API keys staan als plaintext JSON in de database (acceptabel met RLS, maar niet ideaal voor productie — Vault-encryptie is een toekomstige verbetering)
- Bestaande Eigeweis-koppeling heeft geen `credentials_encrypted` ingevuld → fallback naar globale secret nodig

---

## Stappenplan

### Stap 1: Edge function aanpassen
In `clickwise-sync/index.ts`:
- Lees `credentials_encrypted.api_key` uit de connection record (die al ge-fetched wordt)
- Gebruik die als `Authorization: Bearer` header
- Fallback naar globale `CLICKWISE_API_KEY` als `credentials_encrypted` leeg is

### Stap 2: Hook aanpassen
In `useClickWiseIntegration.ts`:
- Pas de `connect()` functie aan zodat naast `subaccountId` ook een `apiKey` parameter wordt meegegeven
- Sla die op in `credentials_encrypted: { api_key: apiKey }`

### Stap 3: UI aanpassen
Op de Integrations page:
- Voeg een API key invoerveld toe naast het bestaande sub-account ID veld
- Toon instructie: "Ga naar Settings → API Keys in je ClickWise sub-account"

### Stap 4: Bestaande Eigeweis-koppeling bijwerken
- Update de bestaande `integration_connections` record voor Eigeweis met `credentials_encrypted: { "api_key": "pit-dcc8b68f-..." }`

---

## Technische details

**Edge function wijziging** (kern):
```typescript
// Haal API key per connection op
const connectionApiKey = (connection.credentials_encrypted as any)?.api_key;
const apiKey = connectionApiKey || CLICKWISE_API_KEY;

if (!apiKey) {
  // ... error: geen API key geconfigureerd
}
```

**Connect flow wijziging**:
```typescript
async function connect(subaccountId: string, apiKey: string) {
  // ...
  await supabase.from("integration_connections").insert([{
    // ...bestaande velden...
    credentials_encrypted: { api_key: apiKey },
  }]);
}
```

Geen database-migraties nodig — `credentials_encrypted` kolom bestaat al.

