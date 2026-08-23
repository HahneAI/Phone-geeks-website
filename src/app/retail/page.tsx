import type { Metadata } from "next";
import { RetailHero } from "@/components/retail/retail-hero";
import { InventoryNote } from "@/components/retail/inventory-note";
import { RetailGrid } from "@/components/retail/retail-grid";

export const metadata: Metadata = {
  title: "Shop Refurbished | Phone Geeks",
  description:
    "Browse refurbished phones, tablets, and accessories at Phone Geeks — see what's in stock at each St. Louis location.",
};

export default function RetailPage() {
  return (
    <>
      <RetailHero />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <InventoryNote />
        <RetailGrid />
      </div>
    </>
  );
}
