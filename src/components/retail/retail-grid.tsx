"use client";

import { useState } from "react";
import { Smartphone, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RETAIL_ITEMS, type RetailItem } from "@/lib/retail-data";
import { LOCATIONS } from "@/lib/locations";
import { StockBadge } from "./stock-badge";

type LocationFilter = "all" | string;

export function RetailGrid() {
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");

  const phones = RETAIL_ITEMS.filter((item) => item.category === "phone");
  const accessories = RETAIL_ITEMS.filter((item) => item.category === "accessory");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <FilterPill
          label="Both Shops"
          active={locationFilter === "all"}
          onClick={() => setLocationFilter("all")}
        />
        {LOCATIONS.map((loc) => (
          <FilterPill
            key={loc.slug}
            label={loc.name}
            active={locationFilter === loc.slug}
            onClick={() => setLocationFilter(loc.slug)}
          />
        ))}
      </div>

      <ProductSection title="Refurbished Phones & Tablets" items={phones} locationFilter={locationFilter} />
      <ProductSection title="Accessories" items={accessories} locationFilter={locationFilter} />
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-red bg-brand-red/10 text-brand-red"
          : "border-border text-brand-navy hover:border-brand-red/50"
      )}
    >
      {label}
    </button>
  );
}

function ProductSection({
  title,
  items,
  locationFilter,
}: {
  title: string;
  items: RetailItem[];
  locationFilter: LocationFilter;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-brand-navy">{title}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} locationFilter={locationFilter} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
  item,
  locationFilter,
}: {
  item: RetailItem;
  locationFilter: LocationFilter;
}) {
  const displayedCount =
    locationFilter === "all"
      ? Object.values(item.stock).reduce((sum, n) => sum + n, 0)
      : (item.stock[locationFilter] ?? 0);

  const otherLocation =
    locationFilter !== "all"
      ? LOCATIONS.find((l) => l.slug !== locationFilter)
      : null;
  const otherCount = otherLocation ? item.stock[otherLocation.slug] ?? 0 : 0;

  return (
    <Card className="flex flex-col items-center p-6 text-center transition-all hover:-translate-y-1 hover:border-brand-red/40 hover:shadow-md">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        {item.category === "phone" ? (
          <Smartphone className="h-6 w-6" strokeWidth={2} />
        ) : (
          <Package className="h-6 w-6" strokeWidth={2} />
        )}
      </span>
      <h3 className="mt-4 font-semibold text-brand-navy">{item.name}</h3>
      {item.condition && (
        <span className="mt-1 text-xs font-medium text-brand-blue">
          {item.condition} condition
        </span>
      )}
      <p className="mt-2 text-lg font-bold text-brand-navy">${item.price}</p>

      <div className="mt-3">
        <StockBadge count={displayedCount} />
      </div>

      {otherLocation && otherCount > 0 && displayedCount !== otherCount && (
        <p className="mt-2 text-xs text-muted-foreground">
          {otherCount} more at {otherLocation.name}
        </p>
      )}
    </Card>
  );
}
