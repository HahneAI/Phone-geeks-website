import { handleVapiTools, type VapiToolCall } from "@/lib/vapi";
import { RETAIL_ITEMS, getStockStatus, type RetailItem } from "@/lib/retail-data";
import { LOCATIONS } from "@/lib/locations";

/**
 * Same word-overlap matching a voice caller's phrasing needs to survive
 * ("iPhone 13" vs. the catalog's "iPhone 13 (Refurbished)") — reads the
 * exact RETAIL_ITEMS array that /retail renders, so this can never answer
 * differently than the website does.
 */
function findItem(query: string): RetailItem | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const exact = RETAIL_ITEMS.find((item) => item.name.toLowerCase() === q);
  if (exact) return exact;

  const qWords = q.split(/\s+/);
  let best: RetailItem | null = null;
  let bestScore = 0;
  for (const item of RETAIL_ITEMS) {
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

function checkStock(call: VapiToolCall) {
  const { item_name, location } = call.arguments;
  const item = findItem(String(item_name ?? ""));

  if (!item) {
    return `I couldn't find a demo catalog match for "${item_name}". We carry refurbished iPhones, Galaxy phones, an iPad, and accessories like chargers, screen protectors, and cases — could you say the item again?`;
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
    note: "This is demo stock data, not a live inventory feed.",
  };
}

export async function POST(req: Request) {
  return handleVapiTools(req, checkStock);
}
