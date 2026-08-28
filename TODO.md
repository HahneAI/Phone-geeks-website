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
- [x] Vercel Analytics + Speed Insights (`@vercel/analytics`,
  `@vercel/speed-insights`, mounted in the root layout) — free on the
  Hobby plan, zero config beyond being in the tree. Once deployed, traffic
  and Core Web Vitals show up automatically in the Vercel dashboard — no
  env vars, no setup step for the owner. Feeds directly into §6's
  management dashboard planning below.

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

### 2.1 Repair Status Tracker ("Track My Repair") — done, now backed by real data
Shipped at `/track`, linked from the header nav and footer sitemap. Still
marked with a "Demo feature" badge in the hero — honest, since the only
tickets that actually exist are phone-booked appointments (§5 Tier 1); a
walk-in repair still isn't logged anywhere, and every ticket currently
starts and stays at step 0 ("Dropped Off") since there's no staff-facing
way to advance it yet.
- The 3 hardcoded sample tickets (`DEMO_TICKETS` in `tracker-data.ts`) and
  the "try a demo ticket" quick-links were removed once real bookings
  went live in production — every lookup now hits the real
  `/api/track/[id]` endpoint (`src/lib/booking-store.ts` → Supabase).
- Enter a ticket number → see a stepper:
  **Dropped Off → Diagnosing → Repairing → Quality Check → Ready for Pickup**
