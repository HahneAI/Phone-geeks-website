import { handleVapiTools, type VapiToolCall } from "@/lib/vapi";
import { getStockStatus, type RetailItem } from "@/lib/retail-data";
import { getRetailItems } from "@/lib/retail-store";
import { LOCATIONS } from "@/lib/locations";

/**
 * Same word-overlap matching a voice caller's phrasing needs to survive
 * ("iPhone 13" vs. the catalog's "iPhone 13 (Refurbished)") — matched
 * against whatever getRetailItems() returns (real Supabase stock if
 * configured, the static demo catalog otherwise — see
 * src/lib/retail-store.ts), so this can never answer differently than
 * /retail does.
 */
function findItem(items: RetailItem[], query: string): RetailItem | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const exact = items.find((item) => item.name.toLowerCase() === q);
  if (exact) return exact;

  const qWords = q.split(/\s+/);
  let best: RetailItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    const name = item.name.toLowerCase();
    const score = qWords.filter((w) => name.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore > 0 ? best : null;
}

function resolveLocations(location: unknown): string[] {
  const slug = String(location ?? "").toLowerCase();
  if (slug === "arnold" || slug === "ballwin") return [slug];
  return LOCATIONS.map((l) => l.slug); // "both" or unspecified
}

async function checkStock(call: VapiToolCall) {
  const { item_name, location } = call.arguments;
  const query = String(item_name ?? "").trim();
  const { items, durable } = await getRetailItems();
  const item = findItem(items, query);

  if (!item) {
    return query
      ? `I couldn't find a catalog match for "${query}". We carry refurbished iPhones, Galaxy phones, an iPad, and accessories like chargers, screen protectors, and cases — could you say the item again?`
      : "I didn't catch which item you're asking about — could you say the product name again?";
  }

  const breakdown = resolveLocations(location).map((slug) => {
    const loc = LOCATIONS.find((l) => l.slug === slug);
    const count = item.stock[slug] ?? 0;
    return { location: loc?.name ?? slug, count, status: getStockStatus(count) };
  });

  return {
    item: item.name,
    price: item.price,
    condition: item.condition ?? null,
    stockByLocation: breakdown,
    note: durable
      ? "Live stock count from the shop's own inventory table."
      : "This is demo stock data, not a live inventory feed — Supabase isn't configured on this deployment yet.",
  };
}

export async function POST(req: Request) {
  return handleVapiTools(req, checkStock);
}
