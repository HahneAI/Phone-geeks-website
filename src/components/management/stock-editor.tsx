"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RetailItem } from "@/lib/retail-data";
import type { StoreLocation } from "@/lib/locations";
import { saveItemStock } from "@/app/management/(dashboard)/stock/actions";

type RowState = "idle" | "saving" | "saved" | "error";

/**
 * Per-item, per-location stock count editor. One row per item, one
 * number input per location, a Save button per row (row-level rather
 * than one big "save everything" button — a shop employee correcting a
 * single count shouldn't have to worry about every other row's draft
 * state). Only touches the `stock` column via saveItemStock(); adding/
 * removing items or editing name/price/condition stays a Supabase
 * table-editor task, per the page's own note above this component.
 */
export function StockEditor({
  items,
  locations,
  editable,
}: {
  items: RetailItem[];
  locations: StoreLocation[];
  editable: boolean;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/40">
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 font-medium">Price</th>
            {locations.map((loc) => (
              <th key={loc.slug} className="px-4 py-3 font-medium">
                {loc.name}
              </th>
            ))}
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <StockRow
              key={item.id}
              item={item}
              locations={locations}
              editable={editable}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockRow({
  item,
  locations,
  editable,
}: {
  item: RetailItem;
  locations: StoreLocation[];
  editable: boolean;
}) {
  // "" is a real, distinct draft value (mid-edit, field cleared) — not
  // silently 0. Coercing it to 0 here would fight the input: clearing
  // the field to retype a new count would immediately snap back to "0"
  // instead of letting the field sit empty.
  const [draft, setDraft] = useState<Record<string, number | "">>(item.stock);
  const [state, setState] = useState<RowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = locations.some(
    (loc) => (draft[loc.slug] ?? 0) !== (item.stock[loc.slug] ?? 0)
  );

  function handleChange(slug: string, value: string) {
    if (value === "") {
      setDraft((d) => ({ ...d, [slug]: "" }));
      setState("idle");
      return;
    }
    const n = Math.max(0, Math.floor(Number(value)));
    if (Number.isNaN(n)) return;
    setDraft((d) => ({ ...d, [slug]: n }));
    setState("idle");
  }

  function handleSave() {
    // A field left blank saves as 0 — the input itself snaps back to
    // "0" afterward too, since that's genuinely what got saved.
    const normalized: Record<string, number> = {};
    for (const loc of locations) {
      const value = draft[loc.slug];
      normalized[loc.slug] = value === "" || value === undefined ? 0 : value;
    }

    startTransition(async () => {
      setState("saving");
      setError(null);
      const result = await saveItemStock(item.id, normalized);
      if (result.ok) {
        setDraft(normalized);
        setState("saved");
        setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 1500);
      } else {
        setState("error");
        setError(result.error);
      }
    });
  }

  return (
    <tr className="border-b border-black/5 last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-brand-navy">{item.name}</p>
        {item.condition ? (
          <p className="text-xs text-black/40">{item.condition} condition</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-black/70">${item.price}</td>
      {locations.map((loc) => (
        <td key={loc.slug} className="px-4 py-3">
          <input
            type="number"
            min={0}
            step={1}
            disabled={!editable}
            value={draft[loc.slug] ?? 0}
            onChange={(e) => handleChange(loc.slug, e.target.value)}
            className={cn(
              "w-16 rounded-lg border border-black/15 px-2 py-1 text-sm tabular-nums",
              "focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
              !editable && "cursor-not-allowed bg-black/5 text-black/40"
            )}
          />
        </td>
      ))}
      <td className="px-4 py-3 text-right">
        {editable ? (
          <div className="flex items-center justify-end gap-2">
            {error ? (
              <span className="text-xs text-brand-red" title={error}>
                Failed
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || isPending}
              className={cn(
                "flex h-8 min-w-16 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                dirty && !isPending
                  ? "bg-brand-navy text-white hover:bg-brand-navy-dark"
                  : "bg-black/5 text-black/30",
                state === "saved" && "bg-green-600 text-white"
              )}
              aria-label={
                state === "saved" ? "Saved" : `Save ${item.name} stock`
              }
            >
              {state === "saving" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : state === "saved" ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}
