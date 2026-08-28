# The Shop's Current Flow — RepairDesk (POS/CRM)

Grounding doc for a conversation with the owners and the general manager about
where this website's booking/tracking/inventory work should go next. Written
2026-08-27/28 after the owners confirmed the shop actually runs its ticketing
and point-of-sale on **RepairDesk**, not on anything this site builds.

## Why this doc exists

Everything this site currently does around bookings, `/track`, and retail
stock (see `TODO.md` §5–§8) is an *independent* system sitting next to the
shop's real system of record. That was a reasonable way to build a public
website fast, but it means:

- `/track/[id]` shows a hardcoded `currentStep: 0` — it has never reflected a
  real repair's real status, because no real status exists anywhere in this
  site's data model.
- The retail stock editor (`/management` → Stock) tracks counts in this
  site's own Supabase table, not in whatever RepairDesk already tracks as
  inventory.
- The warehouse/QR-ticket brainstorm in `TODO.md` §8 sketches a ticket-status
  and parts-backorder system from scratch — which may substantially
  duplicate what RepairDesk already does out of the box.

This doc lays out what's actually known about RepairDesk's capabilities so
the "build our own vs. integrate with RepairDesk" conversation can happen
with real facts instead of guesses.

## The people, and the tension

- **Owners**: use and like RepairDesk specifically for its **vendor
  integrations** (parts ordering/sourcing tied to suppliers).
- **General manager**: the one technically savvy person day-to-day, and
  actively dislikes RepairDesk.
- Nobody has said RepairDesk is going away. This is a preference/friction
  disagreement, not a confirmed migration.

This doc does not take a side on that — it's a business relationship call
between the user and the shop, not something to resolve in code. What it can
do is make the *technical* tradeoffs concrete: what RepairDesk's API would
let this site plug into if the group decided to integrate, versus what has
to be built from scratch if the group decided to keep this site's system
independent.

## ⚠️ A note on how this was researched

**`api-docs.repairdesk.co` and `docs.repairdesk.co` (the product-manual
subdomain) return HTTP 403 from this sandbox** — a Cloudflare bot-check on
those specific subdomains, not a general egress block like the one
documented for `docs.vapi.ai` in `vapi-front-desk-agent-brief.md`. Direct
`WebFetch` to `repairdesk.co`'s main site and, importantly,
**`help.repairdesk.co` (the support knowledge-base subdomain) both work
fine** — that's where the confirmed facts below came from, via `WebFetch`
reading the actual KB articles directly, not just `WebSearch` snippets.

The primary API reference at `api-docs.repairdesk.co` is still unread.
Whoever picks this up next should try it from a real browser (not a
sandbox) — Cloudflare bot-checks usually pass fine for a human. Everything
below not sourced from `help.repairdesk.co` is still `WebSearch`-snippet
secondhand and flagged as such.

## What's now confirmed (read directly from `help.repairdesk.co`, 2026-08-28)

- **Base URL: `https://api.repairdesk.co/api/web/v1/`**
- **Auth: a plain API key**, not just OAuth. Generate it in the RepairDesk
  app itself: **Store → General Settings → "Other Information" section →
  API KEY** (Reset to rotate, then Save Changes). Pass it as a query
  parameter on requests: `?api_key=YOUR_KEY`. No mention of a required
  pricing tier for this — it reads as available on any active account.
  (Source: `help.repairdesk.co/portal/en/kb/articles/api`)
- **Rate limit: 50 requests/minute.** Responses are JSON.
  (Same source as above.)
- **A separate, real OAuth 2.0 Authorization Code Grant flow also exists**
  for third-party apps acting on a user's behalf (distinct from the simple
  API-key mode above — useful if this site ever needs to act as an
  installable RepairDesk integration rather than a single-store script):
  - `GET /oauth2/authorize` — user consent, redirects to the store's
    tenant-specific RepairDesk domain for approval.
  - `POST /oauth2/token` — exchanges an authorization code (or refresh
    token) for an access token.
  - `POST /oauth2/revoke` — invalidates a token.
  - Access tokens last 1 hour; refresh tokens last 1 month; both
    revocable. Docs stress not exposing the client secret in frontend
    code, HTTPS-only, redirect URI validation.
  (Source: `help.repairdesk.co/portal/en/kb/articles/oauth-2-0-api-documentation`)
