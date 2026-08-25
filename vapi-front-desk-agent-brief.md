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

## 4. Custom Tools/Functions to Wire Up

Vapi assistants call out to tools mid-conversation. These three cover the
scope for this pass — implement each as a simple serverless function (or
even a static mock responder) reading from the same shape of data as the
site's `src/lib/*-data.ts` files.

### `check_stock`
```json
{
  "name": "check_stock",
  "description": "Look up stock count for a refurbished phone/tablet or accessory at a specific Phone Geeks location.",
  "parameters": {
    "type": "object",
    "properties": {
      "item_name": { "type": "string", "description": "e.g. 'iPhone 13', 'USB-C Fast Charger'" },
      "location": { "type": "string", "enum": ["arnold", "ballwin", "both"] }
    },
    "required": ["item_name", "location"]
  }
}
```
Mock implementation: match against `src/lib/retail-data.ts`'s
`RETAIL_ITEMS` array; return the count(s) plus the same in-stock/low/out
status logic already in `getStockStatus()`. If no fuzzy match, say so
rather than guessing.

### `get_repair_estimate`
```json
{
  "name": "get_repair_estimate",
  "description": "Return the price range and turnaround for a specific repair type.",
  "parameters": {
    "type": "object",
    "properties": {
      "device_category": { "type": "string", "enum": ["smartphone", "computer", "tablet", "console"] },
      "issue": { "type": "string", "description": "e.g. 'cracked screen', 'battery replacement'" }
    },
    "required": ["device_category", "issue"]
  }
}
```
Mock implementation: same matching logic as the `/diagnose` page's
symptom→repair lookup against `src/lib/services-data.ts` — reuse that
mapping rather than re-authoring it, so the phone agent and the website
give identical answers to the identical question.

### `book_mock_appointment`
```json
{
  "name": "book_mock_appointment",
  "description": "Record a mock repair appointment request. Does not touch a real calendar — a human confirms it afterward.",
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
}
```
Mock implementation: generate a fake reference number (e.g. `PG-` + random
digits, same style as the `/track` demo tickets), log the request
somewhere visible (console/webhook is enough for a demo), and return it
to be read back to the caller. This is the voice equivalent of the
Estimate wizard's device → issue → location → contact flow — same four
pieces of information, just collected conversationally instead of via
form steps.

---

## 5. Knowledge Base Content to Attach

Give Vapi's knowledge base / RAG upload these facts verbatim rather than
relying on the model's own recall — same content already live on the
site, just repackaged for retrieval:

**Business**
Phone Geeks — phone, computer, tablet, and game console repair. Family-run
since 2016. 1-year warranty on parts and labor for every repair, excludes
liquid damage and user damage. No prepayment — pay only once the repair
is done. Pricing = part cost + labor, always quoted before work starts.

**Locations & Hours**
- Arnold: 636-333-3324, 141 Arnold Crossroads Center, Arnold, MO. Mon–Sat
  10am–7pm, Sun 12pm–5pm.
- Ballwin: 636-256-1702, 14748 Manchester Rd, Ballwin, MO. Mon–Sat
  10am–7pm, Sun 12pm–5pm.
- Affton exists but isn't set up for booking yet — refer callers to Arnold
  or Ballwin.

**What we repair** (full price/turnaround table lives in
`src/lib/services-data.ts` — pull it in verbatim rather than re-typing so
it can't drift out of sync with the site):
- Smartphones: screen, battery, charging port, camera, speaker/mic, water
  damage diagnostic.
- Computers (Mac & Windows): screen, battery, keyboard/trackpad, virus
  removal, data recovery, liquid damage cleaning.
- Tablets/iPads: screen, battery, charging port.
- Game consoles (including older systems — PSP, DS, Wii U, not just
  current-gen): HDMI port, disc drive, overheating/fan cleaning,
  controller repair.
- Also: gadget buyback/recycling, refurbished phone/accessory retail
  (60-day return window), and free in-person "Consult a Geek" diagnosis.

**FAQ** (full text in `src/lib/faq-data.ts`):
- Water damage repairs: 24–72 hours depending on damage.
- Warranty covers parts + labor for 1 year, not liquid/user damage.
- No prepay — pay after the repair is done.
- Price = part cost + labor.
- Yes to iPads/tablets, yes to Mac and Windows desktops/laptops (hardware
  + software), yes to game consoles including older ones.

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
- Real phone number + Vapi/Twilio number provisioning — not needed until
  this moves past demo stage.
- Whether `book_mock_appointment` should actually write into the site's
  existing mock ticket data (`src/lib/tracker-data.ts`) so a booked call
  shows up trackable at `/track` — nice full-circle demo moment, not yet
  built.
- Real inventory/calendar integration is the eventual endpoint (ties to
  §4.1 and §4.3 in `TODO.md`) — this brief only covers the mock/demo
  foundation.
