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
- [ ] **Contact page** — Arnold + Ballwin location cards, embedded map, live/today's hours; decide how (or whether) to surface Affton
- [ ] **FAQ page** — accordion component, reusing the real Q&A content already in the brief
- [ ] Polish pass — animation pass with Framer Motion, responsive QA on all pages, favicon/OG image, meta per page

### Stretch (lower priority for interview demo)
- [ ] Blog / device-tips content — only if time allows, hardcoded posts are fine

---

## 2. Branded / Unique Component Brainstorm

These are the "make it feel like a real product, not a template" pieces —
the stuff that actually shows off during the interview. Roughly ranked by
impact vs. effort.

### 2.1 Repair Status Tracker ("Track My Repair")
The one we kept coming back to. A live-feeling status tracker even though
it's running on mock/demo data.
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

### 2.2 Free Diagnostic / "What's Wrong With My Device?" Quiz Flow
Positioned as the free-value hook mentioned below — a quick, guided
triage tool instead of a blank contact form.
- 3–4 step flow: **Device type → Symptom(s) → Device age/model** → result
  screen with a likely-issue summary, a ballpark price range, and a clear
  CTA into the real estimate flow.
- This *is* the "free value" thing — it gives the visitor something useful
  (an honest-feeling diagnosis) before ever asking for contact info, which
  is exactly the kind of small-business trust move Phone Geeks already
  leans on ("Consult a Geek," free in-person diagnosis).
- Doubles as lead-gen: the result screen is the natural spot to offer
  "email me this estimate" → feeds the email capture flow (§2.4).

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
