# Phone Geeks — Vapi Front Desk Voice Agent Brief

Companion to `phone-geeks-revamp-brief.md` and `TODO.md` §4.1 (AI Phone
Answering Agent). This is the input for Vapi's "generate an assistant from
a prompt" composer — paste the **Starting Prompt** below into that flow to
scaffold the assistant, then layer in the tools/knowledge base described
after it. Everything here is pulled from data already built into the site
(`src/lib/services-data.ts`, `faq-data.ts`, `locations.ts`, `retail-data.ts`)
so the voice agent and the website never disagree.

Scope for this pass: FAQ + stock-aware answers + a **mock** repair
appointment booking flow. Nothing here talks to a real calendar or a real
inventory feed — same "honest demo" posture as the rest of the site
(`/track`, `/diagnose`, `/retail`).

---

## 1. The Starting Prompt (paste into Vapi's composer)

```
Create a voice AI front desk assistant named Casey for Phone Geeks, a
family-run phone, computer, tablet, and game console repair shop in the
St. Louis area with two locations: Arnold and Ballwin. They've been in
business since 2016, offer a 1-year warranty on parts and labor for every
repair (excluding liquid damage and user damage), and pride themselves on
fast, honest service — most repairs done same day, often within about an
hour.

Casey answers the phone for both shops. Casey's three jobs, in priority
order:
1. Answer common questions fast — hours, pricing, warranty terms, what
   devices they fix, how long repairs take, whether an item is in stock.
2. Check stock on refurbished phones and accessories before promising
   something is available, and be upfront when it's a demo/mock stock
   check rather than a live system.
3. Walk a caller through setting up a mock repair appointment: what
   device, what's wrong, which location, and a preferred day/time —
   collect it, confirm it back, and give a reference number. Always be
   clear this is a demo booking, not a confirmed real appointment yet,
   and that a person will call to confirm.

Tone: warm, casual, and efficient — like a real geek behind the counter,
not a corporate call center. Keep answers short and conversational, built
for being heard, not read. Never make up a price, warranty term, or stock
count that isn't provided to you. If a caller asks something outside
scope (legal, medical, anything unrelated to phone/computer repair) or
sounds upset/urgent, offer to transfer them to a real person at the shop
immediately rather than trying to handle it.
```

This is intentionally the *seed* prompt — Vapi's composer expands it into
a full system prompt, first message, and suggested voice/model config.
Review what it generates against the "Recommended Assistant Settings" and
"Guardrails" sections below and correct anything that drifts.

---

## 2. Recommended Assistant Settings

- **First message:** "Thanks for calling Phone Geeks! This is Casey — how
  can I help you today?" (Let Vapi's voice model generate this live rather
  than a hardcoded audio clip, so it can adapt — e.g. mentioning a
  location by name if caller ID/context suggests one.)
- **Model:** Whatever Vapi's current default GPT-4-class or Claude option
  is fine for this scope — the task is retrieval + light slot-filling, not
  complex reasoning. Keep temperature low (~0.3–0.4) so pricing/warranty
  answers stay consistent call to call.
- **Voice:** Pick a warm, natural-sounding voice, not overly formal or
  robotic-corporate — matches the "family shop" tone from the brief.
- **Transcriber:** Default real-time transcriber is fine; no special
  vocabulary needed beyond maybe boosting recognition of "iPhone,"
  "MacBook," "Galaxy," and the two location names (Arnold, Ballwin).
- **End-call behavior:** End the call cleanly after a booking confirmation
  or when the caller says goodbye — don't just go silent.

---

## 3. Guardrails (fold into the system prompt Vapi generates)

- **Never invent numbers.** Price ranges, warranty terms, and stock counts
  must come from the knowledge base / tool calls below — not guessed.
- **Never confirm a real appointment.** Every booking ends with "a real
  person will call you back to confirm" — this mirrors the honesty
  framing already used across the site's demo features.
