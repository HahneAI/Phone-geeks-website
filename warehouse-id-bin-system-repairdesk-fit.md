# Custom Item-ID / QR-Tagging / Bin-Routing System — Fit Against RepairDesk

Companion to `owners-current-flow.md` (RepairDesk API/capabilities) and
`TODO.md` §8 (Warehouse Workflow brainstorm). Owner's plan, described
2026-08-28: every item/part in the storage room gets a custom-generated ID
on receipt, a cheap barcode/QR label gets printed and physically attached
to the package, and the system then routes staff to a specific storage bin
— identified by a wall letter + a storage-type number (e.g. all C-type
chargers → **B13**) — without anyone having to remember or look it up by
hand.

**Update, 2026-08-28**: the owner supplied a photo of the running-draft
formula from a paper notebook. Captured here verbatim (current best draft,
still subject to change) so it lives in the repo instead of only in a
photo:

### The unit-ID formula (current draft)

An earlier draft (`MMDD-cat#-store#`) is crossed out in the notebook in
favor of:

```
cat# - brand# - condition - MMDDYY
```

- **`cat#`** — category number (a lookup code per item category/type,
  e.g. "chargers," "screens," "batteries" — the actual category→number
  table isn't written down yet, just the slot for it).
- **`brand#`** — brand number (a lookup code per brand, e.g. Apple,
  Samsung — same status: the slot exists, the actual brand→number table
  doesn't yet).
- **`condition`** — new vs. refurbished, encoded as a single digit (the
  worked example uses `1` for new; refurb's digit isn't confirmed yet —
  presumably `2`, not yet written down).
- **`MMDDYY`** — the date the item **reached the store** (not order date,
  not manufacture date — explicitly "reached store" per the note).

**Worked example from the notebook**: a USB-C charger by Apple, new,
received today → **`11-2-1-082826`** — read as category 11, brand 2,
condition 1 (new), reached store 08/28/26.

**Still open / not yet decided** (flagging so the next pass on this
doesn't have to re-derive it):
- The full category→number and brand→number lookup tables (only the
  *slot* for a number is decided, not the actual mapping — this is
  exactly the kind of lookup table §4 below already proposed keeping on
  this site's own side).
- The condition digit for anything other than "new" (refurb confirmed as
  a state that needs a digit; whether there are more states — e.g. "used,
  working" vs. "used, for parts" — isn't settled).
- Whether this 4-part string *is* the printed/scanned ID as-is, or gets
  compressed/re-encoded before going on a label — nothing in the note
  addresses this yet.
- This formula produces one ID per **item type/batch as received on a
  given day**, not automatically one per physical unit — e.g. two USB-C
  Apple chargers arriving new on the same day would compute to the *same*
  string under this formula. Worth deciding explicitly whether that's
  intended (SKU/batch-level identity — matches RepairDesk's default,
  non-serialized inventory mode) or whether a per-unit suffix still needs
  adding (matches RepairDesk's serialized mode) — this is the same
  unit-level-vs-type-level question already flagged in §5 below, now with
  a concrete formula to test it against.

### Storage-location types (new detail from the same notebook page)

Locations aren't just a flat bin code — they have **types**: off the top
of the owner's head, **shelf**, **bin**, and **binder**. A shelf can
directly hold loose items, or hold a bin or a binder as a sub-container
sitting on that shelf slot. This is a real hierarchy (shelf → optionally
contains a bin or binder → contains items), not a flat list of codes —
worth designing the lookup table in §4 with that nesting in mind (a
location's *type* determines whether it's a leaf you put items straight
into, or a slot that itself contains another typed location), rather than
assuming every bin code names the final container.

**Everything below this point was written before the formula/location-type
update above** — re-read with the new formula and the shelf/bin/binder
hierarchy in mind, since some framing (e.g. "the exact formula" as an
unknown) is now partly superseded.

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

1. **Keep the category→number, brand→number, and item-type→bin-code
   lookup tables on this site's own side.** The formula in the update
   above already assumes exactly this (a `cat#` and `brand#` have to come
   from *some* table), so this isn't a new decision — it's the same
   lookup-table approach, just now with three tables instead of one
   (category codes, brand codes, category→bin routing) plus the
   shelf/bin/binder hierarchy from the same note. Nothing here requires
   RepairDesk's cooperation.
2. **Model storage locations as the real hierarchy described, not a flat
   code list**: a location has a `type` (`shelf` | `bin` | `binder`), an
   optional `parentLocationId` (a bin or binder can sit inside a shelf
   slot), and a human-facing code (the "B13"-style string). Routing logic
   resolves "C-type chargers" to a *leaf* location — which might be a bin
   sitting on a shelf, or a shelf slot holding loose items directly — not
   just a bare letter+number string with no structure behind it.
3. **On receiving a new item**: this site's code computes the unit ID from
   the `cat#-brand#-condition-MMDDYY` formula (looking up `cat#` and
   `brand#` from their tables, condition from a fixed new/refurb — and
   whatever else gets added — enum, and `MMDDYY` from the actual date it
   reached the store), looks up the target leaf location from the
   category→bin table, generates a QR (via `qrcode`, matching the approach
   already chosen in `TODO.md` §8.1) encoding a link back to that item's
   record (e.g. `/management/inventory/<id>`), and shows/prints a
   one-page label with the QR, the unit ID, and the resolved location
   (e.g. "Shelf A2 → Bin B13") all human-readable on it. **Open design
   call, not yet resolved**: since the formula as drafted computes the
   same string for two identical units received the same day (see the
   note above), decide whether the *printed/scanned* ID appends a
   per-unit disambiguator (e.g. a running suffix) even if the underlying
   formula stays batch-level, before this step gets built.
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

- **The category→number and brand→number lookup tables** — the formula
  now has a defined shape, but the actual tables mapping real categories
  ("chargers," "screens," ...) and real brands to their numbers don't
  exist yet anywhere. This is the top remaining blocker to actually
  computing an ID.
- **The condition digit set** — `1` = new is confirmed; refurb's digit and
  whether more states exist (used-working, used-for-parts, etc.) isn't.
- **Unit-level vs. type-level identity** (now concrete, not hypothetical):
  the formula as drafted produces identical strings for two same-day,
  same-category-and-brand, same-condition units — decide whether that's
  intentional (batch/SKU-level identity) or needs a per-unit
  disambiguator appended before printing. This also decides which
  RepairDesk inventory mode (serialized vs. not) fits, if integrating.
- **The shelf/bin/binder hierarchy's real, finite structure** — how many
  walls, how many shelf slots per wall, which slots hold a bin vs. a
  binder vs. loose items directly. This is a business fact to walk the
  actual storage room and record, not a technical one, and it's the data
  the location lookup table in §4 needs.
- **How location *codes* actually get assigned to shelf vs. bin vs.
  binder** — is "B13" always a bin code specifically, with shelves and
  binders getting their own separate coding pattern, or is it one shared
  code space across all three types? Not yet decided in the notebook
  draft.
