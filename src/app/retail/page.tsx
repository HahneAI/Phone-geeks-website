import type { Metadata } from "next";
import { RetailHero } from "@/components/retail/retail-hero";
import { InventoryNote } from "@/components/retail/inventory-note";
import { RetailGrid } from "@/components/retail/retail-grid";
import { getRetailItems } from "@/lib/retail-store";

export const metadata: Metadata = {
  title: "Shop Refurbished | Phone Geeks",
  description:
    "Browse refurbished phones, tablets, and accessories at Phone Geeks — see what's in stock at each St. Louis location.",
};

// Stock counts are real now (see src/lib/retail-store.ts) but don't need
// millisecond freshness on a public marketing page — a short revalidate
// window keeps this fast without hammering Supabase on every visit.
export const revalidate = 60;

export default async function RetailPage() {
  const { items, durable } = await getRetailItems();

  return (
    <>
      <RetailHero />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <InventoryNote durable={durable} />
        <RetailGrid items={items} />
      </div>
    </>
  );
}
