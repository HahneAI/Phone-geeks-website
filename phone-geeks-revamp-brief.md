# Phone Geeks Website Revamp — Project Brief

**Source site:** https://tryphonegeeks.com (WordPress + Divi v4.0.6)
**Goal:** Modern rebuild, same brand identity, upgraded UX/components — built as a portfolio piece for a job interview with the shop.
**Hosting target:** Vercel

---

## 1. Business Context

- Phone Geeks — cell phone / computer repair shop, St. Louis, MO area
- Founded 2016, ~5 employees, family/small-business feel
- 3 locations: Affton, Arnold, Ballwin (Arnold and Ballwin are the active booking locations)
- Services: smartphone repair, Macbook/computer repair, tablet/iPad repair, game console repair, gadget buyback/recycling, retail (refurbished phones/accessories)
- Core promise: 1-hour repair turnaround, 1-year warranty (parts + labor, excludes liquid/user damage)
- Trust signals: Google reviews, "since 2016," in-person consultations ("Consult a Geek")

## 2. Sitemap / Pages to Rebuild

| Page | Purpose | Notes |
|---|---|---|
| Home | Hero, services grid, testimonials, warranty summary, blog teaser | Long single-scroll page currently |
| Estimate | Store picker → booking/quote flow | Currently barebones, needs real interactive flow |
| Contact | Location list w/ phone + directions | Arnold, Ballwin (Affton exists but under-featured) |
| FAQ | Warranty, pricing, repair scope Q&A | Good content, needs better UI (accordion) |
| Services (implied, currently a dead link) | Detail on each repair type | Build this out as a real page |
| Blog (optional/stretch) | Device tips content | Lower priority for interview demo |

## 3. Current Content Inventory

### Home
- Hero: "Revive Your Tech — Fixing your Smart Phone can take only one hour, with one year warranty."
- CTAs: "Get Instant Repair Quote!" / "Shop phones!"
- Services block: Consult a Geek, Smart Phone Repair, Macbook & Computer Repair, Gadgets Buyback/Recycling, Retail, Safe & Secure, Parts Quality
- Repair type icons: Battery Replacement, Charging Problem, Cracked Screen, Phone Camera Replacement, Speaker Sounds Repair, Microphone Issue
- 3 Google review testimonials (Shannon Schindler Redman, Mike Sterba, Theresa Vail)
- Warranty summary: 1yr repairs, 60-day sales, 3-day accessories
- Blog teaser (5 recent posts)

### Estimate
- Store select: Arnold / Ballwin
- Mail-in repair option (separate flow)
- "$0.00 shown = we'll email estimate within minutes" messaging

### Contact
- Arnold: 636-333-3324 — 141 Arnold Crossroads Center, next to Gold's Gym
- Ballwin: 636-256-1702 — 14748 Manchester Rd, near Toyota/Nissan on Manchester Rd

### FAQ (real Q&A to reuse/rewrite)
- Water damage repairs: 24–72 hrs depending on damage
- Warranty: 1yr parts+labor, excludes liquid/user damage
- No prepay — pay after repair completed
- Pricing = part cost + labor charge
- iPad/tablet repair: yes
- Mac/Windows desktop & laptop: yes, hardware + software
- Game consoles: yes (PSP, DS, Wii U)

## 4. Brand Style Notes (carry forward)

- **Colors:** blue + red as primary accents (from existing icon set), needs a defined palette (e.g. deep blue primary, red as CTA/accent, neutral gray/white base)
- **Tone:** casual, approachable small-business — keep warmth, clean up typos and grammar
- **Trust-first layout:** warranty, reviews, and "family shop" feel should stay prominent
- **Logo:** simple icon mark — recreate cleanly, don't just re-upload the old raster file

## 5. What to Fix / Modernize

- Broken/orphan links (`#2594 (no title)`, dead "All Services" anchor, `#` Twitter link)
- Bloated, redundant footer menu — consolidate into a real sitemap
- Estimate flow is non-functional as-is — needs a real interactive quote form
- Typos ("vareity," "loose" → "lose," "Guaranatee")
- No real component system — currently static icon+text blocks

## 6. New/Dynamic Components to Build

- Interactive **pricing/quote calculator** (device + issue → estimated price/time)
- **Location picker** with embedded map + live hours
- **Repair status tracker** (mock/demo data is fine for interview purposes)
- Service cards with hover detail (replacing static icon rows)
- FAQ accordion
- Sticky nav with clear CTA ("Book a Repair")
- Testimonial carousel (pull from Google Reviews style)

---

## 7. Recommended Tech Stack (Vercel-optimized)

- **Framework:** Next.js 14+ (App Router) — best-in-class Vercel deploy, SSR/SSG mix for SEO on marketing pages + dynamic components
- **Language:** TypeScript
- **Styling:** Tailwind CSS — fast to theme with brand colors, easy to keep consistent
- **UI components:** shadcn/ui (accordion, cards, dialogs, carousel) — unstyled primitives you fully control, pairs natively with Tailwind
- **Animation:** Framer Motion — for hover states, page transitions, the quote calculator interactions
- **Forms:** React Hook Form + Zod — for the estimate/quote form validation
- **Icons:** lucide-react
- **Maps:** Google Maps embed or Mapbox GL (Mapbox is free-tier friendly and looks more modern)
- **CMS (optional, if you want blog/editable content):** Sanity or Contentful free tier — skip for MVP, hardcode content first
- **Deployment:** Vercel (zero-config with Next.js)
- **Analytics:** Vercel Analytics (built-in, no extra setup)

### Why this stack
- Next.js + Vercel = zero-friction deploy, instant preview URLs (good for showing the shop owner progress)
- Tailwind + shadcn = you can move fast without fighting custom CSS, still looks bespoke not templated
- No backend/database needed for MVP — quote calculator and tracker can run on static logic + mock data, keeps scope realistic for an interview demo

---

## 8. Suggested Build Order

1. Scaffold Next.js + Tailwind + shadcn, set up brand color tokens and typography
2. Build layout shell: nav, footer, page routing
3. Home page: hero, services grid, testimonials, warranty section
4. Services page (new): detailed repair-type breakdown
5. Estimate page: interactive quote calculator (mock pricing logic)
6. Contact page: locations with map embeds
7. FAQ page: accordion component
8. Polish pass: animations, responsive check, favicon/meta, deploy to Vercel
