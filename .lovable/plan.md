

User wants documentation, not code changes. This is a research/writing task — no plan needed, just deliver the summary directly. But I'm in plan mode, so I should present what I'll write. Actually re-reading: "Kun je samenvatten" = please summarize. This is a content generation request. In plan mode I cannot write files but I can write the summary directly in chat as my response.

Looking at memories I have everything needed:
- Architecture (edge function, GHL API v2, multi-tenant credentials in integration_connections)
- Calendar logic (Event Calendar, timezone, end-time defaults, 23:55 cap, 5-min rounding, retry without ignoreDateRange)
- Data mapping (event-{event_id}@txeventshare.local, custom fields tx_*)
- Lifecycle (published/updated/ended/deleted, depubliceren = ended)
- Sync strategy (PUT-first, fallback POST, conflict search, only main event on update)
- Workflow triggers (Appointment Status: New, Appointment Reminder)

I'll deliver this as the answer directly — it's a Q&A/research request, not implementation. No presentation-plan tag needed for pure documentation. But the instructions say plan mode is read-only and I present plans. For pure content writing (summary), I should just answer.

Actually the rule: "Skip for research ('how does X work?')". This IS a research/explain task. So no plan tag — just answer.
