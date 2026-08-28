# Custom Item-ID / QR-Tagging / Bin-Routing System — Fit Against RepairDesk

Companion to `owners-current-flow.md` (RepairDesk API/capabilities) and
`TODO.md` §8 (Warehouse Workflow brainstorm). Owner's plan, described
2026-08-28: every item/part in the storage room gets a custom-generated ID
on receipt, a cheap barcode/QR label gets printed and physically attached
to the package, and the system then routes staff to a specific storage bin
— identified by a wall letter + a storage-type number (e.g. all C-type
chargers → **B13**) — without anyone having to remember or look it up by
hand.

**Gap flagged up front**: this doc references "the rough deciding formula
for each item type" as already decided, but it isn't written down anywhere
in this repo (checked `TODO.md`, `owners-current-flow.md`,
`vapi-*.md` — no hits). It only exists in a prior conversation this repo
doesn't have access to. Whoever picks this up next should get that formula
committed somewhere real (this file, or its own) rather than letting it
live only in chat history — everything below is written so it's still
useful without the exact formula, but the actual build can't start without
it.

---

## 1. What RepairDesk already has, confirmed from its own docs (2026-08-28)

Read directly from `help.repairdesk.co` and a `WebSearch`-surfaced RepairDesk
user forum post — not the still-403'd `api-docs.repairdesk.co`, so treat
the *API-exposure* half of each item below as separately unconfirmed even
where the *feature* itself is confirmed.

- **A native "Physical Location" field already exists on inventory items**,
  and it's a strikingly close match to the owner's own plan. A RepairDesk
  user's own feature-request thread describes exactly the owner's scheme
  independently: *"2 racks in the backroom, each rack has 6 shelves, each
  shelf has 5 boxes... If the location says 2C5, it could be read as the
  2nd rack (2), 3rd shelf up (C), and the 5th box over (5)"* — same
  letter+number bin-code idea as "B13" for C-type chargers. RepairDesk's
  actual implementation, per that same source: **a single free-text input
  box per item**, not a structured bin catalog — you type "B13" in and
  that's the whole feature. It shows up on service receipts and on
  transfer orders, and transfer-order line items can be **sorted
  alphanumerically by that location string** — useful for "walk the
  backroom in bin order," but RepairDesk itself has no concept of "B13 is
  full" or "B13 is where C-type chargers go" — it's a label, not a rules
  engine. **That mapping logic (item type → bin code) has to live
  somewhere else regardless of which system stores the final value** —
  this site's own code is the natural home for it, formula-driven exactly
  like the owner's plan already assumes.
- **Native SKU/UPC auto-generation exists**, trigger-based: enable it,
  set a pattern (a predefined format, or a custom one via "Others"), and
  RepairDesk generates the SKU/UPC on item creation. **Unconfirmed**:
  whether the pattern can vary by item category/type (the search snippet
  read as one account-wide pattern, not a per-type formula) — if so, this
  is not a drop-in replacement for "the rough deciding formula for each
  item type," which sounds explicitly per-type. Recommendation below
  keeps the formula on this site's side rather than trying to bend
  RepairDesk's generator to match it.
- **Native label printing exists and is barcode-based, not QR.** Item →
  "Print Label" button → PDF → send to printer. The one confirmed barcode
  symbology is **Code 128** (stated for RepairDesk's "Professional"
  template); nothing in the docs read this pass mentions QR as an
  available label type. **Recommended/default hardware is a DYMO
  LabelWriter 450** direct-thermal printer (no ink/toner — just label
  rolls), configured in RepairDesk for either a ~1"×2⅛" or 1.5"×3.5"
  label — but the docs are explicit it's a *recommendation*, not the only
  supported printer; other printers work via PrintNode for
  network/automatic printing.
- **Serialized vs. non-serialized inventory are handled differently** —
  RepairDesk's barcode/label flow for serialized items (each physical unit
  individually tracked) is a separate documented path from the bulk/SKU-
  level flow. This matters directly for the owner's plan: "each individual
  item... gets a new custom ID" reads as wanting **unit-level identity**
  (two identical USB-C chargers are two different tracked things), which
  is RepairDesk's *serialized* inventory mode, not its default SKU-count
  mode — worth confirming that's really the intent before assuming either
  mode on the real account.

## 2. What's still unconfirmed and needs the real account (not more web research)

