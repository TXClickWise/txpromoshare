

## Plan: Fix WhatsApp preview to show correct event data

### Root Cause
The current share messages use `https://txeventshare.nl/e/[slug]` — this is a SPA URL that serves `index.html` with generic TX EventShare homepage OG tags. WhatsApp's crawler reads those generic tags, which is why the preview shows the TX EventShare logo and marketing text instead of the event image and title.

The og-proxy edge function already has the correct logic to serve event-specific OG tags, but we stopped using it as the share URL.

### Solution
Switch back to using the og-proxy URL as the shared link. The og-proxy already redirects real users to the SPA via meta-refresh + JavaScript, so the user experience is preserved. WhatsApp's crawler will read the correct event-specific OG tags from the proxy.

When WhatsApp encounters a single URL that generates a rich preview, it typically collapses the URL text and shows only the preview card. The visible link issue was caused by having multiple URLs — with a single og-proxy URL, this should resolve.

### Changes

#### 1. `supabase/functions/widget-embed/index.ts`
Change `eventPageUrl` from `https://txeventshare.nl/e/[slug]` to the og-proxy URL:
```
https://ofkyhcrnzdkwypwcyobl.supabase.co/functions/v1/og-proxy?slug=[slug]
```
This is the only URL in the message — WhatsApp will use it for the preview and collapse it.

#### 2. `src/pages/PublicEventPage.tsx`
Change `publicEventUrl` used in visitor WhatsApp text to the og-proxy URL, same as above.

#### 3. `supabase/functions/og-proxy/index.ts`
- Add `og:image:width` and `og:image:height` meta tags (WhatsApp needs these for reliable image display)
- Ensure `twitter:card` is `summary_large_image` (already done)

#### 4. Redeploy edge functions
Redeploy `widget-embed` and `og-proxy`.

### Expected Result
- WhatsApp preview header: event image + event title + date/description
- Message body: just the invitation text, URL collapsed into the preview card
- Identical behavior on mobile and desktop (single URL = single preview source)

