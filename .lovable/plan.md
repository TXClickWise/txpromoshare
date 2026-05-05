## Fix PUBLIC_APP_URL in 3 edge functions

Replace hardcoded `https://txpromoshare.lovable.app` references with an env-driven URL falling back to `https://txeventshare.nl`.

### Changes

1. **`supabase/functions/clickwise-sync/index.ts`** (line 9)
   ```ts
   const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") || "https://txeventshare.nl";
   ```

2. **`supabase/functions/widget-embed/index.ts`** (line 213)
   ```ts
   const baseUrl = (Deno.env.get("PUBLIC_APP_URL") || "https://txeventshare.nl") + '/images/';
   ```

3. **`supabase/functions/auth-email-hook/index.ts`** (line 49)
   ```ts
   const SAMPLE_PROJECT_URL = Deno.env.get("PUBLIC_APP_URL") || "https://txeventshare.nl"
   ```

No other changes. After applying, redeploy the three edge functions.