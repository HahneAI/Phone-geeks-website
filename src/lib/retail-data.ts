/**
 * Static demo data for the retail "in stock" preview — a real version of
 * this would sync live counts from the shop's POS/inventory system rather
 * than being hand-edited here. See TODO.md §4.3.
 */

export type Condition = "Excellent" | "Good" | "Fair";

export interface RetailItem {
  id: string;
  name: string;
  category: "phone" | "accessory";
  condition?: Condition;
  price: number;
  /** Unit count per store location slug (see src/lib/locations.ts). */
  stock: Record<string, number>;
}

export const RETAIL_ITEMS: RetailItem[] = [
  {
    id: "iphone-12-refurb",
    name: "iPhone 12 (Refurbished)",
    category: "phone",
    condition: "Excellent",
    price: 299,
    stock: { arnold: 3, ballwin: 1 },
  },
  {
    id: "iphone-13-refurb",
    name: "iPhone 13 (Refurbished)",
    category: "phone",
    condition: "Good",
    price: 379,
    stock: { arnold: 0, ballwin: 2 },
  },
  {
    id: "galaxy-s21-refurb",
    name: "Samsung Galaxy S21 (Refurbished)",
    category: "phone",
    condition: "Excellent",
    price: 249,
    stock: { arnold: 2, ballwin: 0 },
  },
  {
    id: "galaxy-s22-refurb",
    name: "Samsung Galaxy S22 (Refurbished)",
    category: "phone",
    condition: "Good",
    price: 329,
    stock: { arnold: 1, ballwin: 4 },
  },
  {
    id: "ipad-9-refurb",
    name: "iPad 9th Gen (Refurbished)",
    category: "phone",
    condition: "Fair",
    price: 229,
    stock: { arnold: 0, ballwin: 0 },
  },
  {
    id: "usb-c-charger",
    name: "USB-C Fast Charger",
    category: "accessory",
    price: 19,
    stock: { arnold: 12, ballwin: 8 },
  },
  {
    id: "screen-protector",
    name: "Tempered Glass Screen Protector",
    category: "accessory",
    price: 12,
    stock: { arnold: 20, ballwin: 15 },
  },
  {
    id: "wireless-charger",
    name: "Wireless Charging Pad",
    category: "accessory",
    price: 24,
    stock: { arnold: 5, ballwin: 0 },
  },
  {
    id: "phone-case",
    name: "Phone Case (Universal Fit)",
    category: "accessory",
    price: 15,
    stock: { arnold: 30, ballwin: 25 },
  },
];

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export function getStockStatus(count: number): StockStatus {
  if (count <= 0) return "out-of-stock";
  if (count <= 2) return "low-stock";
  return "in-stock";
}