- **RepairDesk's own Zapier integration confirms specific event/action
  names that likely mirror what the raw API and webhooks expose**
  (Source: `zapier.com/apps/repairdesk/integrations/webhook` and
  `help.repairdesk.co`'s Zapier KB article):
  - Triggers: New Customer, New Invoice, New Lead, **New Ticket**, New
    Payment Added, Employee Commission Assigned, **New Inventory Item**,
    **Inventory Updated** (stock or price changed), and — the one that
    matters most for `TODO.md` §8 — **Ticket Status Change** ("triggers
    when the status of any ticket is changed on RepairDesk").
  - Actions: Create Customer, Create Lead, **Create Ticket**, Add Payment
    to Invoice, Find Customer, and **Update Ticket** ("Update Ticket
    Status" — takes a status field, ticket ID optional).
  - This is strong, concrete evidence RepairDesk's own event model already
    has a first-class "ticket status changed" concept and a
    "set ticket status" write operation — exactly the primitive `TODO.md`
    §8.1/§8.2's scannable-stage-advance idea would need, so it likely does
    **not** need to be invented from scratch if integrating.
  - **Tier gate found for this specific automation feature**: "available
    for Enterprise, Growth & Advanced Plan" or as a **$9.99/mo add-on** on
    lower tiers (per the Zapier KB article). This is Zapier/webhook
    automation access specifically, not necessarily the same gate as the
    plain API-key REST access documented above (that article named no
    tier restriction) — worth treating those as two separate access
    questions when checking the shop's actual plan, not one.
- **RepairDesk supports customizable ticket "Workflows."** Shops define
  their own sequence of statuses per repair type, tied to actions like
  generating an estimate, requiring customer approval, or triggering
  warranty/RMA handling (still `WebSearch`-snippet sourced, not yet
  confirmed by a direct KB read).
- **Pricing tiers found** (still `WebSearch`-snippet sourced): Essential
  ($99/store/month), Growth ($149/store/month), Advanced (custom quote) —
  plus "Enterprise" now confirmed to exist as a named tier above those,
  per the Zapier KB article above.

## What's genuinely still unconfirmed

- **Whether the plain API-key REST access above requires a specific
  pricing tier at all**, versus the Zapier/webhook-automation tier gate
  found above. The API-key KB article named no restriction, but that's an
  absence of evidence, not confirmation it's unrestricted on every plan.
  This shop's current plan/tier is also still unknown to this repo.
- **The shop's default/actual ticket workflow stages and current plan
  tier.** Both require looking at the shop's own logged-in RepairDesk
  account, not further web research.
- **Exact REST endpoint paths and payload shapes** for tickets, invoices,
  and inventory under `https://api.repairdesk.co/api/web/v1/` — the base
  URL, auth, and rate limit are now confirmed, but not the actual resource
  paths (e.g., is it `/tickets`, `/ticket/list`, something else) or
  request/response JSON shapes. `api-docs.repairdesk.co` (still 403 from
  this sandbox) is almost certainly where these live.
- **Whether a plain (non-Zapier) webhook mechanism exists** for the
  RepairDesk API directly — everything confirmed above about "Ticket
  Status Change" events came through the Zapier integration layer, not a
  documented raw webhook endpoint/payload from RepairDesk itself.
- **Inventory API specifics.** Zapier confirms "Inventory Updated" and
  "New Inventory Item" exist as events, which implies inventory read
  access, but whether the raw API supports writing stock counts (not just
  reading), stock-by-location, or item structure detailed enough to
  replace this site's `retail_items` table is still unknown.
- **Barcode/label and QR support.** RepairDesk (or its predecessor
  product, RepairShopr) is known to print barcode labels for tickets/
  customers/assets/products via companion software, but nothing confirms
  a ticket-facing QR/URL flow like the one sketched in `TODO.md` §8.1.

## How this connects to what's already in TODO.md

- **§5** (open assumption / Tier 1–2 notes): already documents the
  owners-vs-GM tension and flags that real appointment booking against the
  shop's actual system means RepairDesk, not a bespoke `bookings` table.
- **§8** (warehouse workflow brainstorm — scannable stages, ticket
  tracking, FIFO parts backorder): flagged as needing a "check RepairDesk
  first" pass before building independently, since a workflow/status engine
  and vendor-linked parts ordering may already exist there.

## Two open paths (not decided here)

1. **Integrate**: build against RepairDesk's Public API — pull real ticket
   status into `/track`, and/or push repair events into RepairDesk's
   configured workflow. Preserves the owners' vendor-integration value,
   avoids duplicating ticket/inventory data entry. Blocked on: getting API
   credentials, confirming the tier includes API access, and reading the
   real docs (not just search snippets).
2. **Stay independent**: keep building this site's own Supabase-backed
   booking/stock/ticket system (the `TODO.md` §8 direction), accepting that
   it will never be the shop's system of record and staff will be entering
   data in two places. Lower integration risk, but doesn't resolve the
   underlying "two systems, one shop" problem — and duplicates work
   RepairDesk may already do.

Next concrete step, whenever the user is ready: log into the shop's actual
RepairDesk account, generate the API key (Store → General Settings →
"Other Information"), and note the shop's current plan/tier while there —
that resolves the two biggest remaining unknowns (real workflow stages,
real plan tier) at the source. Reading `api-docs.repairdesk.co` from a
real browser (it 403s this sandbox but is a normal public docs site) would
fill in exact endpoint paths/payloads for tickets, invoices, and
inventory — the base URL, auth, and rate limit are already confirmed
above, so that read would mostly be resource-path/schema detail, not a
blocker to starting.
