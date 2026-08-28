# Vapi API Capabilities — Features & Analytics Reference

Companion to `vapi-front-desk-agent-brief.md` and `TODO.md` §4.1/§5 (AI
Phone Answering Agent hardening). That brief covers what's actually
*built* (three custom tools, a starting prompt). This doc is a wider comb
of Vapi's own docs for what else the platform can do — analytics, call
recording/analysis, SMS, transfers/squads, outbound calling — so future
`TODO.md` §5 tiers are scoped against real capabilities, not guesses.

Written 2026-08-28. Unlike the RepairDesk research in
`owners-current-flow.md`, **`docs.vapi.ai` was directly reachable from
this sandbox this session** (earlier sessions had it egress-blocked —
worth re-checking rather than assuming blocked next time). Everything
below was read from Vapi's own docs via their `.md` raw-content URLs
(append `.md` to any `docs.vapi.ai` page for a clean markdown fetch — very
useful for future digs), not from search snippets. Their
`https://docs.vapi.ai/llms.txt` is a full URL inventory of the doc site —
worth re-fetching first if this doc goes stale.

Treat this as "read directly from primary docs, 2026-08-28" — solid, but
verify against the live dashboard/API before building, since Vapi ships
fast and these are a snapshot.

---

## 1. Analytics API — real aggregate query engine, not just a dashboard

`POST https://api.vapi.ai/analytics`, authenticated with
`Authorization: Bearer <private_api_key>`. This is a proper query engine
over call data, not a fixed set of canned reports:

```json
{
  "queries": [
    {
      "table": "call",
      "name": "calls_by_day",
      "operations": [
        { "operation": "count", "column": "id" },
        { "operation": "sum", "column": "duration" },
        { "operation": "sum", "column": "cost" }
      ],
      "groupBy": "assistantId",
      "timeRange": {
        "step": "day",
        "start": "2026-08-01T00:00:00Z",
        "end": "2026-08-28T00:00:00Z",
        "timezone": "America/Chicago"
      }
    }
  ]
}
```

- **Tables**: `call`, `subscription`.
- **Operations**: `sum`, `avg`, `count`, `min`, `max`, `history`.
- **Columns seen**: `id`, `cost`, `duration`, `concurrency`, `minutesUsed`,
  `costBreakdown.*` (nested cost fields), plus whatever else the `call`
  table exposes.
- **groupBy** options include `type`, `assistantId`, `endedReason`,
  `analysis.successEvaluation`, `status` — i.e. you can already ask "how
  many calls per day ended for each reason" or "average cost by assistant"
  in one call, no client-side aggregation needed.
- **timeRange** defaults to the last 7 days in UTC if omitted; `step`
  buckets results (`second` through `year`).
- Response is an array (one entry per query in the request), each with the
  echoed `name`/`timeRange` and a `result` array of grouped rows.

**Relevance to `TODO.md` §7** (Deeper Metrics brainstorm): this is
real infrastructure for exactly the "funnel/conversion," "cost &
efficiency," and "behavioral/timing" metrics that section brainstorms —
`groupBy: endedReason` + `count` gets call-outcome breakdowns, `sum: cost`
+ `groupBy: assistantId`/day gets real cost tracking, all without scraping
the dashboard by hand. Worth building a thin `/management` "Vapi
analytics" panel against this endpoint directly instead of proxying
through the dashboard UI.

There's also a separate, less-documented **Insights** API
(`/insight` — create/list/get/update/delete/run/preview) that reads like
a saved-query or scheduled-report layer on top of the same analytics
engine — not fully explored this pass, worth a follow-up read if
recurring reports (e.g. a weekly owner digest, `TODO.md` §4.7) get built.

---

## 2. Post-call analysis — summary, structured extraction, success scoring

Configured via an assistant's `analysisPlan` (or the newer, preferred
`artifactPlan.structuredOutputIds` per Vapi's own docs — check which is
current before building). Three independent pieces, each optional:

- **`summaryPrompt`** → free-text call summary, written to
  `call.analysis.summary`. Has a sane default prompt if left unset.
- **`structuredDataPrompt` + `structuredDataSchema`** → the model extracts
  arbitrary structured data per a JSON Schema you define, written to
  `call.analysis.structuredData`. This is the mechanism to reliably get,
  e.g., `{ device, issue, location, wantsCallback: bool }` out of a call
  even when the caller didn't go through the `book_mock_appointment` tool
  cleanly — a real fallback for "the agent didn't book anything but the
  intent was there."
