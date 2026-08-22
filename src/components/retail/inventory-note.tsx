import { Database } from "lucide-react";

export function InventoryNote() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border-2 border-brand-blue/20 bg-brand-blue-light px-6 py-5 sm:px-8 sm:py-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white">
          <Database className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        <div>
          <p className="font-semibold text-brand-navy">
            Today: a static snapshot
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-navy/80">
            These counts are hand-entered demo data, not a live feed. A
            real version of this page would read straight from the shop&rsquo;s
            actual point-of-sale/inventory system across both locations, so
            what you see here always matches what&rsquo;s really on the
            shelf — the retail &amp; parts inventory system on the roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}
