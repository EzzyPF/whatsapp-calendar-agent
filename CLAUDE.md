# WhatsApp Calendar Agent

WhatsApp message → Claude parses event details → event created on the
correct family member's Google Calendar → confirmation reply on WhatsApp.

## Stack
Node.js + Express, JavaScript ESM only (no CommonJS). Twilio WhatsApp
Sandbox intake, replies via TwiML XML. Anthropic API
(claude-sonnet-4-6) for parsing. Google Calendar API via service
account (service-account.json, GCP project balmy-ocean-496921-m6).
Senders filtered by ALLOWED_SENDER env var.

## Status
- Done: scaffold (src/index.js, parseEvent.js, createEvent.js,
  verify.js), Anthropic key, GCP/service account setup, Twilio Sandbox
  join, end-to-end verified (WhatsApp → parse → calendar event →
  confirmation reply). Fixed during Step 5: GOOGLE_CALENDAR_ID was
  "primary" (now ezzy@productfaculty.com), timezone was Asia/Dubai (now
  America/Toronto), prompt now injects today's date.
- Tunnel: VS Code devtunnels (not ngrok)
- Next: Step 6 person routing → Step 7 deploy to Railway

## Design decisions (do not revisit without asking Ezzy)
- Step 6 routing: Claude prompt extracts a "person" field; a name →
  calendar ID map routes the event; prompt lists canonical family name
  spellings and normalizes variants to them; unknown/missing person →
  default calendar (Ezzy confirming which with Sikandar)
- Confirmation reply MUST name whose calendar the event landed on
- Timezone: America/Toronto everywhere; pass today's date into the
  Claude prompt so relative dates ("tomorrow") resolve correctly
- No end time in message → default 1 hour

## Out of scope for v1 (do not build)
Group chats, multi-person events, edit/delete via WhatsApp, production
WhatsApp number (sandbox is fine), Form2Cal, n8n, monday.com.