- **`successEvaluationPrompt` + `successEvaluationRubric`** → scores
  whether the call succeeded against a rubric. Rubric options:
  `NumericScale`, `DescriptiveScale`, `Checklist`, `Matrix`,
  `PercentageScale`, `LikertScale`, `AutomaticRubric`, `PassFail`. Result
  in `call.analysis.successEvaluation`.

All three feed the Analytics API's `groupBy: analysis.successEvaluation`
above — i.e. "what fraction of calls this week were rated successful" is
a real, queryable number once this is configured, not something that
needs building.

---

## 3. Server events / webhooks — the full event catalog

Configured via **Server URL** (account-wide default, or per-assistant
override — both exist; per-assistant wins). `src/lib/vapi.ts` already
handles `tool-calls`; the fuller catalog, for future hardening
(`TODO.md` §5 Tier 0's "structured logging/alerting" item):

| Event | Fires when | Relevance here |
|---|---|---|
| `status-update` | Call moves between `queued`/`ringing`/`in-progress`/`forwarding`/`ended` | Real-time "call in progress" state for a future live dashboard widget |
| `end-of-call-report` | Call ends | Full artifact bundle (recording, transcript, analysis, cost) in one payload — the natural hook for the Tier 0 "alert on tool errors" idea, or a Slack ping with the call summary |
| `tool-calls` | Assistant invokes a tool | Already handled |
| `assistant-request` | Inbound call has no assigned assistant | Must respond within 7.5s — relevant if this ever routes calls dynamically by caller ID/location instead of a fixed assistant per number |
| `transfer-destination-request` | Assistant transfers without a hardcoded destination | Only needed if transfer targets become dynamic (e.g. "whoever's on shift") |
| `hang` | Assistant goes silent too long | Direct hook for Tier 0's "explicit timeout/fallback behavior" item — this is the actual event to alert on, not something to poll for |
| `conversation-update` / `transcript` / `speech-update` | Live conversation state | Streaming/live-monitoring use cases, not needed for the current scope |
| `knowledge-base-request` | Assistant needs a custom KB lookup | Only relevant if `vapi-knowledge-base.md`'s static file upload gets replaced with a dynamic/queryable KB later |

Payload shape follows the same `{ message: { type, ... } }` envelope
`normalizeToolCall()` already defends against for `tool-calls` — worth
assuming similar shape-drift risk for any of these before hardcoding a
parser, per the hard lesson already documented in the front-desk brief.

---

## 4. SMS — two distinct, non-overlapping features (don't conflate them)

`TODO.md` §5 Tier 1 currently says "Vapi supports sending SMS natively
during or after a call (no separate Twilio integration needed)" — **that
needs a correction**: a Twilio account is required either way. What Vapi
provides is orchestration on top of it, and there are two separate
features with opposite constraints:

1. **The `sms` default tool** (assistant-initiated, outbound) — the
   assistant can call this during/after a voice call to text the caller,
   "using a configured Twilio account" (a `from` number is required). This
   is the one relevant to `TODO.md`'s "booking confirmation" and "text me
   when it's ready" use cases — **the assistant sends the first message**,
   which is exactly what's needed here.
2. **SMS Chat** (a separate feature — customer-initiated two-way texting
   sessions with an assistant) — requires a **10DLC-approved US Twilio
   number** with SMS enabled on both Twilio and Vapi, **US ↔ US only**,
   and critically: **"Assistants cannot send the first message to
   customers"** in this mode — it only replies to an inbound text that
   started the session. Not the right tool for proactive confirmations;
   it's a "customer texts the shop, assistant answers" feature (a
   text-based alternative front desk, not a notification channel).

Both need a Twilio number wired up either way (the `sms` tool needs a
Twilio account configured with a `from` number; SMS Chat needs Twilio's
Messaging webhook pointed at Vapi) — so "no separate Twilio integration
needed" was an overstatement worth fixing in `TODO.md`.

---

## 5. Call recording, logging, transcription — already-on artifacts

Controlled by `artifactPlan` (assistant-level or per-call), all **on by
default**: `recordingEnabled`, `loggingEnabled`, `pcapEnabled` (SIP packet
capture — telephony debugging, not needed here), and
`transcriptPlan.enabled`. Default storage is Vapi's own encrypted cloud;
can be redirected to a customer's own S3/GCS bucket via
`recordingPath`/`loggingPath`/`pcapS3PathPrefix` if long-term ownership of
raw recordings ever matters more than Vapi's default retention.

**Retention**: Pay-As-You-Go plans keep calls 14 days, chats 30 days —
Enterprise plans get configurable retention. Worth checking this
project's actual Vapi plan before assuming a call from three weeks ago is
still fetchable; this is the kind of fact that should get confirmed
against the real account rather than assumed, same lesson as RepairDesk's
plan-tier gap in `owners-current-flow.md`.