- Each step gets a timestamp + a short geek-toned note ("Battery's out, new
  one's going in now") instead of sterile status text — matches the casual
  small-shop tone from the brief.
- Visual: horizontal stepper on desktop, vertical on mobile, active step
  pulses/glows in brand red.
- Still non-functional: the SMS/email opt-in checkbox on the ticket card
  ("text me when it's ready") — no real notification pipeline yet.
- To retire the "Demo feature" badge for real: give the shop's staff a way
  to advance a ticket past step 0 (manual admin action, or a real
  RepairShopr/RepairDesk integration per §5 Tier 1's second bullet).

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

**Resolved, 2026-08-27: the shop runs RepairDesk** as their POS/CRM for
ticket tracking — confirmed by the owner, not assumed. See
`owners-current-flow.md` at the repo root for the fuller spec: what's
known (and explicitly flagged as unconfirmed) about RepairDesk's API,
pricing tiers, and workflow/status support, plus the two open integration
paths. That answers the
"real inventory/ticketing already exists" question this section used to
flag as open. It comes with a real, non-technical wrinkle worth being
deliberate about rather than steamrolling with a technical answer:
- **The owners like RepairDesk specifically for its vendor
  integrations** — whatever supplier/parts-ordering connections it has
  set up are a real, working thing they'd lose if this site's tooling
  quietly became a second, parallel system of record.
- **The general manager — the one person here with real software
  judgment — doesn't like RepairDesk at all.**
- That's a real tension, not a technical one: integrating with
  RepairDesk's API (real inventory counts, real tickets, real customer
  records flowing into this site and the phone agent) keeps the owners'
  vendor integrations intact while potentially giving the GM a much
  better *interface* on top of the same underlying data — RepairDesk
  stays the system of record, this site becomes the good front end.
  The alternative — leaning further into the independent Supabase-based
  tickets/stock this repo already has (§5 Tier 1, §8) — is more fully
  ours to shape and might be what the GM actually wants, but risks
  becoming a second, disconnected source of truth the owners didn't ask
  for and the shop has to keep in sync by hand.
- **Not decided here** — this is a real business-relationship call, not
  a code one. Worth a direct conversation with the GM (and maybe the
  owners) about which problem matters more: keeping RepairDesk's vendor
  integrations as the single source of truth, or having full control
  over the tooling even if it means walking away from those
  integrations. Everything below stays written assuming either path is
  still open.

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
  (`src/lib/booking-store.ts`, `/api/track/[id]`). Backed by
  Supabase/Postgres, not a key-value store — chosen to match the stack
  the owner will actually inherit, and because it gives a real table
  viewable in Supabase's free dashboard with no code. If Supabase isn't
  configured it falls back to an honest in-memory store (the tool's own
  response reports `trackable: false` and skips telling callers to check
  `/track` when it can't actually promise that). Optional free add-on: a
  Supabase database webhook → Make.com scenario on insert, for a
  zero-code Slack/email ping the moment a booking lands.
  - **Production status: confirmed working end-to-end (2026-08-26).**
    `bookings` table + `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` set in
    Vercel. Verified with a real test call through the deployed Vapi
    agent's chat tester (booked "iPhone 16, cracked screen, Arnold,
    tomorrow at 4, Anthony, 573-222-8293" → got back `PG-56276`), then
    confirmed `GET /api/track/PG-56276` on production returns
    `"found": true` with the matching device/issue/location/timestamp.
    The full loop — Vapi tool call → Supabase insert → `/track` lookup —
    is real in production, not just locally.
- **Real appointment booking against the shop's actual system — still on
  Supabase for now, but the fork this was waiting on is resolved.** The
  shop runs **RepairDesk** (confirmed 2026-08-27 — see the note near the
  top of this section on the real owners-vs-GM tension around it).
  RepairDesk integration is the technically live option now, not a
  hypothetical; whether to actually build it is the open call described
  up top, not a data question anymore. Supabase remains the real, shared
  booking store until that's decided. Not blocking further Tier 1 work.
- **Real SMS confirmations** — Vapi has a built-in `sms` default tool the
  assistant can call during/after a call to text the caller. **Correction,
  2026-08-28**: this still requires a configured Twilio account/`from`
  number — "no separate Twilio integration needed" (this section's
  original claim) was wrong; see `vapi-api-capabilities.md` §4 for the
  full picture, including a second, unrelated "SMS Chat" feature that's
  customer-initiated only and *not* the right one for this use case. Use
  the `sms` tool for the booking confirmation and the "text me when it's
  ready" opt-in already mocked on `/track`.
- **Real email — deliberately on hold, 2026-08-27** (owner's call): not
  worth signing up for Resend or similar yet. The Estimate wizard's and
  phone agent's "we'll email you" messaging stays as copy with nothing
  behind it until this is revisited.
- [x] **Lead capture / attribution — built, 2026-08-27.** Every phone
  booking now carries the real Vapi call id it was made on
  (`vapiCallId` on `PhoneBooking`, `vapi_call_id` column in Supabase),
  captured from `message.call.id` on the tool-call webhook
  (`src/lib/vapi.ts`'s new `VapiToolContext`, threaded through
  `handleVapiTools` → `book-appointment/route.ts`). `/management`'s
  Caller data section (§6) now cross-references Vapi's own recent calls
  against real bookings (`listAttributedCallIds()` in
  `booking-store.ts`) and shows, per period, how many calls actually
  became a booking — a real conversion rate, not just two counts sitting
  next to each other. This is the actual "receipt" the deal structure
  needs: proof the agent generated a booking, not just that it took
  calls.
  - **Schema change needed on existing Supabase projects**: run
    `alter table bookings add column if not exists vapi_call_id text;`
    in the Supabase SQL editor (full statement in `booking-store.ts`'s
    header comment). Not urgent — `saveBooking()` detects a missing
    column and retries the insert without it, so bookings keep working
    either way; you just don't get attribution on whatever comes in
    before the migration runs.
  - **Unverified against real docs** (`docs.vapi.ai` still blocked from
    this sandbox): that `message.call.id` is really where the call id
    lives on the tool-calls webhook payload. Confirmed via search
    results only, not Vapi's actual reference docs — read defensively
    (`context.callId` is simply `undefined` if the field isn't there,
    never throws), so a wrong guess here degrades to "no attribution for
    that booking," not a broken booking. Worth confirming for real once
    a live booking's attribution can be checked against Vapi's own call
    log for the same call.

### Tier 2 — Repair-shop-specific integrations
- [x] **Retail/parts stock — out of demo, 2026-08-27.** `/retail` and
  the `check_stock` Vapi tool both now read from `src/lib/retail-store.ts`
  — real, owner-editable stock in Supabase (a new `retail_items` table;
  full `create table`/seed SQL in that file's header comment), same
  pattern as `booking-store.ts` and reusing the exact same
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` — **no new secret needed**.
  Falls back to the old static `retail-data.ts` catalog (with an honest
  "static snapshot" note, same as before) if Supabase isn't configured or
  the table hasn't been seeded yet, so nothing breaks pre-migration.
  `/retail` uses a 60s ISR revalidate rather than `force-dynamic` — stock
  counts don't need /management's page-per-request freshness. Updated
  the `check_stock` tool description in `vapi-front-desk-agent-brief.md`
  (no longer says "demo catalog") — **needs re-pasting into Vapi's
  dashboard**, this repo can't push that itself. Also fixed
  `book_mock_appointment`'s description there, which had gone stale
  claiming it "does not persist anywhere durable" — it has, since §5
  Tier 1 shipped.
  - **Found, 2026-08-27: the tool description fix alone wasn't enough.**
    After re-pasting the tool JSON, the live chat widget was still
    saying "I can do a demo stock check for you" and "this is a mock
    check — not a live inventory system" on every stock question,
    regardless of what `check_stock` actually returned. Root cause: the
    assistant's own **starting prompt/system prompt** in
    `vapi-front-desk-agent-brief.md` §1/§3 — a separate thing from the
    tool JSON, and the thing that actually drives how Casey talks —
    hard-coded "always call stock a demo/mock check" and "always call a
    booking a demo booking," independent of any real tool response.
    Fixed the prompt text to relay whichever the `check_stock`/
    `book_mock_appointment` tool responses actually say (both already
    carry an honest real-vs-placeholder note) instead of asserting one
    or the other. Also added explicit guidance for a vague stock
    question ("do you have any iPhones?") to ask which model before
    calling the tool, since `check_stock` matches one specific item, not
    a whole category — a bare "any" was observed producing a vague
    non-answer instead of a real lookup.
  - **`check_stock`'s no-match response is now a structured object, not
    a bare string** — `{ found: false, query, message }` instead of just
    a sentence, matching what Vapi's own tool-testing composer flagged
    after real-call testing of the "any" case above surfaced a
    data-less, vague reply instead of the intended "could you say the
    item again?" ask. The found-a-match response now also carries
    `found: true` for symmetry. Verified locally against all three
    cases (real match, no match, empty query) — real matches still work
    exactly as before, no-match now returns a shape an assistant can
    branch on reliably instead of inferring from a sentence.
  - **Actual root cause of the persistent "no result"/demo-language
    failures, found 2026-08-27: none of the three tools had a Server
    URL configured in Vapi's dashboard at all** — the Server Settings
    panel's URL field was blank on every tool, so calls had nowhere to
    go and failed before ever reaching this site's code (which is why
    it failed even testing directly from Vapi's dashboard, not just
    live calls, and why re-pasting tool JSON and fixing the prompt
    hadn't resolved it — both were real fixes for real issues, just not
    *this* one). Filling in the real deployed URL
    (`https://phone-geeks-website.vercel.app/api/vapi/{stock,estimate,
    book-appointment}`) per tool resolved it. **Confirmed working
    end-to-end, 2026-08-27** — all three tools working both from Vapi's
    own dashboard test console and live on the site's chat widget.
  - Still not synced from a real shop POS/inventory system — see the
    RepairDesk note just below. Someone still updates counts by hand,
    just in Supabase's table editor instead of a TS file requiring a
    code deploy. That's the real gap this closes: "demo, hand-edited in
    the repo" → "real, owner-editable, no deploy" — a real step forward
    either way this eventually shakes out.
  - Repair-parts inventory (screen/battery counts feeding the Estimate
    wizard's turnaround) is still just the §4.3 idea, not built — this
    only covers the retail/resale side.
- **The shop's real system is RepairDesk — confirmed 2026-08-27.** See
  the note near the top of this section (§5) for the full context: the
  owners value RepairDesk specifically for its vendor integrations, the
  GM doesn't like the software, and which way to go (integrate with
  RepairDesk's real API vs. keep building the independent Supabase
  system this repo already has) is a business call, not decided here.
  If integration is the direction chosen: RepairDesk has a real REST
  API (per earlier research, not re-verified against their current
  docs), and that one integration would make the retail stock above,
  `/track`'s tickets, and §8's warehouse-workflow brainstorm all read
  from the shop's actual system instead of Supabase in one move — worth
  keeping in mind before investing much further in the parallel system,
  once a direction is actually picked.
- **`get_repair_estimate` tuned and tested against realistic caller
  phrasing, 2026-08-27.** Wrote a real test harness simulating actual
  Vapi tool-call payloads (all three documented shapes — flat, nested
  object-args, nested string-args — plus multi-call batching) against
  both `/api/vapi/estimate` and `/api/vapi/stock` locally, covering
  realistic phrasing per device category and deliberate edge cases
  (empty/missing fields, gibberish, vague phrasing, wrong-casing
  categories). Found and fixed two real matching bugs in
  `matchSymptom()`:
  - **Stopword inflation**: the old `word.length > 2` filter let common
    function words like "the" count as real matching signal — some
    symptom labels contain "the" twice (e.g. Screen Repair's "the
    screen is cracked or the glass is broken"), so *any* caller
    sentence containing "the" picked up 1–2 free points toward Screen
    Repair specifically. Caught because "I dropped it in the toilet"
    was matching **Screen Repair** instead of Water Damage Diagnostic —
    a real, wrong, and slightly absurd answer a live caller could have
    gotten. Fixed with a real stopword list (`STOPWORDS` in
    `estimate/route.ts`).
  - **Single generic word overmatch**: "it's just broken" was
    confidently matching Screen Repair, because "broken" is real
    content-word length but only appears in one label
    ("...or the glass is broken") and doesn't actually identify what's
    wrong. Checked every symptom `label` in `diagnose-data.ts` (not
    `reasoning`, which isn't used for matching) before excluding it —
    `broken` is the only such case in the current dataset, so this is a
    short, evidence-based `TOO_GENERIC` list, not a guess at every
    vague word that might theoretically cause the same problem.
  - Also added tie-detection: two symptoms scoring equally on real
    content words now falls through to the honest "come in for a free
    look" fallback instead of silently picking whichever happens to be
    first in the array — ambiguous phrasing shouldn't resolve to a
    confident, possibly-wrong quote.
  - Full suite (30+ cases across all 4 categories, edge cases, payload
    shape variants, batching) passes after the fix. `check_stock` was
    tested the same way and needed no changes — no bugs surfaced there.
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
- **Make.com bridge tool** — instead of hand-building every integration,
  give the agent one generic "trigger a Make.com scenario" tool (a
  webhook call). Lets the owner wire up new automations themselves later
  (post to Slack, add a spreadsheet row, whatever) without needing more
  code written for them — genuinely lowers the owner's dependence on
  ongoing dev work, which is a good-faith move given the commission
  structure. Also the natural home for anything Supabase's own database
  webhooks can't cover directly.
- **Call analytics digest** — Vapi retains call transcripts/analytics
  natively; a weekly digest of what callers actually ask about is real
  market research the owner doesn't currently have (ties to §4.7's
  ops-digest idea, phone-specific).

### Tier 5 — Bringing the agent onto the website itself
- [x] **Header "Call Now" widget** (`src/components/layout/call-widget.tsx`,
  `src/lib/use-vapi-call.ts`) — lets a website visitor talk to the same
  Vapi assistant that answers the phone, right in the browser, via
  `@vapi-ai/web`. Shows connecting/active/error states, a mute toggle, a
  live-call indicator dot on the header button, and a call timer.
  - **Honest fallback, not a fake widget:** until
    `NEXT_PUBLIC_VAPI_PUBLIC_KEY` and `NEXT_PUBLIC_VAPI_ASSISTANT_ID` are
    set in Vercel, the header renders a plain `tel:` link to the Arnold
    shop's real number instead of a widget that implies an AI will pick
    up. Once both are set (Vapi dashboard → API Keys → Public Key; the
    assistant's ID from the Assistants page) and redeployed, the real
    widget takes over automatically — no code change needed.
  - Verified: builds and lints clean with and without the env vars set;
    manually tested in a real browser (Playwright) — desktop and mobile
    fallback states, the configured idle/connecting/error states, and a
    real bug where the popover was clipped by the mobile nav's
    `overflow-hidden` collapse wrapper (fixed by portaling the panel to
    `document.body` with `position: fixed`, positioned from the button's
    bounding rect).
  - **Confirmed working against the real Vapi assistant in production
    (2026-08-27, per the owner)** — real calls placed through this
    widget now show up in `/management`'s Caller data section (§6):
    `webCall` entries with real durations, ended reasons
    (`customer-ended-call`, `silence-timed-out`), and per-call cost.
    This is the first end-to-end confirmation that the header widget
    → Vapi assistant → billed call path genuinely works, not just that
    it builds.
  - "Prefer a person? Call ###" is always visible in every non-active
    panel state — the AI option never strands someone without a real
    human fallback.
- [x] **Floating chat + voice widget** (`src/components/layout/vapi-chat-widget.tsx`)
  — the official `@vapi-ai/client-sdk-react` `<VapiWidget>` component,
  `mode="hybrid"`, mounted once in the root layout so it's on every page.
  Bottom-left (not bottom-right, to avoid stacking with the header
  widget's `FloatingCallBar`), styled with the site's brand colors, custom
  first message/placeholder copy. Reuses the exact same
  `NEXT_PUBLIC_VAPI_PUBLIC_KEY` / `NEXT_PUBLIC_VAPI_ASSISTANT_ID` env vars
  as the header widget (via new `vapiPublicKey`/`vapiAssistantId` exports
  in `use-vapi-call.ts`) — no new config needed. Renders nothing if those
  aren't set, same honest-fallback pattern as the header widget.
  - **Continuity note (verified against the package's shipped `.d.ts`
    types and README, since `docs.vapi.ai` is still blocked from this
    sandbox):** `mode="hybrid"` lets a visitor switch between text and
    voice in one widget UI, but neither the docs nor the types say a
    voice call shares the same session/transcript as the chat before it.
    The widget's copy says "switch to a voice call," never "continue this
    conversation by voice," on purpose — a real shared-context bridge
    would need a server-side piece (this site's backend passing the chat
    transcript into the voice call's `assistantOverrides` via Vapi's
    *private* key) and isn't built.
  - [x] **Double-call prevention — built, 2026-08-27**
    (`src/lib/call-coordinator.ts`). There are still two independent
    ways to start a real voice call on the site (this widget, and the
    header "Call Now" button), but they can no longer both be live at
    once: a plain module-level singleton tracks which one holds the
    shared "call slot," and each side enforces it the way its SDK
    actually allows —
    - Header: `use-vapi-call.ts`'s `start()` calls `claimCallSlot()`
      *before* touching `@vapi-ai/web` at all, and refuses (with a real
      error message: "A call is already in progress in the chat
      widget…") if the chat widget already holds it. The trigger button
      itself is also disabled (`call-widget.tsx`) whenever the chat
      widget has a live call, so there's nothing to click, not just an
      error after the fact.
    - Chat widget: the packaged `<VapiWidget>` exposes no ref/prop to
      intercept its internal "start voice call" button, so instead this
      component renders with `mode="chat"` (voice button removed
      entirely) whenever the header holds the slot, and claims/releases
      the slot itself from `onVoiceStart`/`onVoiceEnd`/`onError`.
    - Honest gap: `onVoiceStart` likely fires once the chat widget's
      call has already connected (not before), so there's a narrow
      timing window where both could theoretically start if triggered
      at the exact same instant. Acceptable for one person on one page;
      not a hard cross-process guarantee. Verified via a full rebuild +
      lint + a real headless-browser load (both triggers render
      correctly, no console errors) — not yet tested against two real,
      simultaneous Vapi connections, since that needs real credentials
      and two live attempts timed together.
  - Verified: builds/lints/typechecks clean with and without the env vars
    set; manually tested in a real browser (Playwright, dummy key) —
    floating launcher renders correctly on desktop and mobile, panel opens
    with hybrid text+voice controls, no console errors, no horizontal
    overflow on mobile. Not tested against a real Vapi key/live call.
  - Analytics: wired the widget's `onVoiceStart`/`onVoiceEnd`/`onError`
    callbacks to `@vercel/analytics`'s `track()` (already in use
    site-wide) as `voice_call_connected` / `voice_call_ended` /
    `voice_call_failed`. Did **not** add `chat_widget_opened` or
    `text_message_started` — the widget's `onMessage` callback is typed
    `any` with no documented payload shape, and guessing at one risked
    silently-wrong analytics rather than an honest gap.
  - **Still not tested against a real call (2026-08-27)** — unlike the
    header widget above, nobody's actually opened this widget and
    switched to voice yet, so its `/management` "Chat widget data" card
    (§6) has zero real events to show. That card is also currently
    erroring (`reason: "error"`, not the "no data yet" state) when
    queried — leading hypothesis is that Vercel's Web Analytics
    `events` dataset doesn't exist for a project until at least one
    custom event has ever been recorded (same category of thing as
    "not enabled until first pageview," but for the events sub-resource
    specifically) — unconfirmed until this widget is actually tested
    live and the card is rechecked afterward.
  - **Hidden on `/management`** (`vapi-chat-widget.tsx` checks
    `usePathname()`) — it's owner-only tooling, not a customer
    touchpoint, and would otherwise sit in the same bottom-left corner
    as some of the dashboard's own content.
  - **Launcher icon is not customizable** — checked: the package
    (`@vapi-ai/client-sdk-react` v0.1.1) hard-codes a waveform icon
    into its bundled JS with no prop to swap it for anything else (its
    `VapiWidgetProps` type has no icon-related field at all). There's
    no stable CSS class to safely target it either — it's a plain
    inline SVG with no distinguishing selector. Swapping it for a phone
    icon would mean forking the package's rendering, not a config
    change; not done.

---

## 6. Owner Management Dashboard — v1 shipped (password-gated)

The idea: a single, low-key "Management" link in the site footer that
gateways to a private dashboard aggregating everything built across this
whole engagement — website traffic, phone agent activity, and demo/tool
usage — in one place. This is what actually proves the value the
commission structure is based on, rather than the owner having to piece
it together from four different tools (or take it on faith).

**v1 is built**, per the "Open question: how is this actually secured?"
plan below — option 1, a single shared password.
- `/management` (`src/app/management/page.tsx`), gated by `src/proxy.ts`
  (Next 16 renamed `middleware.ts` → `proxy.ts`; the old name now logs a
  deprecation warning at build time) — any request to `/management` or a
  sub-route without a valid session cookie redirects to
  `/management/login`.
- One env var to set in Vercel: **`MANAGEMENT_PASSWORD`**. No password
  set → login always fails with an honest "not configured" message
  instead of silently accepting anything.
- `src/lib/management-auth.ts` signs the session cookie with an HMAC
  (Web Crypto, keyed on `MANAGEMENT_PASSWORD` itself) so a visitor can't
  just set their own "logged in" cookie — only someone who already knows
  the password could forge a valid one. 30-day session, httpOnly +
  Secure + SameSite=Lax cookie.
- Login is a real Next.js Server Action (`src/app/management/actions.ts`)
  with a plain `<form>`, so it degrades gracefully without JS.
- Dashboard content so far: total phone-booking count and a recent-
  bookings table, both live from Supabase via `booking-store.ts`'s new
  `getBookingsCount()`/`listRecentBookings()` (page is
  `force-dynamic` — never statically cached); falls back to an honest
  "not durable yet" notice when Supabase isn't configured. Plus link-out
  cards to Vercel, Vapi, and Supabase's own dashboards for everything not
  pulled in directly yet (Core Web Vitals). Demo/tool usage tracking
  (`/diagnose`, `/track`, `/retail`) is still not built — same gap called
  out below.
- **Site traffic is wired up against Vercel's own Web Analytics REST
  API** — `src/lib/vercel-analytics.ts` calls `visits/count` (7d + 30d
  visitors/pageviews) and `visits/aggregate` (top 5 pages, 7d) using one
  new secret, **`VERCEL_API_TOKEN`** (create at Vercel → Account
  Settings → Tokens), plus the auto-provided `VERCEL_PROJECT_ID` and a
  hardcoded team ID (not a secret, overridable via `VERCEL_TEAM_ID`).
  - **Resolved, 2026-08-27 — confirmed working in production.** The
    "is Vercel Analytics data actually pullable for free?" question is
    answered: yes. `/management`'s Site traffic card is now showing
    real numbers (visitors, pageviews, top pages) on the live
    deployment — confirmed via the owner's own screenshots. No paid
    plan needed; the "maybe needs Plus/Pro" theory from earlier
    sessions was a red herring, not confirmed by anything beyond
    repeated 404s that have since stopped happening. Exact root cause
    of the earlier 404s stays unconfirmed (possibly propagation delay,
    possibly something specific to how it was being queried at the
    time) — not worth chasing further now that it demonstrably works.
  - One real gap surfaced once traffic *was* flowing: the **Chat
    widget data** card (below) still errors even though Site traffic
    works — see the "Still not tested against a real call" note under
    Tier 5 above for the current hypothesis (events dataset may not
    exist until a custom event has ever fired).
  - Speed Insights (Core Web Vitals) is not pulled in the same way yet —
    still just a link-out. Its own dashboard panel (checked 2026-08-27)
    shows "No data available" with no enable toggle either, plus an
    "Available in Plus" upsell specifically on the detailed FCP/LCP/INP
    metrics — likely just needs more real traffic (the code side was
    already confirmed correct earlier), not a config fix. Worth
    revisiting once Web Analytics is sorted out.
- **Chat widget data and Caller data sections added**, following the
  merge of §5 Tier 5's floating chat+voice widget
  (`vapi-chat-widget.tsx`) into `main` — both the header call widget and
  the chat widget's voice mode talk to the same Vapi assistant
  (`NEXT_PUBLIC_VAPI_ASSISTANT_ID`), so both needed a real place to show
  up here instead of the old "not tracked yet" stub.
  - **Chat widget data**: reads the `voice_call_connected` /
    `voice_call_ended` / `voice_call_failed` custom events the chat
    widget already fires via `@vercel/analytics`'s `track()` (added when
    that widget was built) — `getChatWidgetSummary()` in
    `vercel-analytics.ts`, same `VERCEL_API_TOKEN`/Web-Analytics-enabled
    requirement as site traffic above, no new secret. Only covers the
    widget's voice mode, honestly — its text-chat `onMessage` was
    deliberately left un-instrumented when it was built (undocumented
    payload shape), so this can't show chat-message volume yet.
  - **Caller data**: real call volume/cost/duration/ended-reason from
    Vapi's own Calls API (`GET https://api.vapi.ai/call`), scoped to
    this site's assistant — `src/lib/vapi-analytics.ts`. Needs one new
    secret, **`VAPI_PRIVATE_KEY`** (Vapi Dashboard → API Keys → Private
    Key — never the same value as the already-public
    `NEXT_PUBLIC_VAPI_PUBLIC_KEY`). Splits each period into web calls
    (either site widget) vs. real phone calls using Vapi's own `type`
    field, since Vapi doesn't tag a call by which widget started it.
  - `docs.vapi.ai` is still blocked from this sandbox, so the Calls
    API's exact query-parameter names for server-side date filtering
    couldn't be verified — confirmed the endpoint/auth pattern
    (`GET /call`, Bearer token) via search results instead, and to avoid
    guessing at unverified filter params, `vapi-analytics.ts` fetches
    the most recent 100 calls and buckets them into 7d/30d windows in
    code. Fine at today's call volume; flagged in the code
    (`truncated` field, surfaced in the UI) for whenever that stops
    being true.
  - Both sections use the same honest-fallback pattern as the rest of
    this page — an amber notice naming exactly which env var is missing
    rather than showing zeroes.
- Footer link added (`src/components/layout/site-footer.tsx`), styled
  plain/muted in the copyright bar as planned, not in the main sitemap
  list.
- Still open: v2 real auth (Supabase Auth) if this outgrows "one owner,
  one password"; no rate limiting on login attempts yet (matches the
  Vapi tool routes' Tier 0 gap — same class of issue, not yet hardened
  anywhere on this project).

### What it would show
- **Site health** — traffic and Core Web Vitals, straight from Vercel
  Analytics/Speed Insights (§1, just added).
- **Phone agent activity** — call volume, what callers actually asked
  about, how many turned into a booking. Source: Vapi's call
  logs/transcripts, plus a straight count query against Supabase's
  `bookings` table (§5 Tier 1) for "how many real appointments has Casey
  booked." This is the single most important number for the deal
  structure — it's the receipt for "the agent generated a lead or a
  sale."
- **Demo/tool engagement** — how often `/diagnose`, `/track`, and
  `/retail` actually get used. Nothing currently logs this (they're pure
  client-side interactions with no analytics event today) — would need a
  handful of `track()` calls via the Vercel Analytics package already
  installed (it supports custom events, not just page views) rather than
  a new system.
- **Lead capture**, once §5 Tier 1's attribution logging exists — same
  place this dashboard would read from.

### Open question: how is this actually secured?
A public link labeled "Management" in the footer of a live marketing
site is a real exposure risk the moment there's anything behind it worth
looking at — this can't just be an unauthenticated route. Two options,
roughly in order of effort:
1. **v1 — simple password gate.** A single shared password in an env var
   (`MANAGEMENT_PASSWORD`), checked server-side, sets a signed cookie on
   success. Fast to build, zero new infrastructure, fine for "one owner,
   one password" — but it's a shared secret, not a real account, and
   doesn't scale past that.
2. **v2 — real auth via Supabase Auth.** Already in the stack for the
   booking store (§5), and its free tier includes email/password or
   magic-link auth. One real owner account instead of a shared password.
   Worth doing once this is more than a proof-of-concept, not necessary
   for the first version.

Leaning toward v1 to start, given the "free until proven" framing — it's
enough to demo the concept honestly, and upgrading to v2 later doesn't
touch anything else (no data model changes, just swaps the gate).

### Resolved: is Vercel Analytics data actually pullable for free?
Yes — confirmed 2026-08-27, no paid plan needed. See the note under
"Site traffic" above.

### Rough shape — built as described, see above
`/management` route, password-gated (v1, done) — a future Supabase-Auth
v2 remains an option if needed later. Stat cards pull real Supabase data
(bookings count) today; demo tool events aren't tracked yet. Vercel/Vapi
sections are linked out rather than embedded for now. Footer link is
deliberately plain/unstyled — this isn't a customer-facing feature, it
shouldn't look like one.

### Tabbed layout — built 2026-08-27
`/management` is now three tabs sharing one header/sign-out, not one long
scrolling page: **Overview** (everything from above), **Stock** (the
stock-count editor below), and **Anthony&rsquo;s Checklist** (placeholder,
content TBD). Implemented as a Next.js route group,
`src/app/management/(dashboard)/` — `layout.tsx` holds the shared
header/tabs/sign-out and wraps `page.tsx` (Overview), `stock/page.tsx`,
and `checklist/page.tsx`; `login/page.tsx` sits outside the group so it
stays chrome-free. `src/components/management/management-tabs.tsx` uses
framer-motion's `layoutId` shared-element animation for the sliding
active-tab underline (a spring tuned for minimal overshoot, not a bouncy
feel) rather than hand-measuring tab positions; `page-transition.tsx`
gives each tab a brief fade+slide-up on entry. Both reuse framer-motion,
already a dependency for the FAQ accordion and scroll-reveal.

### Stock editor — built 2026-08-27
`/management/stock` — real, per-item, per-location number inputs backed
by `src/lib/retail-store.ts`'s new `updateItemStock()`, called through a
server action (`stock/actions.ts`) that revalidates both
`/management/stock` and the public `/retail` page on save so a change
shows up in both immediately, not just after the next natural
revalidation. Save is per-row (not one big "save everything" button) —
correcting one count shouldn't put every other row's unsaved draft state
at risk. Deliberately scoped to stock counts only: adding a new item,
retiring one, or changing its name/price/condition is still a Supabase
table-editor task (plain text/number columns there, genuinely fine for a
non-technical person — the only awkward column, `stock` jsonb, is what
this editor exists to avoid hand-editing). Disabled entirely with an
honest note when Supabase isn't configured, matching the rest of
`/management`'s fallback pattern.

---

## 7. Deeper Metrics — Cross-Source Business Insights (brainstorm, not built)

§6 wired up four real data sources: Vercel Web Analytics (site traffic,
once the open access question above is resolved), Vercel custom events
(chat widget voice actions), Vapi's Calls API (caller data), and
Supabase (real bookings). Each shows up on `/management` today as its
own isolated stat card — raw counts, not insight. A visitor count and a
booking count sitting next to each other on the same page is not the
same thing as knowing what actually drives a booking. This section is
the brainstorm for **combining** these sources into numbers an owner
would actually change a decision based on, not just numbers to glance
at. Nothing here is built — it's the dig list for once the underlying
sources (especially Web Analytics, still blocked per §6 above) are
confirmed flowing.

### 7.1 Funnel & conversion metrics (the big one)
- **Full-funnel drop-off**: site visit → `/estimate` or `/diagnose`
  started → contact info captured → real booking created. Right now
  each step lives in a different system (Vercel pageviews,
  client-only quiz state, Supabase) with nothing tying one visitor's
  path across them — the single highest-value thing to build here,
  and the hardest, since it needs a shared visitor/session identifier
  threaded through all three.
- **Call → booking conversion rate**, not just call count next to
  booking count: what fraction of calls in a window actually resulted
  in a booking, by correlating Vapi call timestamps against
  `bookings.created_at`. Turns "47 calls this week" into "47 calls, 12
  bookings, 25% close rate" — the number that actually matters for the
  commission conversation (see §5 Tier 1's attribution note).
- **Web-widget calls vs. phone-number calls, conversion compared** —
  Vapi's caller data already splits these by `type` (§6); worth
  checking whether one entry point converts meaningfully better than
  the other, since that's a real product decision (§5 Tier 5's "two
  widgets, one assistant" open question) with an actual number behind
  it instead of a guess.
- **Diagnostic-quiz path vs. direct estimate-wizard path** — does
  finishing `/diagnose` first (§2.2) correlate with a higher booking
  rate than landing straight on `/estimate`? Would validate (or kill)
  the quiz's whole "free value hook" premise from §2.4 with a real
  number instead of a hunch. Needs `/diagnose` instrumented with
  `track()` events first — it currently emits nothing server-visible.

### 7.2 Cost & efficiency metrics
- **Cost per booking**: Vapi's `totalCost` (already summed in
  `vapi-analytics.ts`) divided by bookings in the same window — a real,
  trackable customer-acquisition cost that gets cheaper or more
  expensive as call volume and close rate shift. Directly answers "is
  the phone agent worth what it costs" in one number.
- **Ended-reason breakdown** (`endedReason` on every call, already
  fetched but not bucketed yet) — how many calls end in a normal
  resolution vs. silence-timeout vs. an assistant error vs. the caller
  just hanging up mid-sentence. A spike in one bucket is a concrete
  signal of where the agent is underperforming, not just "call volume
  is up or down."
- **Average call duration by outcome** — do calls that convert to a
  booking run longer or shorter than ones that don't? Useful for
  tuning how much the assistant should try to accomplish per call.

### 7.3 Attribution & source quality
- **Referrer/UTM → booking**, not just referrer → visit. Knowing
  "40% of visits are from Google" is much less useful than "visits from
  the Google Business Profile listing convert to bookings at 3x the
  rate of Facebook traffic" — needs UTM/referrer captured at first
  touch and carried through to whichever booking eventually happens
  (same shared-identifier problem as 7.1).
- **Repeat-contact detection**: cross-reference phone numbers appearing
  in both Vapi's caller data and Supabase's `bookings.callback_number`
  — surfaces people who called more than once before booking (a
  hesitant-lead signal worth a follow-up) vs. one-call-and-done.
- **Location split vs. digital demand**: bookings by location (Arnold
  vs. Ballwin, `locations.ts`) cross-referenced against which pages/
  traffic sources actually drive interest in each — informs whether
  the two shops need different marketing, not just a shared site.

### 7.4 Behavioral & timing patterns
- **Time-of-day / day-of-week heatmap**, calls and site visits both —
  answers a genuinely operational question (should the phone agent's
  hours, or a human's, extend past the shop's current hours in
  `locations.ts`?) with real usage data instead of a guess.
- **Time-to-book**: elapsed time between a lead's first touch (call or
  site visit) and an actual booking — a funnel-velocity number, and a
  leading indicator if it starts drifting longer over time.

### 7.5 Content signal mining
- **Transcript keyword/theme extraction** — Vapi retains full call
  transcripts (per §5 Tier 4's call-analytics-digest idea); even a
  lightweight pass (common phrases, most-asked-about repair types,
  recurring objections) turns raw call logs into "here's what
  customers actually keep asking that isn't obvious from the FAQ page"
  — real product/content feedback, not a metric so much as a business
  insight generator. Natural fit for an LLM summarization pass rather
  than manual reading, given real volume.
- **Abandoned-estimate detection**: the Estimate wizard already
  validates and holds name/email/phone (§2.4) before the final step —
  if a visitor fills that in but never reaches "booked," that's a real,
  named lead that fell out of the funnel, distinct from an anonymous
  visitor who just bounced. Currently nothing captures this
  intermediate state at all.

### What this needs first (prerequisites, not yet true)
- Web Analytics API access actually resolved (§6 above) — most of 7.1
  and 7.3 are dead in the water until visit-level data is reachable at
  all, not just call/booking data.
- A shared visitor/session identifier threaded across page views, the
  diagnostic quiz, the estimate wizard, and the eventual booking — none
  of today's four sources currently share one, which is what turns
  "four separate counts" into "one funnel." Worth deciding whether that
  identifier is a Vercel Analytics session concept, a first-party
  cookie this site sets itself, or something else, before building any
  of the funnel metrics above.
- `/diagnose`'s decision-tree flow instrumented with `track()` events —
  currently emits nothing measurable server-side (§2.2), which blocks
  the diagnostic-path-vs-direct-path comparison in 7.1.

---

## 8. Warehouse Workflow — Scannable Job Tickets & Parts Backorder Queue (brainstorm, rough draft)

Owner's rough-draft idea, 2026-08-27: run the repair floor more like a real
warehouse — each device/job gets a scannable code so a tech can advance it
through repair stages with a scan instead of typing into an admin screen,
and separately, track backordered parts against the specific device
waiting on them, surfaced first-in-first-out so nobody has to remember by
hand which device gets a part first once it arrives. This is the real,
concrete fix for the gap §2.1 already flagged — "every ticket currently
starts and stays at step 0 since there's no staff-facing way to advance
it" — just via a scanner instead of a manual toggle. Investigation below,
nothing built yet.

**Directly affected by the RepairDesk finding in §5** (see
`owners-current-flow.md` for the full spec): the shop already
runs RepairDesk as their real ticketing system. A real repair-shop POS
like RepairDesk almost certainly already tracks tickets through stages
and very possibly already supports label/barcode printing — some of what
8.1–8.3 sketches out may already exist there, or be buildable as a
thinner layer on top of RepairDesk's API instead of a fully independent
system. Worth checking what RepairDesk actually offers here before
building any of this from scratch — this brainstorm stays useful either
way (as its own system, or as the design for a custom front end over
RepairDesk's real data), but which one changes the actual work a lot.

### 8.1 Scannable stage transitions — the easy version needs no scanner at all
The cheapest real version of "scannable" doesn't need a camera-scanning
library, a native app, or even a "Scan" button in `/management`: a QR
code is just a picture that encodes a URL, and every phone's stock camera
app already decodes a QR code into a tappable link with zero setup. So:
- Each ticket gets a QR code (generated server-side with a plain JS
  library like `qrcode` — no external API, no cost) printed on the
  intake slip/label, encoding a link like
  `https://phone-geeks-website.vercel.app/management/tickets/PG-56276/advance`.
- A tech just points their phone's camera at the label, taps the
  notification, and the page (gated behind the existing
  `MANAGEMENT_PASSWORD` session, same as the rest of `/management`)
  shows the ticket's current stage with one button: "Mark: Diagnosing"
  → "Mark: Repairing", etc. — advancing `TRACKER_STEPS`
  (`src/lib/tracker-data.ts`, already the exact 5-stage sequence
  `/track` renders) by one, for real, in Supabase.
- **v2, not needed to start**: an in-app scanner (browser
  `BarcodeDetector` API where supported, or the `jsQR` library as a
  fallback) so a tech never has to leave `/management` at all. Worth
  doing once the basic scan-a-label flow is proven out, not before.
- **Real open question**: a link that *mutates* a ticket's status can't
  just be a bare public URL — anyone who photographs the label could
  advance (or customers scanning out of curiosity could get confused
  seeing) a status page. Since it's already gated behind
  `MANAGEMENT_PASSWORD`, an unauthenticated scan just redirects to
  `/management/login` first, same as any other `/management` route — no
  new auth mechanism needed, just confirming the ticket-detail route
  lives under the existing `(dashboard)` route group.

### 8.2 Real job tickets — the actual missing piece underneath this
Neither the QR flow above nor a FIFO parts queue can exist yet, because
**there's no real "current stage" field for a ticket to advance today.**
`bookings` (`src/lib/booking-store.ts`) only has creation-time fields
(device, issue, location, caller info, timestamp) — no status/step
column at all. `TRACKER_STEPS` and `DemoTicket.currentStep` are a UI
shape `/track` renders, not something durable any real ticket is stored
against; every real (phone-booked) ticket hardcodes `currentStep: 0` in
`/api/track/[id]/route.ts` today specifically because there's nowhere
real to read a different value from.
- Needs a real `current_step` (or `status`) column somewhere — either
  extend `bookings`, or (more likely the right call) a new `tickets`
  table, since not every real ticket originates from a phone booking —
  a walk-in who never called still needs a job ticket, and `bookings`
  is specifically the phone-agent's table today.
- If a new `tickets` table: decide whether phone bookings become a
  ticket automatically on creation (device physically isn't at the shop
  yet, so maybe stays "step -1"/"requested" until check-in), or whether
  check-in is a distinct real-world event that creates the ticket. This
  is a real workflow question for the shop, not just a schema one.

### 8.3 Backordered parts ↔ pending device, shown FIFO
Once 8.2 exists (a real ticket to link against), the parts side is
mechanically simple:
- New table, e.g. `part_orders`: part name, supplier, `ordered_at`,
  expected date, status (`ordered` / `received`), and a `ticket_id`
  foreign key to whichever device is waiting on it.
- **FIFO is just `order by ordered_at`** — no queue infrastructure
  needed, a straight sort on when each part was ordered gives the
  "whoever's been waiting longest goes first" view directly. A
  "Waiting on Parts" list (a new `/management` tab, or a section on
  Stock) shows blocked tickets oldest-first; marking a part `received`
  flags its linked ticket ready to resume.
- One part order per device covers the common case even when several
  devices need the *same* part — multiple `part_orders` rows, same part
  name, different `ticket_id`, naturally sort into the right order
  without any extra "queue position" field to keep in sync by hand.

### What this needs first (prerequisites, in order)
1. **8.2's data model decided** — nothing in 8.1 or 8.3 has anywhere
   real to attach to until there's an actual ticket record with a
   status field, separate from `bookings`' current "just a request"
   shape.
2. Whether the existing shared `MANAGEMENT_PASSWORD` is granular enough
   once multiple staff are independently scanning tickets, or whether
   this is what finally pushes `/management` toward the real-accounts
   v2 auth option already named in §6 (worth knowing *before* handing
   out a scan-to-advance flow to a whole shop floor, not after).
3. A real-world, non-software dependency: someone still has to print and
   physically attach a QR label to each device/ticket — no amount of
   code removes that step.
