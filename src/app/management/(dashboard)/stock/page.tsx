import type { Metadata } from "next";
import { getRetailItems } from "@/lib/retail-store";
import { LOCATIONS } from "@/lib/locations";
import { StockEditor } from "@/components/management/stock-editor";

export const metadata: Metadata = {
  title: "Stock | Phone Geeks Management",
  robots: { index: false, follow: false },
};

// Real stock counts change out from under this page — never serve a
// stale snapshot.
export const dynamic = "force-dynamic";

export default async function ManagementStockPage() {
  const { items, durable } = await getRetailItems();

  return (
    <div>
      <p className="text-xs text-black/40">
        Editing stock counts only — adding a new item, changing its price
        or condition, or retiring one is still a Supabase table-editor
        task for now (see <code>src/lib/retail-store.ts</code>).
      </p>

      {!durable ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Supabase isn&rsquo;t configured on this deployment, so these are
          the static demo counts and can&rsquo;t be saved from here yet.
          Set up the <code>retail_items</code> table (see{" "}
          <code>src/lib/retail-store.ts</code>) to make this real.
        </p>
      ) : null}

      <StockEditor items={items} locations={LOCATIONS} editable={durable} />
    </div>
  );
}