Fetched via `client.calls.get(id)` (or the REST equivalent), returning
`call.artifact.recording`, `.transcript`, `.logUrl`, `.pcapUrl`, and
`.messagesOpenAIFormatted` (conversation history pre-shaped for an
OpenAI-style messages array — handy if a transcript ever needs
re-processing through another LLM call, e.g. for the structured-data
fallback described in §2 above).

---

## 6. Transfers, Squads, and Workflows — orchestration options beyond one assistant

- **`transferCall` default tool**: blind ("cold") transfer by default —
  connects the caller without announcing them — or warm transfer with a
  spoken intro/summary before connecting. Destinations can be phone
  numbers, SIP URIs, or PBX extensions, each with its own description the
  model uses to pick the right one from caller intent. This is the
  mechanism behind the existing brief's "offer to transfer them to a real
  person" guardrail — worth actually wiring a real destination number
  once one exists, rather than leaving it as a spoken-only promise.
- **Squads**: multiple assistants that hand off to each other
  **preserving full conversation context** (unlike a bare `transferCall`,
  which hands off the phone line but not necessarily the LLM's prior
  context) — configured as a `members` array with per-member "handoff
  tools" naming valid destinations and when to use them. This is the
  right primitive if Casey (the single front-desk assistant) ever needs
  to become "intake assistant → specialist assistant" (e.g. a general
  triage bot handing off to a dedicated booking-flow assistant) without
  re-asking the caller everything from scratch.
- **Workflows are legacy** — Vapi's docs flag a migration guide with
  workflows being **retired August 18, 2026** (i.e. already past, relative
  to today's 2026-08-28) in favor of Squads. If anything in this repo or
  a future build references "Vapi workflows" as a concept, that's now
  stale terminology — Squads is the current answer.

---

## 7. Outbound calling — API-triggered, not just inbound answering

`POST /call` with `assistantId` + `phoneNumberId` + `customer.number`
places an outbound call; `customers` (plural, array) does the same for
multiple recipients in one request (batch calling), and `schedulePlan`
(`earliestAt`/`latestAt`) defers it to a future time. There's also a
no-code **Outbound Calling Campaigns** feature in the dashboard.

Relevance: this is the mechanism for anything like "the AI agent calls
customers back" (Tier 1's SMS/email follow-up idea, extended to voice) —
e.g. an automated callback when a backordered part in `TODO.md` §8.3
arrives, or a satisfaction check-in call after a repair closes. Not
currently used anywhere in this repo; flagging as available infrastructure
for a future tier, not a recommendation to build it yet.

---

## 8. Custom tool contract — confirms and extends what's already built

The documented contract matches what `src/lib/vapi.ts`'s
`normalizeToolCall()` already defends against (see
`vapi-front-desk-agent-brief.md` §4): `POST` to the tool's `server.url`
with `{ message: { type: "tool-calls", toolCallList: [...] } }`, expecting
back `{ results: [{ toolCallId, result }] }`. Docs show the *flat*
`{ id, name, arguments }` shape per call-list entry as canonical — the
brief already found nested variants in practice, so the existing
defensive normalization stays warranted, not over-engineering.

**Not documented** (confirmed absence, not just missed this pass):
specific timeout thresholds, retry policy on a non-200 response, or a
formal list of supported `server.headers`/secret-injection options beyond
the `x-vapi-tool-secret`-style custom header already in use. Worth
testing empirically (a deliberately slow tool response) rather than
assuming a specific timeout number from docs that don't state one.

---

## What this changes in `TODO.md` / the front-desk brief

- **Correct the SMS claim** in `TODO.md` §5 Tier 1 — a Twilio account is
  required for both SMS mechanisms; "no separate Twilio integration
  needed" is wrong. The `sms` default tool is still the right one for
  booking confirmations (assistant-initiated), not SMS Chat (customer-
  initiated only).
- **`TODO.md` §7's analytics brainstorm has a real, ready backing API** —
  the Analytics endpoint above already supports most of what §7 sketches
  as aspirational (funnel/conversion by outcome, cost tracking, behavioral
  patterns by time). Worth revisiting §7 as "build a thin panel against a
  real endpoint" rather than "brainstorm, prerequisites not yet true."
- **Structured data extraction (§2)** is a cheap, real fallback for
  capturing booking intent even when the `book_mock_appointment` tool
  call doesn't cleanly fire — worth adding to the Tier 0 hardening list.
- **Workflows are retired** — don't reference them as a future option;
  Squads is the current multi-assistant primitive.
