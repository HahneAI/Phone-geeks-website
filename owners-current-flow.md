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

**`repairdesk.co` and all of its subdomains (`api-docs.repairdesk.co`,
`docs.repairdesk.co`, `blog.repairdesk.co`) are blocked by this sandbox's
egress policy.** Every direct fetch attempt returned `EGRESS_BLOCKED`. That
mirrors the same restriction already documented in
`vapi-front-desk-agent-brief.md` for `docs.vapi.ai`.

Everything below came from `WebSearch` result snippets only — **not** from
reading RepairDesk's primary documentation directly. Search snippets are
secondhand, sometimes stale, and can miss nuance a real doc page would show.
Treat every claim below as "worth verifying with RepairDesk support or a
RepairDesk-logged-in account," not as confirmed fact. Where I couldn't find
an answer at all, I've said so explicitly rather than guessing.

## What's reasonably well supported by search results

- **RepairDesk has a Public API.** It's described as covering **tickets,
  invoices, and inventory** as core modules, plus **webhook support** for
  push notifications of events (vs. polling).
- **API access requires an active RepairDesk account and API
  credentials** (an API key, tied to the store's account) — this is
  consistent with how most SaaS POS/CRM platforms gate their APIs.
- **Official API docs live at `api-docs.repairdesk.co`** — this URL exists
  and is referenced by RepairDesk's own marketing, but is unreachable from
  this sandbox. Whoever picks this up next should read it directly from a
  browser, not rely on this doc.
- **RepairDesk supports customizable ticket "Workflows."** Shops can define
  their own sequence of statuses per repair type, and tie status changes to
  actions like generating an estimate, requiring a customer approval, or
  triggering warranty/RMA handling. This is significant for `TODO.md` §8:
  it suggests RepairDesk may **already have a ticket-status/stage concept**
  that could stand in for the "scannable stage transitions" idea, rather
  than this site needing to invent one from scratch.
- **Pricing tiers found**: Essential ($99/store/month), Growth
  ($149/store/month), Advanced (custom quote). API access is described as
  part of the "support and enablement" feature set that varies by tier.

## What's genuinely unconfirmed

- **Which pricing tier(s) actually include API access.** Search results
  describe API access as tier-dependent but never named which specific tier
  is the floor. This shop's current plan/tier is also unknown to this repo.
- **The shop's default/actual ticket workflow stages.** RepairDesk workflows
  are shop-configurable, not a fixed universal list — so there's no way to
  know from search alone whether this shop's real workflow already has
  something like "Waiting on Parts" as a named stage. This has to come from
  looking at the shop's own RepairDesk account.
- **Exact API shape.** No confirmed endpoint paths, authentication header
  format, request/response payloads, or rate limits. No confirmed webhook
  event names (e.g., whether a "ticket status changed" event actually
  exists and what it's called).
- **Inventory API specifics.** Whether RepairDesk's inventory module could
  directly replace/feed this site's `retail_items` Supabase table (item
  structure, stock-by-location support, whether it's read-only or
  read-write via API) is unknown.
- **Barcode/label and QR support.** RepairDesk (or its predecessor product,
  RepairShopr) is known to print barcode labels for tickets/customers/
  assets/products via companion software, but nothing confirms a
  ticket-facing QR/URL flow like the one sketched in `TODO.md` §8.1.

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

Next concrete step, whenever the user is ready: get RepairDesk API
credentials (or at least confirm what the current plan includes) and read
`api-docs.repairdesk.co` directly — that single step would upgrade most of
the "unconfirmed" section above to verified fact.
