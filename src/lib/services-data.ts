import {
  Smartphone,
  Laptop,
  Tablet,
  Gamepad2,
  Recycle,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface RepairItem {
  name: string;
  priceRange: string;
  turnaround: string;
}

export interface ServiceCategory {
  slug: string;
  icon: LucideIcon;
  title: string;
  /** Natural-language name for use in a sentence, e.g. "your {shortLabel}" */
  shortLabel: string;
  description: string;
  repairs: RepairItem[];
  note?: string;
  /** Overrides for categories with no repair list (e.g. Retail links to /retail, not /estimate). */
  ctaHref?: string;
  ctaLabel?: string;
  ctaBody?: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    slug: "smartphone",
    icon: Smartphone,
    title: "Smart Phone Repair",
    shortLabel: "phone",
    description:
      "Cracked screens, dead batteries, and everything in between — most phones fixed same day.",
    repairs: [
      { name: "Screen Repair", priceRange: "$79 – $249", turnaround: "~45 min" },
      { name: "Battery Replacement", priceRange: "$49 – $89", turnaround: "~30 min" },
      { name: "Charging Port Repair", priceRange: "$59 – $99", turnaround: "~40 min" },
      { name: "Camera Replacement", priceRange: "$69 – $129", turnaround: "~40 min" },
      { name: "Speaker / Mic Repair", priceRange: "$49 – $89", turnaround: "~30 min" },
      { name: "Water Damage Diagnostic", priceRange: "Free diagnostic", turnaround: "24–72 hrs" },
    ],
  },
  {
    slug: "computer",
    icon: Laptop,
    title: "Macbook & Computer Repair",
    shortLabel: "computer",
    description:
      "Hardware and software repair for Mac and Windows laptops and desktops.",
    repairs: [
      { name: "Screen Replacement", priceRange: "$150 – $350", turnaround: "1–2 days" },
      { name: "Battery Replacement", priceRange: "$99 – $179", turnaround: "Same day" },
      { name: "Keyboard / Trackpad Repair", priceRange: "$89 – $199", turnaround: "1 day" },
      { name: "Virus Removal / Software Fix", priceRange: "$59 – $99", turnaround: "Same day" },
      { name: "Data Recovery", priceRange: "Free diagnostic", turnaround: "Varies" },
      { name: "Liquid Damage Cleaning", priceRange: "From $89", turnaround: "24–72 hrs" },
    ],
  },
  {
    slug: "tablet",
    icon: Tablet,
    title: "Tablet & iPad Repair",
    shortLabel: "tablet",
    description: "Screen, battery, and charging repairs for iPads and Android tablets.",
    repairs: [
      { name: "Screen Repair", priceRange: "$89 – $229", turnaround: "Same day" },
      { name: "Battery Replacement", priceRange: "$69 – $129", turnaround: "Same day" },
      { name: "Charging Port Repair", priceRange: "$59 – $99", turnaround: "Same day" },
    ],
  },
  {
    slug: "console",
    icon: Gamepad2,
    title: "Game Console Repair",
    shortLabel: "console",
    description: "PlayStation, Xbox, Switch, and yes — we still fix your old PSP, DS, and Wii U.",
    repairs: [
      { name: "HDMI Port Repair", priceRange: "$49 – $99", turnaround: "1–2 days" },
      { name: "Disc Drive Repair", priceRange: "$59 – $119", turnaround: "1–2 days" },
      { name: "Overheating / Fan Cleaning", priceRange: "$39 – $69", turnaround: "Same day" },
      { name: "Controller Repair", priceRange: "$29 – $59", turnaround: "Same day" },
    ],
  },
  {
    slug: "buyback",
    icon: Recycle,
    title: "Gadget Buyback & Recycling",
    shortLabel: "device",
    description:
      "Trade in your old device for cash on the spot, or drop it off for responsible e-waste recycling — free, no purchase necessary.",
    repairs: [],
  },
  {
    slug: "retail",
    icon: ShoppingBag,
    title: "Retail",
    shortLabel: "device",
    description:
      "Refurbished phones and accessories, tested in-house and backed by our 60-day return window.",
    repairs: [],
    ctaHref: "/retail",
    ctaLabel: "Shop Refurbished",
    ctaBody: "See what's in stock at each shop right now.",
  },
  {
    slug: "consult",
    icon: Users,
    title: "Consult a Geek",
    shortLabel: "device",
    description:
      "Not sure what's wrong with your device? Walk in — we'll diagnose it in person, free, no appointment needed.",
    repairs: [],
  },
];