- **Escalate, don't improvise, on:** anything about a specific repair
  already in progress (that's what `/track` and a real callback are for),
  billing disputes, anything that sounds like a complaint, or a request
  outside phone/computer/tablet/console repair entirely.
- **Never diagnose with false confidence.** Same posture as `/diagnose`:
  give a likely-issue + ballpark price, and say a tech confirms it in
  person before any work starts.

---

## 4. Custom Tools — built and live on this site

These are **real server tools now, not just schemas** — Next.js API
routes at `src/app/api/vapi/*` that read the exact same
`src/lib/*-data.ts` files as `/retail`, `/estimate`, and `/diagnose`, so
the phone agent can never answer differently than the website. All three
were verified against Vapi's actual request/response contract:
- Vapi POSTs `{ message: { type: "tool-calls", toolCallList: [...] } }`.
  **The shape of each entry isn't fully consistent in practice** — Vapi's
  docs show a flat `{ id, name, arguments }`, but a real test call
  (screenshot from the live Vapi dashboard) arrived nested instead, as
  `{ id, type: "function", function: { name, arguments } }`, with
  `arguments` sometimes an object and sometimes a JSON string. Coding only
  against the flat docs example threw `Cannot destructure property
  'item_name' of 'e.arguments' as it is undefined` on the real call.
  `src/lib/vapi.ts`'s `normalizeToolCall()` now handles every variant
  seen so far (flat or nested, object or string arguments, or missing
  entirely) before a route handler ever sees it — and logs a warning
  rather than throwing if a future payload shape still doesn't match.
- The server must respond `{ results: [{ toolCallId, result }] }`, in the
  same order, with `toolCallId` matching the request's `id` exactly.
- The endpoint **must return HTTP 200 even on a handled error** — any
  other status and Vapi silently ignores the response, so the shared
  `handleVapiTools()` helper (`src/lib/vapi.ts`) always returns 200.

Once deployed, the base URL is your Vercel deployment
(e.g. `https://phone-geeks-website.vercel.app`) — the three tool
endpoints are `/api/vapi/stock`, `/api/vapi/estimate`, and
`/api/vapi/book-appointment`.

Paste these directly into Vapi's tool-creation UI (or its `POST /tool`
API) — this is the actual tool *definition* shape Vapi expects, separate
from the runtime request/response format above:

### `check_stock`
```json
{
  "type": "function",
  "function": {
    "name": "check_stock",
    "description": "Look up stock count for a refurbished phone/tablet or accessory at a specific Phone Geeks location. Fuzzy-matches the item name against the real demo catalog.",
    "parameters": {
      "type": "object",
      "properties": {
        "item_name": { "type": "string", "description": "e.g. 'iPhone 13', 'USB-C charger', 'phone case'" },
        "location": { "type": "string", "enum": ["arnold", "ballwin", "both"] }
      },
      "required": ["item_name", "location"]
    }
  },
  "server": {
    "url": "https://YOUR-DEPLOYMENT.vercel.app/api/vapi/stock",
    "headers": { "x-vapi-tool-secret": "YOUR_SECRET" }
  }
}
```

### `get_repair_estimate`
```json
{
  "type": "function",
  "function": {
    "name": "get_repair_estimate",
    "description": "Return the likely repair, price range, and turnaround for a device + described issue. Matches natural-language symptoms, not just exact repair names.",
    "parameters": {
      "type": "object",
      "properties": {
        "device_category": { "type": "string", "enum": ["smartphone", "computer", "tablet", "console"] },
        "issue": { "type": "string", "description": "The caller's own description, e.g. 'the screen is cracked' or 'it's running slow with popups'" }
      },
      "required": ["device_category", "issue"]
    }
  },
  "server": {
    "url": "https://YOUR-DEPLOYMENT.vercel.app/api/vapi/estimate",
    "headers": { "x-vapi-tool-secret": "YOUR_SECRET" }
  }
}
```

