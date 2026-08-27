import { createClient } from "@supabase/supabase-js";
import { RETAIL_ITEMS as SEED_ITEMS, type RetailItem } from "./retail-data";

/**
 * Real, owner-editable stock counts for /retail and the Vapi `check_stock`
 * tool — replaces the old "hand-edited TS file" demo data with a real
 * Supabase table, same pattern as booking-store.ts. Reuses the exact same
 * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars already required for
 * bookings — no new secret needed to turn this on.
 *
 * Table setup (run once in the Supabase SQL editor):
 *
 *   create table retail_items (
 *     id text primary key,
 *     name text not null,
 *     category text not null,
 *     condition text,
 *     price integer not null,
 *     stock jsonb not null default '{}'::jsonb,
 *     sort_order integer not null default 0
 *   );
 *
 * `stock` is a JSON object keyed by location slug (see locations.ts),
 * e.g. {"arnold": 3, "ballwin": 1} — matches RetailItem.stock exactly, so
 * fromRow/toRow below don't need to reshape it, and it stays extensible
 * to a third location (Affton) without a schema change.
 *
 * Seed data (paste after creating the table above, to start with the
 * same numbers the old static demo data had — edit freely afterward
 * directly in Supabase's table editor, no code or redeploy needed):
 *
 *   insert into retail_items (id, name, category, condition, price, stock, sort_order) values
 *     ('iphone-12-refurb', 'iPhone 12 (Refurbished)', 'phone', 'Excellent', 299, '{"arnold":3,"ballwin":1}', 0),
 *     ('iphone-13-refurb', 'iPhone 13 (Refurbished)', 'phone', 'Good', 379, '{"arnold":0,"ballwin":2}', 1),
 *     ('galaxy-s21-refurb', 'Samsung Galaxy S21 (Refurbished)', 'phone', 'Excellent', 249, '{"arnold":2,"ballwin":0}', 2),
 *     ('galaxy-s22-refurb', 'Samsung Galaxy S22 (Refurbished)', 'phone', 'Good', 329, '{"arnold":1,"ballwin":4}', 3),
 *     ('ipad-9-refurb', 'iPad 9th Gen (Refurbished)', 'phone', 'Fair', 229, '{"arnold":0,"ballwin":0}', 4),
 *     ('usb-c-charger', 'USB-C Fast Charger', 'accessory', null, 19, '{"arnold":12,"ballwin":8}', 5),
 *     ('screen-protector', 'Tempered Glass Screen Protector', 'accessory', null, 12, '{"arnold":20,"ballwin":15}', 6),
 *     ('wireless-charger', 'Wireless Charging Pad', 'accessory', null, 24, '{"arnold":5,"ballwin":0}', 7),
 *     ('phone-case', 'Phone Case (Universal Fit)', 'accessory', null, 15, '{"arnold":30,"ballwin":25}', 8);
 *
 * Until the table exists (or is empty), everything here falls back to
 * the static SEED_ITEMS from retail-data.ts — /retail and check_stock
 * keep working, they just show the honest "demo data" note instead of
 * pretending it's live.
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = url && key ? createClient(url, key) : null;

if (!supabase) {
  console.warn(
    "[retail-store] No Supabase configured (SUPABASE_URL / " +
      "SUPABASE_SERVICE_ROLE_KEY) — /retail and check_stock are serving " +
      "the static demo catalog from retail-data.ts. Create the " +
      "`retail_items` table (see this file's header comment) and set " +
      "the env vars in Vercel to make stock real and owner-editable."
  );
}

/** snake_case row shape as stored in Postgres — 1:1 with RetailItem otherwise. */
interface RetailItemRow {
  id: string;
  name: string;
  category: string;
  condition: string | null;
  price: number;
  stock: Record<string, number>;
  sort_order: number;
}

function fromRow(row: RetailItemRow): RetailItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as RetailItem["category"],
    condition: (row.condition as RetailItem["condition"]) ?? undefined,
    price: row.price,
    stock: row.stock ?? {},
  };
}

export interface RetailItemsResult {
  items: RetailItem[];
  /** True only if this result actually came from Supabase, not the static fallback. */
  durable: boolean;
}

/**
 * Real, current stock — reads Supabase if configured and the table has
 * rows, otherwise falls back to the static demo catalog. Never throws:
 * a Supabase error degrades to the fallback rather than breaking
 * /retail or a live phone call over an infra hiccup.
 *
 * Returns `{ items, durable }` together (rather than a separate
 * `isDurable()` getter reading some cached module state) on purpose —
 * this runs inside concurrent server requests, and a shared mutable
 * "was the last call durable" flag would be a real race: one request's
 * result could read a flag another concurrent request just overwrote.
 */
export async function getRetailItems(): Promise<RetailItemsResult> {
  if (!supabase) {
    return { items: SEED_ITEMS, durable: false };
  }

  const { data, error } = await supabase
    .from("retail_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(
      "[retail-store] Supabase read failed, falling back to demo data:",
      error.message
    );
    return { items: SEED_ITEMS, durable: false };
  }

  if (!data || data.length === 0) {
    // Table exists but hasn't been seeded yet — same honest fallback.
    return { items: SEED_ITEMS, durable: false };
  }

  return { items: (data as RetailItemRow[]).map(fromRow), durable: true };
}

export type UpdateStockResult = { ok: true } | { ok: false; error: string };

/**
 * Writes a real stock update — powers the editor at /management/stock.
 * Only ever touches the `stock` column of one row; name/category/
 * condition/price stay a Supabase-table-editor task (see TODO.md §5
 * Tier 2), since those change far less often than counts do.
 */
export async function updateItemStock(
  itemId: string,
  stock: Record<string, number>
): Promise<UpdateStockResult> {
  if (!supabase) {
    return {
      ok: false,
      error: "Supabase isn't configured on this deployment yet.",
    };
  }

  for (const [slug, count] of Object.entries(stock)) {
    if (!Number.isInteger(count) || count < 0) {
      return {
        ok: false,
        error: `"${slug}" count must be a whole number, 0 or more.`,
      };
    }
  }

  const { error } = await supabase
    .from("retail_items")
    .update({ stock })
    .eq("id", itemId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
