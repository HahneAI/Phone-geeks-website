"use server";

import { revalidatePath } from "next/cache";
import { updateItemStock, type UpdateStockResult } from "@/lib/retail-store";

export async function saveItemStock(
  itemId: string,
  stock: Record<string, number>
): Promise<UpdateStockResult> {
  const result = await updateItemStock(itemId, stock);
  if (result.ok) {
    // Both /management/stock and the public /retail page read this
    // table — a saved count should show up in both without a manual
    // refresh being the only way to see it.
    revalidatePath("/management/stock");
    revalidatePath("/retail");
  }
  return result;
}
