@AGENTS.md

# Reference: the shop's real POS/CRM

The shop runs its actual ticketing and inventory on **RepairDesk**, not on
this site's own `bookings`/`retail_items` tables. Before building anything
around real repair-ticket status, workflow stages, or inventory sourced from
the shop's real system, read `owners-current-flow.md` at the repo root — it
documents what's known (and explicitly what's still unconfirmed) about
RepairDesk's API, and how it relates to the `TODO.md` §5/§8 roadmap items.
