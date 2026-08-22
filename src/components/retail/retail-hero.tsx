import { PackageSearch } from "lucide-react";

export function RetailHero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.35), transparent 40%), radial-gradient(circle at 85% 0%, rgba(224,51,44,0.25), transparent 45%)",
        }}
      />
      <PackageSearch
        className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 -rotate-12 text-white/[0.06] sm:-right-6 sm:-top-16 sm:h-72 sm:w-72 lg:right-8 lg:top-8 lg:h-96 lg:w-96"
        strokeWidth={1}
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
        <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/80">
          Demo feature
        </span>
        <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Refurbished phones &amp; accessories
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
          Tested in-house, backed by our 60-day return window. Check what
          each shop has on the shelf before you drive over.
        </p>
      </div>
    </section>
  );
}