- **Whether the "Physical Location" field is exposed via the Public REST
  API at all** — readable, writable, or both. Everything found this pass
  about it came from the UI/receipts/transfer-order side, not the API
  reference (still 403'd from this sandbox). This is the single most
  important unconfirmed fact for the "system automatically routes you to
  the bin" half of the plan, if RepairDesk is meant to be the system of
  record for it — without API write access to that field, this site could
  compute the right bin but never get it to show up on a RepairDesk
  receipt automatically.
- **Whether SKU or serial number is API-writable at item-creation time**
  — i.e., can this site's own custom-ID formula supply the authoritative
  ID into RepairDesk, or does RepairDesk insist on generating/owning that
  value itself once its auto-generation trigger is on.
- **Whether the Zapier "New Inventory Item" / "Inventory Updated" triggers
  (confirmed to exist in `owners-current-flow.md`'s research) include the
  Physical Location field in their payload** — relevant if the eventual
  design reacts to "item received" as an event rather than polling.
- **The shop's actual current plan/tier** (still unknown, same gap flagged
  in `owners-current-flow.md`) — worth checking alongside the above, since
  API write access to custom-ish fields like Physical Location is exactly
  the kind of thing that could be tier-gated even where basic read access
  isn't.

## 3. Cheap QR/barcode generation and printing — general market notes

This part is ordinary hardware/software knowledge, not sourced from a live
fetch this session — treat prices as ballpark, worth a five-minute real
check before buying anything:

- **Generating the code itself is free either way.** `TODO.md` §8.1
  already settled on the `qrcode` npm library (server-side, zero cost, no
  external API) for exactly this reason — a QR code is just a picture, and
  every phone's stock camera app reads one with zero setup, unlike a 1D
  barcode which usually needs a dedicated scanner or a scanning *app*
  (not the plain Camera app) to decode reliably. Since RepairDesk's own
  label templates only do Code 128 barcodes (see §1), the cheapest and
  most staff-friendly path is almost certainly to **keep generating the
  QR independently** (as §8.1 already planned) rather than trying to make
  RepairDesk's built-in label flow produce one.
- **Printing it cheaply**: a direct-thermal label printer is the standard
  cheap option here — no ink/toner, just the label roll, and this is the
  same category RepairDesk itself recommends (DYMO LabelWriter 450). A
  direct-thermal printer prints whatever raster/PDF image you send it, so
  a self-generated QR label doesn't depend on RepairDesk's label templates
  at all — it can be a plain PDF/image built by this site's own code and
  sent to any such printer.
- **Rough price shape** (verify current pricing before buying): small
  desktop direct-thermal label printers commonly run **roughly $50–150**,
  with label rolls a small recurring cost (cents per label, no ink). This
  is squarely "as cheap as possible" territory already, before any
  RepairDesk-specific hardware consideration — the owner's stated goal
  doesn't need anything fancier than this class of printer.

## 4. Recommended shape (synthesis — not decided here, just laid out)

This keeps working whichever way the bigger "integrate vs. stay
independent" RepairDesk question in `owners-current-flow.md` eventually
resolves, since the core routing logic doesn't depend on RepairDesk at
all:

1. **Keep the item-type → bin-code mapping and the custom-ID formula on
   this site's own side** (once the formula itself is actually committed
   somewhere, per the gap flagged at the top). A simple lookup table —
   item type/category → wall letter + storage-type number — is all "C-type
   chargers → B13" needs; nothing here requires RepairDesk's cooperation.
2. **On receiving a new item**: this site's code computes the custom ID
   and looks up the target bin from that table, generates a QR (via
   `qrcode`, matching the approach already chosen in `TODO.md` §8.1)
   encoding a link back to that item's record (e.g.
   `/management/inventory/<id>`), and shows/prints a one-page label with
   the QR, the custom ID, and the bin code all human-readable on it.
3. **Print on a cheap direct-thermal label printer**, physically attach to
   the package — same real-world "someone has to do this by hand" step
   §8.1 already calls out for ticket labels.
4. **If/when RepairDesk integration is decided**: push the same custom ID
   and bin code into RepairDesk via its inventory API (SKU and/or Physical
   Location fields) once §2's API-write questions are answered on the real
   account — so a tech looking at a RepairDesk receipt or transfer order
   sees the identical bin code this site's own QR-linked page shows,
   rather than two systems disagreeing about where something is.
5. **The "system automatically routes you to the bin" experience is pure
   app logic** (a lookup table plus a page render) that exists independent
   of RepairDesk either way — safe to build now without waiting on the
   owners/GM RepairDesk decision, since it's useful under both the
   "integrate" and "stay independent" paths from `owners-current-flow.md`.

## 5. Open questions worth resolving before building

- **Get "the rough deciding formula for each item type" committed to the
  repo** (this file or a new one) — right now it only exists outside this
  codebase's memory.
- **Unit-level vs. type-level identity**: does every physical charger get
  its own unique ID (serialized), or just every *kind* of charger
  (SKU-level, with a plain count)? This decides which RepairDesk inventory
  mode (if integrating) and which data shape (if independent) is correct.
- **How many distinct bin codes/wall letters actually exist** — worth
  nailing down the real, finite list (walls × storage-type numbers) now,
  since that's the lookup table §4 needs and it's a business fact, not a
  technical one.
