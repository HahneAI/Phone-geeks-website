import type { Metadata } from "next";
import { ServicesHero } from "@/components/services/services-hero";
import { CategoryNav } from "@/components/services/category-nav";
import { CategorySection } from "@/components/services/category-section";
import { CtaBanner } from "@/components/home/cta-banner";
import { SERVICE_CATEGORIES } from "@/lib/services-data";

export const metadata: Metadata = {
  title: "Services & Pricing | Phone Geeks",
  description:
    "Phone, tablet, Macbook, computer, and game console repair pricing and turnaround times at Phone Geeks in St. Louis.",
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <CategoryNav />
      <div>
        {SERVICE_CATEGORIES.map((category, index) => (
          <div
            key={category.slug}
            className={index % 2 === 1 ? "bg-surface-muted" : undefined}
          >
            <CategorySection category={category} />
          </div>
        ))}
      </div>
      <CtaBanner />
    </>
  );
}