### `book_mock_appointment`
```json
{
  "type": "function",
  "function": {
    "name": "book_mock_appointment",
    "description": "Record a mock repair appointment request. Does not touch a real calendar or persist anywhere durable — a human confirms it afterward. Returns a PG-##### reference number, same style as the site's /track demo tickets.",
    "parameters": {
      "type": "object",
      "properties": {
        "device": { "type": "string" },
        "issue": { "type": "string" },
        "location": { "type": "string", "enum": ["arnold", "ballwin"] },
        "caller_name": { "type": "string" },
        "callback_number": { "type": "string" },
        "preferred_time": { "type": "string", "description": "Caller's stated preferred day/time window, in their own words" }
      },
      "required": ["device", "issue", "location", "caller_name", "callback_number"]
    }
  },
  "server": {
    "url": "https://YOUR-DEPLOYMENT.vercel.app/api/vapi/book-appointment",
    "headers": { "x-vapi-tool-secret": "YOUR_SECRET" }
  }
}
```

**Behavior notes verified by hand (curl, simulating Vapi's real request
shape):** fuzzy item/symptom matching, multi-call batching in one
request, graceful "I couldn't find that, could you say it again" replies
on no match, a proper "and"-joined list when multiple booking fields are
missing, and HTTP 200 even on a malformed body. See each route's file for
the matching logic.

---

## 5. Knowledge Base

**`vapi-knowledge-base.md`** (repo root) is ready to upload as-is to
Vapi's knowledge base / file tool — business facts, locations/hours, what
we repair, and the FAQ, with no meta-commentary mixed in. It intentionally
does *not* include specific prices/turnarounds per repair — those come
from the `get_repair_estimate` tool so they can never drift out of sync
with the site's live pricing data.

---

## 6. Test Call Scenarios

Run these once the assistant is built, before treating it as done:
1. **Pure FAQ:** "What's your warranty cover?" — should answer from
   knowledge base, no tool call needed.
2. **Stock check, in stock:** "Do you have any iPhone 12s at Arnold?" —
   should call `check_stock`, answer with the real count and status.
3. **Stock check, needs cross-store note:** "Do you have USB-C chargers
   at Ballwin?" when Ballwin is well-stocked but Arnold isn't — should
   mirror the site's cross-store awareness, not just answer flatly.
4. **Pricing:** "How much to fix a cracked iPhone screen?" — should call
   `get_repair_estimate`, give the real range and turnaround, and note a
   tech confirms it in person.
5. **Full booking:** caller wants to book a repair — assistant should
   collect device, issue, location, name, callback number, preferred
   time, call `book_mock_appointment`, read back a reference number, and
   say a person will call to confirm.
6. **Escalation:** caller is upset about a past repair, or asks something
   entirely unrelated (e.g. "can you help me with my taxes") — assistant
   should offer a transfer/callback rather than attempting either.
7. **Honesty check:** ask "is this a real appointment?" or "is this stock
   count live?" directly — assistant should say plainly that it's a demo
   / not yet a live system, matching the rest of the site's framing.

---

## 7. Open Questions / Next Steps
- **The tool endpoints only work once deployed** — Vapi calls them over
  the public internet, so `localhost` won't work. Swap
  `YOUR-DEPLOYMENT.vercel.app` above for the real Vercel URL once
  deployed, and re-run the test call scenarios in §6 against it.
- **Auth is built, just needs turning on.** Set a `VAPI_TOOL_SECRET` env
  var on the Vercel project (any random string), and put the same value
  in each tool's `server.headers.x-vapi-tool-secret` in Vapi's dashboard
  (already shown in the JSON above) — the routes reject anything else
  with a 401. Leaving `VAPI_TOOL_SECRET` unset keeps the routes open,
  which is what they've been through the demo/testing phase so far.
  Verified both states (secret set + correct header → works, secret set
  + wrong/missing header → 401, secret unset → open) by hand.
- Real phone number + Vapi/Twilio number provisioning — not needed until
  this moves past demo stage.
- Whether `book_mock_appointment` should actually write into the site's
  existing mock ticket data (`src/lib/tracker-data.ts`) so a booked call
  shows up trackable at `/track` — nice full-circle demo moment, not yet
  built (it currently only `console.log`s the booking).
- Real inventory/calendar integration is the eventual endpoint (ties to
  §4.1 and §4.3 in `TODO.md`) — this brief only covers the mock/demo
  foundation.
