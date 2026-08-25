# Phone Geeks Revamp — TODO / Roadmap

Living project plan. Brief lives at `phone-geeks-revamp-brief.md` — this file
tracks build status and the ideas we've floated on top of it.

---

## 1. Build Status

### Done
- [x] Scaffold Next.js 16 (App Router) + TypeScript + Tailwind v4
- [x] Brand tokens (navy/red/blue palette, Inter-based system font stack)
- [x] Layout shell: sticky nav w/ mobile menu, footer w/ real sitemap + locations
- [x] Home page: hero, repair-type strip, services grid, testimonial carousel, warranty section, CTA banner
- [x] Vercel deploy prep (build verified, engines pinned, no stray deps)

### Up next (core sitemap, from the original brief)
- [x] **Services page** — detailed breakdown per repair type, with mock pricing/turnaround per category and a jump-nav
- [x] **Estimate page** — 4-step wizard (device → issue → drop-off → contact) with a mock instant estimate result; folds in the quote calculator (§2.3) and email capture (§2.4) brainstorm items
- [x] **Contact page** — Arnold + Ballwin cards with embedded map, live open/closed badge, and directions link. Affton: no real address/phone exists for it in the brief, so rather than invent one it gets an honest note pointing to the two real shops. Hours are a placeholder (`src/lib/locations.ts`) pending the shop's real schedule. Note: Google Maps embeds don't load inside this sandbox's outbound proxy (`ERR_TUNNEL_CONNECTION_FAILED` on `maps.google.com`) — that's a sandbox network restriction, not a code issue; verify once on Vercel's real network.
- [x] **FAQ page** — Framer Motion accordion, grouped into Warranty & Payment / Repair Process / What We Repair, using the real Q&A from the brief (typos and grammar cleaned up per §5)
- [x] Polish pass — branded favicon + OG share image (generated via `next/og`, no image asset needed), `metadataBase` wired to the real Vercel URL, scroll-reveal animation pass (`Reveal` component) on the card grids across Home/Services/Contact/FAQ, and a full responsive + console-error sweep on all 5 pages at mobile width

### Stretch (lower priority for interview demo)
- [ ] Blog / device-tips content — only if time allows, hardcoded posts are fine

---

## 2. Branded / Unique Component Brainstorm

These are the "make it feel like a real product, not a template" pieces —
the stuff that actually shows off during the interview. Roughly ranked by
impact vs. effort.

### 2.1 Repair Status Tracker ("Track My Repair") — done
Shipped at `/track`, linked from the header nav and footer sitemap. Ticket
data lives in `src/lib/tracker-data.ts` — 3 demo tickets at different
pipeline stages (mid-repair, complete, just dropped off). Marked with a
"Demo feature" badge in the hero so it reads honestly as illustrative
rather than a real live system.
- Enter a ticket number (or just click a demo ticket) → see a stepper:
  **Dropped Off → Diagnosing → Repairing → Quality Check → Ready for Pickup**
