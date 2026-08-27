# Phone Geeks — Vapi Front Desk Voice Agent Brief

Companion to `phone-geeks-revamp-brief.md` and `TODO.md` §4.1 (AI Phone
Answering Agent). This is the input for Vapi's "generate an assistant from
a prompt" composer — paste the **Starting Prompt** below into that flow to
scaffold the assistant, then layer in the tools/knowledge base described
after it. Everything here is pulled from data already built into the site
(`src/lib/services-data.ts`, `faq-data.ts`, `locations.ts`, `retail-data.ts`)
so the voice agent and the website never disagree.

Scope for this pass: FAQ + stock-aware answers + a repair appointment
booking flow. As of 2026-08-27, stock (`check_stock`) and bookings
(`book_mock_appointment`) are both backed by real, shared Supabase data
when the deployment is configured for it — not the "everything's a mock"
posture this brief originally shipped with. Neither talks to the shop's
actual calendar or POS system yet, though: a booking is a real, saved,
trackable *request*, not a confirmed appointment against the shop's real
schedule, and stock still needs someone to keep the numbers current by
hand (`/management/stock`) rather than syncing from a real inventory
feed. The honesty framing below reflects that — real data, still
person-confirmed — not "assume it's fake."

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
   something is available. The check_stock tool tells you in its own
   response whether the count is real (from the shop's actual inventory)
   or a placeholder — trust that field and phrase your answer
   accordingly instead of assuming either way. If the caller doesn't
   have a specific model in mind ("do you have any iPhones," "any
   Samsung"), ask which model before calling the tool — it looks up one
   specific item, not a whole category, so a vague query won't return a
   real answer. Never say "demo" or "mock" about a stock count unless
   the tool's own response actually says so.
3. Walk a caller through setting up a repair appointment: what device,
   what's wrong, which location, and a preferred day/time — collect it,
   confirm it back, and give a reference number. This is a real request
   that gets saved and can be looked up later — it is not fake — but
   it's also not yet a confirmed slot on the shop's actual schedule, so
   always say a person will call to confirm it.

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
- **Don't call a stock count "live" or "demo" from assumption.** Relay
  what the `check_stock` tool's own response says — it's honest about
  which one it actually is on every call, since that depends on whether
  the deployment has real inventory data configured, not on anything
  Casey should guess at.
- **Never claim a booking is confirmed on the shop's actual schedule.**
  It's real and saved (the caller can be told a reference number that
  really works), but every booking still ends with "a real person will
  call you back to confirm" — the request is genuine, the timeslot
  isn't guaranteed yet.
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
    "description": "Look up stock count for a refurbished phone/tablet or accessory at a specific Phone Geeks location. Fuzzy-matches the item name against the shop's real, owner-editable inventory (falls back to a demo catalog only if that isn't configured on the deployment).",
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
    "description": "Record a repair appointment request. Saves it to the shop's real, shared booking store (trackable at /track by its reference number) — but does not touch a real calendar or the shop's own scheduling system, and a human still confirms it afterward. Returns a PG-##### reference number.",
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
7. **Honesty check:** ask "is this a real appointment?" — assistant
   should say it's a real, saved request, but a person still confirms it
   since it's not on the shop's actual schedule yet. Ask "is this stock
   count live?" — assistant should answer based on what `check_stock`'s
   response actually said on that call (real inventory vs. placeholder
   data), not a blanket "no."
8. **Vague stock query:** "do you have any iPhones in stock?" with no
   model given — assistant should ask which model before calling
   `check_stock`, not guess or call the tool with something like "any."

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
- **`book_mock_appointment` now writes to a real, shared store** —
  `src/lib/booking-store.ts` (Supabase/Postgres, via
  `@supabase/supabase-js`) — instead of just `console.log`ging, and a
  booking made over the phone really does show up trackable at `/track`
  via a new `/api/track/[id]` lookup route. Verified the full loop by
  hand: book → reference number → look it up on `/track` → renders
  through the exact same `RepairStepper` UI as the 3 static demo tickets,
  starting at "Dropped Off" (active, not checked — the caller hasn't
  brought the device in yet, just requested the appointment). Chose
  Supabase over a key-value store on purpose: same job for this simple
  "look up one record by reference number" need, but it's a real table
  you can open and read in Supabase's dashboard with no code, and its
  free tier needs no credit card.
  - **One manual step left**: no Supabase project is wired up yet.
    `src/lib/booking-store.ts`'s header comment has the exact SQL to
    create the `bookings` table — run it in the Supabase SQL editor, then
    set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel's
    project settings and redeploy. Until then, `booking-store.ts` falls
    back to an in-memory `Map` that resets on every cold start —
    bookings won't reliably persist in production. The tool's own
    response is honest about this: `trackable` in the result is `false`
    until Supabase is configured, and the spoken disclaimer only tells
    callers to check `/track` when it's actually true.
  - **Optional, also free**: Supabase's database webhooks can call a
    Make.com scenario the instant a row is inserted into `bookings` — a
    zero-code way to get a Slack ping or email the moment the phone agent
    books someone, without writing an integration for it.
- Real inventory sync (a POS feed instead of `/management/stock`'s
  hand-updated counts) and real calendar/scheduling integration are the
  eventual endpoint (ties to §4.1 and §4.3 in `TODO.md`) — everything
  this brief covers is real, shared data now, just not synced from the
  shop's actual point-of-sale or scheduling system yet.
