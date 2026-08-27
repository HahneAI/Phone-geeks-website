import { Database } from "lucide-react";

export function InventoryNote({ durable }: { durable: boolean }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border-2 border-brand-blue/20 bg-brand-blue-light px-6 py-5 sm:px-8 sm:py-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white">
          <Database className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        <div>
          {durable ? (
            <>
              <p className="font-semibold text-brand-navy">
                Real, owner-editable stock
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-navy/80">
                These counts come straight from Phone Geeks&rsquo; own
                Supabase table, per location — update a count there and it
                shows up here (and to the phone agent, which checks the
                same numbers) within a minute, no code or redeploy needed.
                Not yet synced from a real point-of-sale system across both
                locations, so someone still has to update it by hand for
                now.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-brand-navy">
                Today: a static snapshot
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-navy/80">
                These counts are hand-entered demo data, not a live feed —
                Supabase isn&rsquo;t configured for this deployment yet
                (see <code>src/lib/retail-store.ts</code>). Once it is,
                this page and the phone agent both read real,
                owner-editable stock per location instead.
              </p>
            </>
          )}
          <p className="mt-2.5 text-sm leading-relaxed text-brand-navy/80">
            Paired with AI-driven stock handling, it could go a step
            further and act on its own: keep a floor like &ldquo;never
            below 10 USB-C chargers at either shop&rdquo; and automatically
            place a reorder with a nearby vendor the moment a count dips
            under it — no one has to notice the shelf is getting thin.
          </p>
        </div>
      </div>
    </div>
  );
}