- Each step gets a timestamp + a short geek-toned note ("Battery's out, new
  one's going in now") instead of sterile status text — matches the casual
  small-shop tone from the brief.
- Visual: horizontal stepper on desktop, vertical on mobile, active step
  pulses/glows in brand red.
- Optional nice-touch: SMS/email opt-in checkbox on the form (non-functional
  for demo, but shows the product thinking — "text me when it's ready").
- Build note: pure client-side state + a small mock dataset keyed by ticket
  number. No backend needed.

### 2.2 Free Diagnostic / "What's Wrong With My Device?" Quiz Flow — skeleton shipped
Shipped at `/diagnose`, linked from the footer sitemap and cross-linked
from the Estimate page ("Not sure what's even wrong? Try our free
diagnostic first"). Symptom-first flow (device → plain-language symptom →
likely diagnosis + price/turnaround), deliberately kept a step simpler
than the Estimate wizard — no contact capture here, it hands off to
`/estimate` for that instead of duplicating it.
- Symptom → repair mapping lives in `src/lib/diagnose-data.ts`, referencing
  repair names from `services-data.ts` rather than duplicating
  price/turnaround data.
- Explicitly framed in the UI (not just this doc) as a rule-based skeleton:
  a callout right under the hero states plainly that this fixed decision
  tree is the seed for training a real conversational AI agent on Phone
  Geeks' own repair history and how the technicians actually triage in
  person — ties directly to §4.1 (AI phone agent) and §4.2 (SMS/chat
  follow-up) below; this diagnostic flow is effectively the chat-based
  sibling of that phone agent idea.
- Still open: this *is* the "free value" hook — the result screen is the
  natural spot to eventually offer "email me this diagnosis," which would
  connect it to the email capture flow (§2.4).
- **Now connected to the Estimate flow.** Finishing the diagnostic quiz
  persists the result to `localStorage` (`src/lib/diagnostic-storage.ts`,
  key `pg_last_diagnosis`) — only a *finished* run is saved, never partial
  quiz progress. Landing on `/estimate` with a valid saved diagnosis shows
  a yes/no prompt ("Use your recent diagnostic?"); saying yes prefills the
  device + issue and skips straight to the drop-off step, saying no clears
  it and shows the normal picker.
  - Deliberately localStorage, not sessionStorage: persists across tab
    navigation and is shared across every tab of the same origin, not
    scoped to one tab.
  - Cross-tab live pickup, not just persistence: reading uses
    `useSyncExternalStore` subscribed to the browser's native `storage`
    event, so if a diagnostic finishes in *another* already-open tab while
    the Estimate page's first step is showing in this one, the prompt
    appears without a reload. Verified with real multi-tab browser
    automation, not just single-tab persistence.
  - The wizard re-derives the actual price/turnaround from
    `services-data.ts` at accept-time rather than trusting the stored
    snapshot, so a stale localStorage entry can never show outdated
    pricing.

### 2.3 Interactive Pricing/Quote Calculator (from original brief) — done
- Device category → issue → instant estimated price range + turnaround time.
- Shipped as the Estimate page wizard (`/estimate`), pulling straight from
  `src/lib/services-data.ts` so the pricing table is defined once and shared
  with the Services page.
- Still open: the diagnostic-quiz framing from §2.2 (symptom-first, "here's
  what's likely wrong") vs. the current device → issue picker — right now
  it's the more direct quote-calculator version, not the quiz.

### 2.4 Email Capture Flow ("Free Value" Funnel) — partially done
The Estimate wizard's contact step captures name/email/phone (React Hook
Form + Zod validation) and ends on a "$0.00 due today, we'll email your
estimate" result screen — this is the highest-intent entry point from the
list below, now live. Still open, the lower-intent entry points:
- Trigger points: end of the diagnostic quiz, quote calculator result,
  and a lightweight footer/inline signup ("Get $10 off your next repair").
- Value exchange should be concrete, not generic — options to pick from:
  - Emailed copy of their estimate/diagnosis (highest-intent, easiest sell)
  - A simple "Device Care Checklist" PDF/one-pager (battery health, screen
    protector reminders, backup tips) — cheap to fake for a demo, evergreen
    if real
  - First-repair discount code
- For the demo build: a styled form + client-side validation (React Hook
  Form + Zod) that "submits" into a mock success state — no real ESP
  integration needed unless we want to wire up something like Resend later.
- Should feel like one flow with 2–3 entry points, not three separate forms.

### 2.5 Location Picker w/ Map + Live Hours
- Card-based picker (Arnold / Ballwin) instead of a plain dropdown —
  photo/icon, address, phone, "open now / closes at X" computed from a
  simple hours table.
- Selecting a location should carry through into the Estimate flow (so the
  quote/booking already knows which shop).
- Map: embed, not a heavy JS map library — keep it light. Decide Google
  Maps embed vs. Mapbox (brief leans Mapbox for a more modern look).

### 2.6 Service Cards with Hover/Expand Detail
- Upgrade the current static grid (already on the home page) into
  cards that reveal repair-time + starting price on hover/tap, and link
  into the relevant Services page section.

### 2.7 FAQ Accordion
- Straightforward but should get real motion polish (Framer Motion height
  animation) since it's one of the few places on the FAQ page to show
  interaction craft — reuse the real Q&A content already in the brief.

### 2.8 Testimonial Carousel
- Already built on the home page (§1). Possible upgrade: pull in a "trust
  bar" (Google rating badge, review count) near the top of the page too,
  not just the carousel section.

---

## 3. Open Questions / Decisions Needed
- Diagnostic quiz (§2.2) vs. quote calculator (§2.3): build as one unified
  flow, or two distinct entry points that share pricing logic? (Leaning
  toward one flow — avoids duplicate UI for the same underlying data.)
- Email capture (§2.4): stub only, or worth wiring to a real provider
  (e.g. Resend) so it's a genuinely working demo?
- Affton: fully omit, or list as a third location marked "in-person only,
  no online booking"?
- Repair tracker (§2.1): keep purely as a marketing demo page, or frame it
  as "here's what this could become with a real backend" in the interview
  pitch itself?

---

## 4. Business Backend / AI Services Brainstorm (exploratory — outside site scope)

Real operational tooling for the shop, not portfolio-site features. None of
this needs to be built for the interview demo — it's here so the idea
doesn't get lost, and because it's exactly the kind of thing worth having
an opinion on when talking to a small-business owner about where a website
project could grow into. Grouped by what they'd actually replace or augment.

### 4.1 AI Phone Answering Agent — tools + KB built, not yet a live number
The highest-leverage one for a shop like this — a lot of repair-shop call
volume is the same five questions repeated all day.
- **`vapi-front-desk-agent-brief.md`** (repo root) has the starting prompt
  for Vapi's assistant-from-a-prompt composer, the real tool definitions
  (Vapi's actual dashboard JSON, not a sketch), knowledge base pointer,
  and test call scenarios.
- **The three tools are real, deployed API routes**, not just schemas:
  `src/app/api/vapi/{stock,estimate,book-appointment}/route.ts`. Each
  reads the exact same `src/lib/*-data.ts` files as `/retail`,
  `/estimate`, and `/diagnose`, so the phone agent can't answer
  differently than the website. Verified against Vapi's actual
  request/response contract (`message.toolCallList` in, `{results:
  [{toolCallId, result}]}` out, always HTTP 200) by curling the real
  request shape — fuzzy item/symptom matching, multi-call batching, and
  graceful no-match/missing-field replies all confirmed working.
- **`vapi-knowledge-base.md`** (repo root) is upload-ready as-is — no
  per-repair pricing in it on purpose, since that comes from the
  `get_repair_estimate` tool instead so it can't drift from the site.
- **Auth built** (`VAPI_TOOL_SECRET` env var + `x-vapi-tool-secret`
  header, real 401 on mismatch, no-op when unset) — off by default,
  flip it on when this stops being a demo. Verified all three states.
- Real live traffic already caught one payload-shape bug — fixed and
  PR'd (#7), see brief §4 for the specifics.
- Still open: these routes only work once deployed (Vapi needs a public
  URL, not localhost — swap the placeholder domain in the tool JSON for
  the real one); and `book_mock_appointment` only `console.log`s the
  booking rather than writing into `/track`'s ticket data — see brief §7.
- Handles "are you open," "how much to fix a cracked screen," "is my phone
  ready," warranty questions — pulled from the same FAQ/pricing data already
  in `services-data.ts` and `faq-data.ts` so the agent and the website never
  disagree with each other.
- Books/reschedules consults, takes a message with callback info for
  anything it can't resolve, and escalates immediately for anything that
  sounds urgent or upset.
- Realistic stack: Twilio (or Vapi/Bland/Retell, which bundle the telephony)
  + an LLM with function-calling into the shop's real pricing/schedule data.
  Not a build-from-scratch phone system.
- Failure mode to design around up front: never let it quote a firm price
  on anything outside the standard repair list, and always give an easy
  "let me get a person" path — a bad automated quote is worse than a missed
  call for a trust-first small business.

### 4.2 SMS/Email Status &amp; Follow-Up Agent
Direct extension of the repair status tracker brainstorm (§2.1) — this is
what makes it real instead of a demo.
- Auto-texts customers on real status changes (dropped off, ready for
  pickup) instead of staff manually notifying people.
- Post-repair follow-up: review request to happy customers, a friendly
  check-in if something needed a re-do.
- This is the one most worth prioritizing first if any of §4 gets built for
  real — it's low-risk (informational, not decision-making) and directly
  extends work already done on the site (repair tracker UI, warranty
  messaging).

### 4.3 Parts &amp; Retail Stock System — retail half previewed on-site
- Track screen/battery/part inventory per location (Arnold, Ballwin, and
  Affton once it's real), with low-stock alerts and reorder suggestions.
- The AI layer on top of that: not just alerts a human has to act on, but
  autonomous reordering — set a floor per SKU per location (e.g. "never
  below 10 USB-C chargers at either shop") and have it automatically place
  an order with a nearby vendor the moment a count dips under that line,
  rather than someone noticing the shelf is thin. Called out explicitly in
  the `/retail` demo's `InventoryNote` copy, not just here.
- Natural tie-in to the Estimate wizard: a quote could eventually reflect
  "in stock, ready today" vs. "special order, +2 days" per location instead
  of a flat turnaround estimate.
- Retail resale (refurbished phones/accessories) needs its own SKU/condition
  tracking, separate from repair parts inventory.
- This is the one with the most "real software project" scope — worth
  treating as its own future engagement, not a bolt-on.
- **The retail side now has a working preview at `/retail`**: refurbished
  phones + accessories with a real per-location stock status (In Stock /
  Low Stock / Out of Stock, thresholds in `src/lib/retail-data.ts`), a
  Both Shops / Arnold / Ballwin filter, and a cross-store "N more at
  {other location}" note when the selected shop is low or out — the
  actual point of a multi-location inventory view. Framed honestly as a
  static snapshot (`InventoryNote` component) rather than a live feed,
  same pattern as the diagnostic quiz's AI-agent framing. Linked from the
  Services page's Retail category (custom CTA override, see
  `ServiceCategory.ctaHref/ctaLabel/ctaBody`) and the footer sitemap.
  The repair-parts half of this item (screen/battery inventory feeding
  the Estimate wizard's turnaround estimate) is still just the idea
  above, not built.

### 4.4 Buyback/Trade-In Pricing Agent
- Phone Geeks already does gadget buyback — an AI-assisted tool that checks
  current resale comps (eBay/marketplace data) so trade-in offers are
  consistent across staff and both locations, instead of one employee's gut
  feel varying from another's.
- Lower priority than §4.1/4.2 — nice-to-have consistency tool, not a
  customer-facing pain point.

### 4.5 Review &amp; Reputation Management Agent
- Drafts responses to new Google reviews for owner approval (not
  auto-posting — a bad AI-written reply to a bad review is its own PR
  problem).
- Flags negative reviews for same-day attention.
- Pairs naturally with §4.2's post-repair follow-up (that's the review
  *request* side; this is the review *response* side).

### 4.6 Internal Knowledge Base / Tech-Facing Assistant
- A chatbot trained on the shop's own repair guides and common-fix notes,
  for faster ramp-up on new hires and quick lookups mid-repair.
- Genuinely different audience from everything else in this list (staff,
  not customers) — lowest priority, but worth naming since it's a very
  different kind of "AI agent" than the customer-facing ones above.

### 4.7 Owner-Facing Ops Digest
- A daily/weekly AI-generated summary across both (eventually three)
  locations: repairs completed, revenue, low-stock flags, any reviews that
  need attention — one digest instead of the owner checking four systems.
- This is the "so what" layer that makes §4.1–4.5 worth having in one place
  rather than four disconnected tools.

### Where this could show up in the interview pitch
Even though none of this is being built now, it's a legitimate answer to
"where would you take this next" — the honest pitch is: the website
(this repo) is the customer-facing layer, and §4 is the operational layer
underneath it that a small shop like this actually needs more than another
redesign. Worth having the ranked list (§4.1 → §4.2 → the rest) ready as a
talking point rather than a vague "AI could help with a lot of things."

---

## 5. Vapi Phone Agent — Hardening & Integration Roadmap

This is now a real deliverable, not a portfolio exhibit — the AI phone
caller is priority #1 for the Phone Geeks engagement. This section is the
path from "answers calls with mock data" to "actually running the front
desk," organized so the highest-ROI, lowest-effort items come first.

**Open assumption to validate with the owner before building further:**
the brief mentions phone/computer/tablet/console repair, buyback, and
refurb retail — it does not mention carrier/SIM/plan sales ("phone
service"). If Phone Geeks does sell that, several items below (activation
lookups, carrier APIs) apply directly; if not, drop them. Don't assume —
ask.

**Also worth asking early:** does the shop already run repair-specific
software — RepairShopr or RepairDesk are the two dominant platforms in
this space, both with a real REST API and Zapier support (confirmed via
research, not assumed). If they're on one of these already, that changes
everything below — real inventory, real ticketing, and real customer
records already exist and the right move is integrating with them
directly rather than building parallel mock systems further. If they're
running on paper/spreadsheets/nothing, the mock-data foundation already
built here is a legitimate starting point to grow into a real system.

### Tier 0 — Reliability hardening (do before this takes real call volume)
- [x] Payload-shape normalization (`src/lib/vapi.ts`) — a real call already
  caught one crash; fixed.
- [x] Shared-secret auth (`VAPI_TOOL_SECRET`) on all three tool routes.
- [ ] Rate limiting on the tool endpoints — nothing stops abuse once the
  URL is known, even with the secret (a leaked secret shouldn't mean
  unlimited requests).
- [ ] Structured logging/alerting on tool errors — right now failures only
  show up in Vercel's function logs; worth a lightweight alert (even just
  an email/Slack ping) so a broken tool during a real call gets noticed
  same-day, not discovered a week later.
- [ ] Spam/robocall handling — decide whether Vapi's number screens for
  known spam callers, or whether that needs a separate check, so the
  agent (and the owner's minutes) aren't burned on robocalls.
- [ ] Explicit timeout/fallback behavior if a tool call is slow or the
  site itself is down — the agent should degrade to "let me have someone
  call you back" rather than going silent.

### Tier 1 — Real business operations (the actual point of the agent)
- [x] **`book_mock_appointment` writes to a real, shared store** and a
  phone booking now shows up trackable at `/track`
  (`src/lib/booking-store.ts`, `/api/track/[id]`) — full loop verified by
  hand. Still needs the Upstash/Vercel KV marketplace integration added
  in the Vercel dashboard + redeploy before it's durable in production;
  until then it's an honest in-memory fallback (the tool's own response
  reports `trackable: false` and skips telling callers to check `/track`
  when it can't actually promise that).
- **Real appointment booking against the shop's actual system** — the
  above is a real *shared* record now, but it's still Phone Geeks' own
  minimal store, not the shop's real intake. Two paths depending on what
  they use:
  - If they use RepairShopr/RepairDesk/similar: call that platform's API
    directly to create a real ticket — the agent's booking *is* the
    shop's real intake, no parallel system needed.
  - If not: Google Calendar API (one calendar per location) is the
    lowest-effort real option — checks actual open slots instead of just
    collecting a stated preference.
- **Real SMS confirmations** — Vapi supports sending SMS natively during
  or after a call (no separate Twilio integration needed, confirmed via
  Vapi's own docs). Use it for the booking confirmation and the "text me
  when it's ready" opt-in already mocked on `/track`.
- **Real email** — swap Resend (or similar) in for the Estimate wizard's
  and phone agent's "we'll email you" messaging, which is currently just
  copy with nothing behind it.
- **Lead capture / attribution** — log every call (caller info, what they
  asked about, whether it became a booking) somewhere the owner can see,
  even just a Google Sheet via Zapier to start. This directly matters for
  the deal structure: proving the agent generated a lead or a sale is
  what the commission is based on, so this isn't optional polish — it's
  the receipt for the work.

### Tier 2 — Repair-shop-specific integrations
- **RepairShopr/RepairDesk API** (if applicable, see assumption above) —
  real inventory counts replacing `retail-data.ts`, real repair status
  replacing `tracker-data.ts`, real ticket creation replacing the mock
  booking. This one integration would make almost every demo page on the
  site real instead of mock, in one move.
- **IMEI / blacklist check** for buyback and trade-in — before offering
  cash for a device, verify it isn't reported lost/stolen or carrier-
  locked, via an IMEI lookup API. Protects the shop from a bad buy and
  gives the phone agent something concrete to check mid-call ("let me
  verify that IMEI before I confirm a price").
- **Live trade-in valuation** — right now buyback pricing would be static
  if built at all; a real resale-market pricing feed (or even a simple
  internal price sheet the owner updates) keeps buyback offers accurate
  as device values shift.

### Tier 3 — Differentiation / value-add
- **Outbound reminder & re-engagement calls** — Vapi supports scheduled
  outbound calls natively. Two concrete uses: "your repair is ready for
  pickup" reminders (cuts down on devices sitting unclaimed), and a
  follow-up call to someone who got a quote but never booked (this is
  the "score a sale" case directly — a quoted-but-not-booked lead is
  exactly what commission should be paid on if the agent closes it).
- **Live call transfer** — Vapi supports warm transfer with call context
  handed to the receiving person. Route to a real person immediately for
  anything the guardrails already flag (complaints, urgent issues,
  out-of-scope asks) instead of just apologizing and hanging up.
- **Hours-aware routing** — the site already computes real open/closed
  status per location (`src/lib/locations.ts`); the phone agent should
  use the same logic to decide "offer a live transfer" vs. "take a
  message" instead of guessing.
- **Google Business Profile integration** — pull real review count/rating
  into the agent's answers instead of the hardcoded "5.0★" on the
  homepage, and trigger a review request after a completed repair (ties
  to §4.5's review-response agent — this is the review-*request* half).
- **Spanish-language support** — Vapi supports multilingual assistants;
  worth considering given the St. Louis metro's demographics. Low effort
  if the KB/tools are already structured cleanly, which they are.

### Tier 4 — Owner-facing polish
- **Zapier bridge tool** — instead of hand-building every integration,
  give the agent one generic "trigger a Zap" tool. Lets the owner wire up
  new automations themselves later (post to Slack, add a spreadsheet row,
  whatever) without needing more code written for them — genuinely lowers
  the owner's dependence on ongoing dev work, which is a good-faith move
  given the commission structure.
- **Call analytics digest** — Vapi retains call transcripts/analytics
  natively; a weekly digest of what callers actually ask about is real
  market research the owner doesn't currently have (ties to §4.7's
  ops-digest idea, phone-specific).
