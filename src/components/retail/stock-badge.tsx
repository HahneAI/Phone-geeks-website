import { cn } from "@/lib/utils";
import { getStockStatus } from "@/lib/retail-data";

const LABELS: Record<ReturnType<typeof getStockStatus>, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

const STYLES: Record<ReturnType<typeof getStockStatus>, string> = {
  "in-stock": "bg-green-100 text-green-700",
  "low-stock": "bg-amber-100 text-amber-700",
  "out-of-stock": "bg-muted-foreground/10 text-muted-foreground",
};

const DOT_STYLES: Record<ReturnType<typeof getStockStatus>, string> = {
  "in-stock": "bg-green-600",
  "low-stock": "bg-amber-600",
  "out-of-stock": "bg-muted-foreground",
};

export function StockBadge({ count }: { count: number }) {
  const status = getStockStatus(count);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[status]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[status])} />
      {LABELS[status]}
      {status !== "out-of-stock" && ` · ${count} left`}
    </span>
  );
}
